import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return NextResponse.json({
    relationshipStart: settings.relationshipStart,
    backgroundColor: settings.backgroundColor,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { startDate } = body as { startDate?: string };
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return jsonError("startDate phải theo dạng YYYY-MM-DD");
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, relationshipStart: startDate },
    update: { relationshipStart: startDate },
  });
  return NextResponse.json({ relationshipStart: settings.relationshipStart });
}
