import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { todayKey } from "@/lib/date";
import { jsonError } from "@/lib/api";

export async function GET() {
  const logs = await prisma.proactiveLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { role } = body as { role?: string };
  if (role !== "nam" && role !== "nu") return jsonError("role không hợp lệ");

  const log = await prisma.proactiveLog.create({
    data: { role, date: todayKey() },
  });
  return NextResponse.json({ log });
}
