"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadJoinResult } from "@/lib/joinSession";
import { statusLabel, formatCurrency } from "@/lib/format";
import type { Campaign } from "@/types/database";
import ShareButton from "../ShareButton";

const POLL_INTERVAL_MS = 4000;

export default function CompletePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [queuePosition] = useState<number | null>(() =>
    typeof window === "undefined" ? null : (loadJoinResult(slug)?.queuePosition ?? null)
  );
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/campaigns/${slug}` : "";

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/campaigns/${slug}`, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) setCampaign(data.campaign);
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">참여가 완료됐어요!</h1>
      {queuePosition !== null && (
        <p className="text-gray-600">
          현재 <span className="font-bold">{queuePosition}번째</span> 참여자예요.
        </p>
      )}

      {campaign && (
        <div className="w-full rounded border p-4 text-left">
          <p className="font-semibold">{campaign.title}</p>
          <p className="text-sm text-gray-500">
            {formatCurrency(campaign.unit_price)} · {campaign.current_count}/{campaign.target_count}명 모임
          </p>
          <p className="mt-1 text-sm font-medium">{statusLabel(campaign.status)}</p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        목표 인원이 다 모이면 등록하신 카드로 자동 결제되고, 마감까지 못 모이면 결제 없이 취소돼요.
        더 빨리 확정되게 하려면 링크를 친구들에게 공유해보세요!
      </p>

      <ShareButton
        title={campaign?.title ?? "공동구매"}
        description={
          campaign
            ? `${formatCurrency(campaign.unit_price)} · ${campaign.current_count}/${campaign.target_count}명 모임`
            : undefined
        }
        url={shareUrl}
      />
    </main>
  );
}
