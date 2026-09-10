"use client";

import { useState } from "react";
import { isKakaoShareAvailable, shareToKakao } from "@/lib/kakaoShare";

export default function ShareButton({
  title,
  description,
  url,
  variant = "full",
}: {
  title: string;
  description?: string;
  url: string;
  variant?: "full" | "compact" | "link";
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

  if (variant === "link") {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={isKakaoShareAvailable() ? handleKakaoShare : handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="#7a7768" strokeWidth="1.6" />
            <path d="M17.5 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="#7a7768" strokeWidth="1.6" />
            <path d="M17.5 19.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="#7a7768" strokeWidth="1.6" />
            <path d="M15.2 7.9l-4.9 2.9M10.3 13.2l4.9 2.9" stroke="#7a7768" strokeWidth="1.6" />
          </svg>
          {copied ? "링크가 복사됐어요!" : "친구에게 공유하기"}
        </button>
        {kakaoError && <span className="text-xs text-red-600">{kakaoError}</span>}
      </div>
    );
  }

  if (variant === "compact") {
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
