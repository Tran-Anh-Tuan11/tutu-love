import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isUnlockedToday, jsonError } from "@/lib/api";

async function authorize() {
  const session = await getSession();
  if (!session) return { error: jsonError("Chưa đăng nhập", 401) };
  if (!(await isUnlockedToday(session.userId))) {
    return { error: jsonError("Cần check-in mở đầu ngày trước", 403) };
  }
  return { error: null };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await authorize();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.reminderTask.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy nhắc nhở", 404);

  const { done } = (await req.json()) as { done?: boolean };
  const task = await prisma.reminderTask.update({ where: { id }, data: { done: !!done } });
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await authorize();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.reminderTask.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy nhắc nhở", 404);

  await prisma.reminderTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
