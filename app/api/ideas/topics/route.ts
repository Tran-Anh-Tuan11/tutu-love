import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { name } = body as { name?: string };
  if (!name || !name.trim()) return jsonError("Thiếu tên chủ đề");

  const topic = await prisma.ideaTopic.create({ data: { name: name.trim() } });
  return NextResponse.json({ topic: { ...topic, ideas: [] } });
}
