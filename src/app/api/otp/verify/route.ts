import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyOtpSchema, normalizePhoneNumber } from "@/lib/validation";
import { createVerificationToken } from "@/lib/auth/verificationToken";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let phoneNumber: string;
  try {
    phoneNumber = normalizePhoneNumber(parsed.data.phoneNumber);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { campaignId, code } = parsed.data;
  const supabase = createServiceClient();

  const { data: otpRequest } = await supabase
    .from("otp_requests")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("phone_number", phoneNumber)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!otpRequest) {
    return NextResponse.json({ error: "발급된 인증번호가 없습니다. 다시 요청해주세요." }, { status: 404 });
  }

  if (new Date(otpRequest.expires_at) < new Date()) {
    return NextResponse.json({ error: "인증번호가 만료되었습니다. 다시 요청해주세요." }, { status: 410 });
  }

  if (otpRequest.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "시도 횟수를 초과했습니다. 다시 요청해주세요." }, { status: 429 });
  }

  const matches = await bcrypt.compare(code, otpRequest.code_hash);

  await supabase
    .from("otp_requests")
    .update({ attempts: otpRequest.attempts + 1 })
    .eq("id", otpRequest.id);

  if (!matches) {
    return NextResponse.json({ error: "인증번호가 올바르지 않습니다." }, { status: 401 });
  }

  await supabase.from("otp_requests").update({ verified: true }).eq("id", otpRequest.id);

  const verificationToken = await createVerificationToken({ campaignId, phoneNumber });

  return NextResponse.json({ verificationToken });
}
