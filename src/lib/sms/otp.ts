import "server-only";

// SMS 발송 추상화. 기본은 알리고(https://smartsms.aligo.in) 예시이며,
// 네이버클라우드 SENS/Twilio Verify 등으로 손쉽게 교체 가능하도록 인터페이스만 고정한다.
// ALIGO_* 환경변수가 없으면 개발 편의를 위해 콘솔에 코드를 출력만 하고 성공 처리한다.
export async function sendOtpSms(phoneNumber: string, code: string): Promise<void> {
  const apiKey = process.env.ALIGO_API_KEY;
  const userId = process.env.ALIGO_USER_ID;
  const sender = process.env.ALIGO_SENDER;

  if (!apiKey || !userId || !sender) {
    console.warn(
      `[otp:dev-mode] SMS 공급자 미설정 - ${phoneNumber} 인증번호: ${code} (실제 발송되지 않음)`
    );
    return;
  }

  const body = new URLSearchParams({
    key: apiKey,
    user_id: userId,
    sender,
    receiver: phoneNumber,
    msg: `[공동구매] 인증번호는 ${code} 입니다.`,
    msg_type: "SMS",
  });

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`SMS 발송 실패: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { result_code?: number; message?: string };
  if (data.result_code !== undefined && data.result_code < 0) {
    throw new Error(`SMS 발송 실패: ${data.message ?? "알 수 없는 오류"}`);
  }
}
