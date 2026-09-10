import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { discountPercent, formatCurrency, formatDateTime, statusLabel } from "@/lib/format";
import type { Campaign } from "@/types/database";
import JoinFlow from "./JoinFlow";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: campaign } = (await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .single()) as { data: Campaign | null };

  if (!campaign) {
    notFound();
  }

  const percent = Math.min(100, Math.round((campaign.current_count / campaign.target_count) * 100));
  const remaining = Math.max(0, campaign.target_count - campaign.current_count);
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/${campaign.slug}`;

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6L9 12L15 18" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-ink">모두의공구</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="relative h-56 w-full bg-line">
          {campaign.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campaign.image_url} alt={campaign.title} className="h-full w-full object-cover" />
          )}
          {campaign.regular_price && (
            <div className="absolute top-0 left-0 rounded-br-2xl bg-accent px-4 py-2.5 shadow-lg">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                -{discountPercent(campaign.regular_price, campaign.unit_price)}%
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <span className="mb-3 inline-block rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
            {statusLabel(campaign.status)}
          </span>

          <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">{campaign.title}</h1>
          {campaign.description && (
            <p className="mb-5 text-sm leading-relaxed text-muted">{campaign.description}</p>
          )}

          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-ink">
              {formatCurrency(campaign.unit_price)}
            </span>
            {campaign.regular_price && (
              <span className="text-base font-medium text-mid line-through">
                {formatCurrency(campaign.regular_price)}
              </span>
            )}
          </div>
          <p className="mb-6 text-sm font-semibold text-accent">
            {campaign.target_count}명이 모이면 이 가격으로 확정돼요
          </p>

          <div className="mb-6 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">{campaign.current_count}명 참여 중</span>
              <span className="text-sm font-semibold text-muted">{remaining}명 남음</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-app px-4 py-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#b0aea5" strokeWidth="1.6" />
              <path d="M12 7V12L15 14" stroke="#b0aea5" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-subtle">
              마감 {formatDateTime(campaign.deadline_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <JoinFlow campaign={campaign} shareUrl={shareUrl} />
      </div>
    </main>
  );
}
