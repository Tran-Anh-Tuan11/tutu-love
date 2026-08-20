import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSpecialDays } from "@/lib/specialDays";
import { jsonError } from "@/lib/api";

export async function GET() {
  const days = await getSpecialDays();
  return NextResponse.json({ days });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { name, month, day, year } = body as {
    name?: string;
    month?: number;
    day?: number;
    year?: number | null;
  };
  if (!name || !name.trim()) return jsonError("Thiếu tên ngày đặc biệt");
  if (!month || month < 1 || month > 12) return jsonError("month không hợp lệ");
  if (!day || day < 1 || day > 31) return jsonError("day không hợp lệ");

  const created = await prisma.specialDay.create({
    data: { name: name.trim(), month, day, year: year ?? null, createdBy: session.userId },
  });
  return NextResponse.json({ day: created });
}
