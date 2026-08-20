import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const { id } = await params;
  const day = await prisma.specialDay.findUnique({ where: { id } });
  if (!day) return jsonError("Không tìm thấy (ngày auto không xóa được)", 404);

  await prisma.specialDay.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
