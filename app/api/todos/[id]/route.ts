import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isUnlockedToday, jsonError } from "@/lib/api";

const OTHER: Record<string, string> = { nam: "NU", nu: "NAM" };

async function checkAccess(userId: string, todoId: string) {
  const todo = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!todo) return { todo: null, allowed: false };
  const allowed = todo.scope === "SHARED" || todo.scope !== OTHER[userId];
  return { todo, allowed };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  if (!(await isUnlockedToday(session.userId))) {
    return jsonError("Cần check-in mở đầu ngày trước", 403);
  }

  const { id } = await params;
  const { todo, allowed } = await checkAccess(session.userId, id);
  if (!todo) return jsonError("Không tìm thấy việc cần làm", 404);
  if (!allowed) return jsonError("Không có quyền sửa việc này", 403);

  const body = await req.json();
  const { done } = body as { done?: boolean };
  const updated = await prisma.todo.update({ where: { id }, data: { done: !!done } });
  return NextResponse.json({ todo: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  if (!(await isUnlockedToday(session.userId))) {
    return jsonError("Cần check-in mở đầu ngày trước", 403);
  }

  const { id } = await params;
  const { todo, allowed } = await checkAccess(session.userId, id);
  if (!todo) return jsonError("Không tìm thấy việc cần làm", 404);
  if (!allowed) return jsonError("Không có quyền xóa việc này", 403);

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
