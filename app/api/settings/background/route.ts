import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkBackgroundContrast, hexToRgb } from "@/lib/color";
import { jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { color } = body as { color?: string };
  if (!color || !hexToRgb(color)) return jsonError("Màu không hợp lệ, cần dạng #rrggbb");

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, backgroundColor: color },
    update: { backgroundColor: color },
  });

  const warning = checkBackgroundContrast(color);
  return NextResponse.json({ backgroundColor: settings.backgroundColor, warning });
}
