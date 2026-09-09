import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { billingIssueSchema, normalizePhoneNumber } from "@/lib/validation";
import { verifyVerificationToken } from "@/lib/auth/verificationToken";
import { issueBillingKey } from "@/lib/toss/billing";
import { runBatchCharge } from "@/lib/batchCharge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = billingIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let phoneNumber: string;
  try {
    phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { campaignId, authKey, customerKey, verificationToken } = parsed.data;

  const tokenValid = await verifyVerificationToken(verificationToken, { campaignId, phoneNumber });
  if (!tokenValid) {
    return NextResponse.json(
      { error: "전화번호 인증이 만료되었거나 유효하지 않습니다. 처음부터 다시 시도해주세요." },
      { status: 401 }
    );
  }

  let billingKey: string;
  try {
    const issued = await issueBillingKey(authKey, customerKey);
    billingKey = issued.billingKey;
  } catch (e) {
    return NextResponse.json({ error: `카드 등록 실패: ${(e as Error).message}` }, { status: 502 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("join_campaign", {
    p_campaign_id: campaignId,
    p_phone_number: phoneNumber,
    p_billing_key: billingKey,
    p_customer_key: customerKey,
  });

  if (error) {
    const knownErrors: Record<string, { message: string; status: number }> = {
      CAMPAIGN_NOT_FOUND: { message: "캠페인을 찾을 수 없습니다.", status: 404 },
      CAMPAIGN_NOT_OPEN: { message: "이미 마감되었거나 참여할 수 없는 캠페인입니다.", status: 409 },
      CAMPAIGN_EXPIRED: { message: "참여 마감 시간이 지났습니다.", status: 409 },
      ALREADY_JOINED: { message: "이미 참여하신 캠페인입니다.", status: 409 },
    };
    const known = Object.entries(knownErrors).find(([code]) => error.message.includes(code));
    if (known) {
      return NextResponse.json({ error: known[1].message }, { status: known[1].status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data?.[0];
  if (!result) {
    return NextResponse.json({ error: "참여 처리 중 알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }

  if (result.campaign_status === "confirming") {
    // 100번째 참여자 - 응답은 즉시 반환하고, 100명분 카드 승인은 백그라운드에서 처리한다.
    after(() => runBatchCharge(campaignId));
  }

  return NextResponse.json({
    queuePosition: result.queue_position,
    campaignStatus: result.campaign_status,
  });
}
