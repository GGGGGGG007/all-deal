"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import type { Campaign } from "@/types/database";
import { statusLabel } from "@/lib/format";
import { savePendingJoin } from "@/lib/joinSession";

type Step = "phone" | "otp" | "ready";

export default function JoinFlow({ campaign }: { campaign: Campaign }) {
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (campaign.status !== "recruiting") {
    return (
      <p className="rounded border bg-gray-50 p-4 text-center text-gray-600">
        이 캠페인은 현재 {statusLabel(campaign.status)} 상태라 참여할 수 없어요.
      </p>
    );
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id, phoneNumber }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "인증번호 발송에 실패했습니다.");
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id, phoneNumber, code }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "인증에 실패했습니다.");
      return;
    }
    setVerificationToken(data.verificationToken);
    setStep("ready");
  }

  async function handleRegisterCard() {
    if (!verificationToken) return;
    setError(null);
    setLoading(true);

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("결제 설정이 완료되지 않았습니다.");

      const customerKey = nanoid(24);
      savePendingJoin({
        campaignId: campaign.id,
        slug: campaign.slug,
        phoneNumber,
        verificationToken,
        customerKey,
      });

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey });

      const origin = window.location.origin;
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${origin}/campaigns/${campaign.slug}/billing-callback`,
        failUrl: `${origin}/campaigns/${campaign.slug}?billingFailed=1`,
      });
      // 성공/실패 시 브라우저가 successUrl/failUrl로 이동하므로 이 아래 코드는 보통 실행되지 않는다.
    } catch (e) {
      setLoading(false);
      setError((e as Error).message || "카드 등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="rounded border p-4">
      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            휴대폰 번호
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01012345678"
              className="rounded border px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
            {loading ? "발송 중..." : "인증번호 받기"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            인증번호 (6자리)
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
            {loading ? "확인 중..." : "인증 확인"}
          </button>
        </form>
      )}

      {step === "ready" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            카드를 등록하면 참여가 완료돼요. 목표 인원이 모일 때까지는 결제되지 않고,
            {campaign.target_count}명이 모이는 순간 자동으로 결제가 진행됩니다.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleRegisterCard}
            disabled={loading}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {loading ? "이동 중..." : "카드 등록하고 참여하기"}
          </button>
        </div>
      )}
    </div>
  );
}
