import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { discountPercent, formatCurrency, statusLabel } from "@/lib/format";
import type { Campaign } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServiceClient();
  const { data: campaigns } = (await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })) as { data: Campaign[] | null };

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-ink">진행 중인 공동구매</h1>

      <div className="grid gap-5 sm:grid-cols-2">
        {(campaigns ?? []).map((c) => {
          const percent = Math.min(100, Math.round((c.current_count / c.target_count) * 100));
          return (
            <Link
              key={c.id}
              href={`/campaigns/${c.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-md"
            >
              <div className="h-40 w-full bg-line">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-ink">{c.title}</h2>
                  <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                    {statusLabel(c.status)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {c.regular_price && (
                    <span className="rounded bg-accent px-1 py-0.5 text-xs font-extrabold text-white">
                      {discountPercent(c.regular_price, c.unit_price)}%
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-ink">{formatCurrency(c.unit_price)}</span>
                  {c.regular_price && (
                    <span className="text-sm text-mid line-through">{formatCurrency(c.regular_price)}</span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-sm font-medium text-muted">
                  {c.current_count}/{c.target_count}명 모임
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {(!campaigns || campaigns.length === 0) && (
        <p className="text-muted">아직 진행 중인 공동구매가 없습니다.</p>
      )}
    </main>
  );
}
