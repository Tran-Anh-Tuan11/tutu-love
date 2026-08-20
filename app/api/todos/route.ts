import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isUnlockedToday, jsonError } from "@/lib/api";

const OTHER: Record<string, string> = { nam: "NU", nu: "NAM" };

export async function GET() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  if (!(await isUnlockedToday(session.userId))) {
    return jsonError("Cần check-in mở đầu ngày trước", 403);
  }

  const body = await req.json();
  const { content, scope } = body as { content?: string; scope?: string };
  if (!content || !content.trim()) return jsonError("Thiếu nội dung việc cần làm");
  if (!["SHARED", "NAM", "NU"].includes(scope ?? "")) return jsonError("scope không hợp lệ");
  if (scope === OTHER[session.userId]) {
    return jsonError("Không thể thêm vào danh sách của người kia", 403);
  }

  const todo = await prisma.todo.create({
    data: {
      content: content.trim(),
      scope: scope!,
      ownerId: scope === "SHARED" ? null : session.userId,
    },
  });
  return NextResponse.json({ todo });
}
