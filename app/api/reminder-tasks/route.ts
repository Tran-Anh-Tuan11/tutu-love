import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isUnlockedToday, jsonError } from "@/lib/api";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  const tasks = await prisma.reminderTask.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  if (!(await isUnlockedToday(session.userId))) {
    return jsonError("Cần check-in mở đầu ngày trước", 403);
  }

  const { content, remindOn } = (await req.json()) as { content?: string; remindOn?: string | null };
  if (!content || !content.trim()) return jsonError("Thiếu nội dung nhắc nhở");
  if (remindOn && !DATE_KEY.test(remindOn)) return jsonError("Ngày nhắc không hợp lệ");

  const task = await prisma.reminderTask.create({
    data: { content: content.trim(), remindOn: remindOn || null, createdBy: session.userId },
  });
  return NextResponse.json({ task });
}
