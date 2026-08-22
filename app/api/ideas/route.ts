import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function GET() {
  const topics = await prisma.ideaTopic.findMany({
    orderBy: { createdAt: "asc" },
    include: { ideas: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ topics });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { topicId, content, authorId } = body as {
    topicId?: string;
    content?: string;
    authorId?: string;
  };
  if (!topicId) return jsonError("Thiếu chủ đề");
  if (!content || !content.trim()) return jsonError("Thiếu nội dung ý tưởng");
  if (authorId !== "nam" && authorId !== "nu") return jsonError("Thiếu người đưa ý tưởng");

  const topic = await prisma.ideaTopic.findUnique({ where: { id: topicId } });
  if (!topic) return jsonError("Không tìm thấy chủ đề", 404);

  const idea = await prisma.idea.create({
    data: { topicId, content: content.trim(), authorId },
  });
  return NextResponse.json({ idea });
}
