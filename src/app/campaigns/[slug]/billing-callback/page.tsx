"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { loadPendingJoin, clearPendingJoin, saveJoinResult } from "@/lib/joinSession";

export default function BillingCallbackPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = params.slug;
    const authKey = searchParams.get("authKey");
    const customerKey = searchParams.get("customerKey");

    async function run() {
      if (!authKey || !customerKey) {
        setError("잘못된 접근입니다. 카드 등록 정보가 없습니다.");
        return;
      }

      const pending = loadPendingJoin(slug);
      if (!pending || pending.customerKey !== customerKey) {
        setError("참여 세션이 만료되었습니다. 처음부터 다시 시도해주세요.");
        return;
      }

      const res = await fetch("/api/billing/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: pending.campaignId,
          phoneNumber: pending.phoneNumber,
          authKey,
          customerKey,
          verificationToken: pending.verificationToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "참여 처리에 실패했습니다.");
        return;
      }

      clearPendingJoin(slug);
      saveJoinResult(slug, { queuePosition: data.queuePosition, campaignStatus: data.campaignStatus });
      router.replace(`/campaigns/${slug}/complete`);
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <p className="mb-4 font-medium text-red-600">{error}</p>
          <a href={`/campaigns/${params.slug}`} className="font-semibold text-accent underline">
            캠페인으로 돌아가기
          </a>
        </>
      ) : (
        <p className="text-muted">참여 처리 중입니다...</p>
      )}
    </main>
  );
}
