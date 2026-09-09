import "server-only";

// 토스페이먼츠 자동결제(빌링) API 래퍼.
// 주의: 아래 엔드포인트/필드명은 현재(2026-09) 공개 문서 기준이며, 실제 코딩 직전에
// https://docs.tosspayments.com/guides/v2/billing 에서 최신 스펙을 반드시 재확인할 것.

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function authHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  }
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export interface IssueBillingKeyResult {
  billingKey: string;
  customerKey: string;
  card?: { company?: string; number?: string };
}

// 카드 등록 위젯 완료 후 콜백으로 받은 authKey를 실제 billingKey로 교환한다.
// 이 시점에는 과금이 발생하지 않는다 - 카드 등록만 이루어진다.
export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<IssueBillingKeyResult> {
  const res = await fetch(`${TOSS_API_BASE}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`빌링키 발급 실패: ${data.message ?? res.statusText}`);
  }

  return { billingKey: data.billingKey, customerKey: data.customerKey, card: data.card };
}

export interface ChargeBillingResult {
  success: boolean;
  paymentKey?: string;
  errorMessage?: string;
}

// 발급된 billingKey로 실제 승인(과금)을 요청한다. 100명 도달 시 일괄 호출되는 부분.
export async function chargeBilling(params: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}): Promise<ChargeBillingResult> {
  const res = await fetch(`${TOSS_API_BASE}/billing/${params.billingKey}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, errorMessage: data.message ?? res.statusText };
  }

  return { success: true, paymentKey: data.paymentKey };
}
