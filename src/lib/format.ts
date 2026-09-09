import type { CampaignStatus } from "@/types/database";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  recruiting: "모집 중",
  confirming: "마감 처리 중",
  charging: "결제 진행 중",
  confirmed: "확정됨",
  failed: "취소됨",
};

export function statusLabel(status: CampaignStatus): string {
  return STATUS_LABELS[status] ?? status;
}
