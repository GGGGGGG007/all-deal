import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// 마감 기한이 지났는데도 목표 인원(target_count)에 도달하지 못한 캠페인을 자동 취소한다.
// 카드는 등록만 됐을 뿐 승인(과금)은 한 번도 걸리지 않았으므로 별도 환불 처리가 필요 없다.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("status", "recruiting")
    .lt("deadline_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expiredCount: data?.length ?? 0 });
}
