import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime, statusLabel } from "@/lib/format";
import type { Campaign } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();
  const { data: campaigns } = (await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })) as { data: Campaign[] | null };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">캠페인 관리</h1>
        <Link href="/admin/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          + 새 캠페인
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {(campaigns ?? []).map((c) => (
          <div key={c.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{c.title}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{statusLabel(c.status)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {c.current_count}/{c.target_count}명 · {formatCurrency(c.unit_price)} · 마감{" "}
              {formatDateTime(c.deadline_at)}
            </p>
            <div className="mt-2 flex gap-3 text-sm">
              <Link href={`/campaigns/${c.slug}`} className="text-blue-600 underline">
                공개 페이지 보기
              </Link>
            </div>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <p className="text-sm text-gray-500">아직 생성된 캠페인이 없습니다.</p>
        )}
      </div>
    </main>
  );
}
