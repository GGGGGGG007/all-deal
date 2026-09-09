import { NextRequest, NextResponse } from "next/server";
import { runBatchCharge } from "@/lib/batchCharge";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { campaignId } = await req.json();
  if (typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId가 필요합니다." }, { status: 400 });
  }

  try {
    await runBatchCharge(campaignId);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
