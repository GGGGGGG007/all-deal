"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaignPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      slug: String(form.get("slug")),
      title: String(form.get("title")),
      description: String(form.get("description") || "") || undefined,
      imageUrl: String(form.get("imageUrl") || "") || undefined,
      unitPrice: Number(form.get("unitPrice")),
      targetCount: Number(form.get("targetCount") || 100),
      deadlineAt: new Date(String(form.get("deadlineAt"))).toISOString(),
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "생성에 실패했습니다.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 text-xl font-bold">새 캠페인 만들기</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          슬러그 (URL, 영문 소문자/숫자/하이픈)
          <input name="slug" required pattern="[a-z0-9-]+" className="rounded border px-3 py-2" placeholder="milk-0921" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          상품명
          <input name="title" required className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          설명
          <textarea name="description" className="rounded border px-3 py-2" rows={3} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          이미지 URL
          <input name="imageUrl" type="url" className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          공동구매 확정가 (원)
          <input name="unitPrice" type="number" required min={1} className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          목표 인원
          <input name="targetCount" type="number" defaultValue={100} min={1} className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          마감 일시
          <input name="deadlineAt" type="datetime-local" required className="rounded border px-3 py-2" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {loading ? "생성 중..." : "생성"}
        </button>
      </form>
    </main>
  );
}
