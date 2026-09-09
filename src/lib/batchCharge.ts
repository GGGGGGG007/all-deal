import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { chargeBilling } from "@/lib/toss/billing";
import { nanoid } from "nanoid";
import type { Campaign, Participant } from "@/types/database";

const CHUNK_SIZE = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

// 100명 도달 시(또는 cron 안전망에 의해) 실행되는 일괄 승인 로직.
// 이미 처리된(charged/failed) 참여자는 건너뛰므로 여러 번 호출돼도 안전하다(멱등).
export async function runBatchCharge(campaignId: string): Promise<void> {
  const supabase = createServiceClient();

  // confirming -> charging 전환을 시도한다. 이미 charging/confirmed 등 다른 상태면
  // false를 반환하고 아무것도 하지 않는다 - 중복 트리거 방지.
  const { data: started, error: startError } = await supabase.rpc("start_charging", {
    p_campaign_id: campaignId,
  });

  if (startError) {
    throw new Error(`캠페인 상태 전환 실패: ${startError.message}`);
  }

  if (!started) {
    // 이미 다른 트리거가 처리 중이거나 완료된 상태 -> cron 안전망이 재개용으로 다시 호출된 경우일 수 있으니
    // 그래도 남은 pending 참여자가 있는지는 확인해서 처리를 이어간다.
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();

    if (!campaign || campaign.status !== "charging") {
      return;
    }
  }

  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaignData) {
    throw new Error("캠페인을 찾을 수 없습니다.");
  }
  const campaign = campaignData as Campaign;

  const { data: pendingParticipants, error: participantsError } = (await supabase
    .from("participants")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("charge_status", "pending")) as { data: Participant[] | null; error: { message: string } | null };

  if (participantsError) {
    throw new Error(`참여자 조회 실패: ${participantsError.message}`);
  }

  for (const batch of chunk(pendingParticipants ?? [], CHUNK_SIZE)) {
    await Promise.allSettled(
      batch.map(async (participant) => {
        const orderId = `${campaignId}-${participant.id}-${nanoid(8)}`;
        const result = await chargeBilling({
          billingKey: participant.billing_key,
          customerKey: participant.toss_customer_key,
          amount: campaign.unit_price,
          orderId,
          orderName: campaign.title,
        });

        if (result.success) {
          await supabase
            .from("participants")
            .update({
              charge_status: "charged",
              toss_payment_key: result.paymentKey,
              charge_attempted_at: new Date().toISOString(),
            })
            .eq("id", participant.id);
        } else {
          await supabase
            .from("participants")
            .update({
              charge_status: "failed",
              charge_error: result.errorMessage,
              charge_attempted_at: new Date().toISOString(),
            })
            .eq("id", participant.id);
        }
      })
    );
  }

  await supabase.rpc("finalize_campaign", { p_campaign_id: campaignId });
}
