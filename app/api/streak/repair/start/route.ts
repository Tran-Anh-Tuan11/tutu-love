import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { startRepair } from "@/lib/streak";
import { jsonError } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  await startRepair(session.userId);
  return NextResponse.json({ ok: true });
}
