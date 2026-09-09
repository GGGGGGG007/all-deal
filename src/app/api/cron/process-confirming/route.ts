import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runBatchCharge } from "@/lib/batchCharge";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// 안전망: confirming/charging 상태에 멈춰 있는 캠페인(예: 서버리스 인스턴스가 배치 승인
// 도중 종료된 경우)을 찾아 재개한다. runBatchCharge는 이미 처리된 참여자를 건너뛰므로 멱등하다.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: stuckCampaigns, error } = await supabase
    .from("campaigns")
    .select("id")
    .in("status", ["confirming", "charging"])
    .is("confirmed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (stuckCampaigns ?? []).map((c) => runBatchCharge(c.id))
  );

  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed: results.length, failed });
}
