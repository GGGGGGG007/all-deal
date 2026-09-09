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
            className="rounded bg-[#FEE500] px-3 py-1.5 text-sm font-medium text-black"
          >
            카카오톡 공유
          </button>
        )}
        <button onClick={handleShare} className="rounded border px-3 py-1.5 text-sm">
          {copied ? "복사됨!" : "링크 공유"}
        </button>
        {kakaoError && <span className="text-xs text-red-600">{kakaoError}</span>}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {isKakaoShareAvailable() && (
        <button
          onClick={handleKakaoShare}
          className="w-full rounded bg-[#FEE500] px-3 py-2 font-medium text-black"
        >
          카카오톡으로 공유하기
        </button>
      )}
      {kakaoError && <p className="text-sm text-red-600">{kakaoError}</p>}
      <button onClick={handleShare} className="w-full rounded bg-black px-3 py-2 text-white">
        {copied ? "링크가 복사됐어요!" : "링크 복사 / 다른 방법으로 공유하기"}
      </button>
    </div>
  );
}
