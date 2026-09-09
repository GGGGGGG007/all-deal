import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/auth/adminSession";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!hash) {
    return NextResponse.json({ error: "관리자 비밀번호가 설정되지 않았습니다." }, { status: 500 });
  }

  if (typeof password !== "string" || !(await bcrypt.compare(password, hash))) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
