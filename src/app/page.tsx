import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, statusLabel } from "@/lib/format";
import type { Campaign } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServiceClient();
  const { data: campaigns } = (await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })) as { data: Campaign[] | null };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold">진행 중인 공동구매</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {(campaigns ?? []).map((c) => {
          const percent = Math.min(100, Math.round((c.current_count / c.target_count) * 100));
          return (
            <Link
              key={c.id}
              href={`/campaigns/${c.slug}`}
              className="flex flex-col overflow-hidden rounded-lg border transition hover:shadow"
            >
              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt={c.title} className="h-40 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{c.title}</h2>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{statusLabel(c.status)}</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(c.unit_price)}</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-black" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-sm text-gray-500">
                  {c.current_count}/{c.target_count}명 모임
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {(!campaigns || campaigns.length === 0) && (
        <p className="text-gray-500">아직 진행 중인 공동구매가 없습니다.</p>
      )}
    </main>
  );
}
