"use client";

import { useState } from "react";
import { isKakaoShareAvailable, shareToKakao } from "@/lib/kakaoShare";

export default function ShareButton({
  title,
  description,
  url,
  compact = false,
}: {
  title: string;
  description?: string;
  url: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [kakaoError, setKakaoError] = useState<string | null>(null);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 사용자가 취소한 경우 등 - 아래 복사 로직으로 폴백
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleKakaoShare() {
    setKakaoError(null);
    try {
      await shareToKakao({ title, description, url });
    } catch (e) {
      setKakaoError((e as Error).message);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isKakaoShareAvailable() && (
          <button
            onClick={handleKakaoShare}
            className="rounded-full bg-[#FEE500] px-3.5 py-1.5 text-sm font-bold text-black"
          >
            카카오톡 공유
          </button>
        )}
        <button
          onClick={handleShare}
          className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink"
        >
          {copied ? "복사됨!" : "링크 공유"}
        </button>
        {kakaoError && <span className="text-xs text-red-600">{kakaoError}</span>}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      {isKakaoShareAvailable() && (
        <button
          onClick={handleKakaoShare}
          className="w-full rounded-2xl bg-[#FEE500] px-4 py-4 font-bold text-black"
        >
          카카오톡으로 공유하기
        </button>
      )}
      {kakaoError && <p className="text-sm font-medium text-red-600">{kakaoError}</p>}
      <button onClick={handleShare} className="w-full rounded-2xl bg-accent px-4 py-4 font-bold text-white">
        {copied ? "링크가 복사됐어요!" : "링크 복사 / 다른 방법으로 공유하기"}
      </button>
    </div>
  );
}
