import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { attemptRepair } from "@/lib/streak";
import { jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { phrase } = body as { phrase?: string };
  if (!phrase) return jsonError("Thiếu câu nói");

  try {
    const result = await attemptRepair(session.userId, phrase);
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Lỗi khôi phục streak", 409);
  }
}
