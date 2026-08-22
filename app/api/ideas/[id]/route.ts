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
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return jsonError("Không tìm thấy ý tưởng", 404);

  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
