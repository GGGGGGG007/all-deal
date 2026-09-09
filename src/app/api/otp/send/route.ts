import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOtpSchema, normalizePhoneNumber } from "@/lib/validation";
import { sendOtpSms } from "@/lib/sms/otp";

const OTP_TTL_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 10;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let phoneNumber: string;
  try {
    phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { campaignId } = parsed.data;
  const supabase = createServiceClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, status, deadline_at")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "캠페인을 찾을 수 없습니다." }, { status: 404 });
  }
  if (campaign.status !== "recruiting" || new Date(campaign.deadline_at) < new Date()) {
    return NextResponse.json({ error: "지금은 참여할 수 없는 캠페인입니다." }, { status: 409 });
  }

  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("otp_requests")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("phone_number", phoneNumber)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { error: "인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("otp_requests").insert({
    campaign_id: campaignId,
    phone_number: phoneNumber,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    await sendOtpSms(phoneNumber, code);
  } catch (e) {
    return NextResponse.json({ error: `SMS 발송 실패: ${(e as Error).message}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
