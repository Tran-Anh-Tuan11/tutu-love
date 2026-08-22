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
  const topic = await prisma.ideaTopic.findUnique({ where: { id } });
  if (!topic) return jsonError("Không tìm thấy chủ đề", 404);

  // onDelete: Cascade trên Idea.topic — xóa chủ đề tự xóa luôn các ý tưởng bên trong.
  await prisma.ideaTopic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
