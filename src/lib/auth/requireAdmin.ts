import "server-only";
import { NextRequest } from "next/server";
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/auth/adminSession";

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}
