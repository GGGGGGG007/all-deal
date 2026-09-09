import "server-only";
import { SignJWT, jwtVerify } from "jose";

const TTL_SECONDS = 10 * 60; // 10분 - 이 안에 카드 등록까지 마쳐야 함

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return new TextEncoder().encode(secret);
}

interface VerificationPayload {
  campaignId: string;
  phoneNumber: string;
}

// OTP 인증 성공 시 발급 - "이 전화번호는 이 캠페인에 대해 인증됨"을 짧게 증명하는 토큰
export async function createVerificationToken(payload: VerificationPayload): Promise<string> {
  return new SignJWT({ ...payload, purpose: "phone-verified" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyVerificationToken(
  token: string,
  expected: VerificationPayload
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return (
      payload.purpose === "phone-verified" &&
      payload.campaignId === expected.campaignId &&
      payload.phoneNumber === expected.phoneNumber
    );
  } catch {
    return false;
  }
}
