import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime, statusLabel } from "@/lib/format";
import type { Campaign } from "@/types/database";
import JoinFlow from "./JoinFlow";
import ShareButton from "./ShareButton";

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

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      {campaign.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={campaign.image_url} alt={campaign.title} className="mb-4 w-full rounded-lg object-cover" />
      )}
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold">{campaign.title}</h1>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{statusLabel(campaign.status)}</span>
      </div>
      {campaign.description && <p className="mb-4 text-gray-600">{campaign.description}</p>}

      <div className="mb-4">
        <ShareButton
          title={campaign.title}
          description={`${formatCurrency(campaign.unit_price)} · ${campaign.current_count}/${campaign.target_count}명 모임`}
          url={`${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/${campaign.slug}`}
          compact
        />
      </div>

      <p className="mb-2 text-2xl font-bold">{formatCurrency(campaign.unit_price)}</p>
      <p className="mb-1 text-sm text-gray-500">
        {campaign.target_count}명이 모이면 이 가격으로 확정돼요
      </p>

      <div className="my-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-black" style={{ width: `${percent}%` }} />
      </div>
      <p className="mb-6 text-sm text-gray-500">
        {campaign.current_count}/{campaign.target_count}명 모임 · 마감 {formatDateTime(campaign.deadline_at)}
      </p>

      <JoinFlow campaign={campaign} />
    </main>
  );
}
