// 토스 카드등록 위젯은 페이지를 완전히 이동(redirect)시키므로, React 상태가 날아간다.
// OTP 인증 결과와 customerKey를 sessionStorage에 잠깐 보관해뒀다가 콜백 페이지에서 이어받는다.
export interface PendingJoin {
  campaignId: string;
  slug: string;
  phoneNumber: string;
  verificationToken: string;
  customerKey: string;
}

function key(slug: string) {
  return `pending-join:${slug}`;
}

export function savePendingJoin(data: PendingJoin) {
  sessionStorage.setItem(key(data.slug), JSON.stringify(data));
}

export function loadPendingJoin(slug: string): PendingJoin | null {
  const raw = sessionStorage.getItem(key(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingJoin;
  } catch {
    return null;
  }
}

export function clearPendingJoin(slug: string) {
  sessionStorage.removeItem(key(slug));
}

export interface JoinResult {
  queuePosition: number;
  campaignStatus: string;
}

export function saveJoinResult(slug: string, result: JoinResult) {
  sessionStorage.setItem(`join-result:${slug}`, JSON.stringify(result));
}

export function loadJoinResult(slug: string): JoinResult | null {
  const raw = sessionStorage.getItem(`join-result:${slug}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JoinResult;
  } catch {
    return null;
  }
}
