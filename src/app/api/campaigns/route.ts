import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createCampaignSchema } from "@/lib/validation";
import { isAdminRequest } from "@/lib/auth/requireAdmin";

// 공개: 캠페인 목록 (최신순)
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data });
}

// 관리자 전용: 캠페인 생성
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, title, description, imageUrl, unitPrice, targetCount, deadlineAt } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      slug,
      title,
      description: description ?? null,
      image_url: imageUrl ?? null,
      unit_price: unitPrice,
      target_count: targetCount,
      deadline_at: new Date(deadlineAt).toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "이미 사용 중인 슬러그입니다." : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ campaign: data }, { status: 201 });
}
