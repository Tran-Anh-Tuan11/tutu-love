import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function GET() {
  const users = await prisma.user.findMany();
  const enrollment = {
    nam: users.some((u) => u.id === "nam" && !!u.faceDescriptor),
    nu: users.some((u) => u.id === "nu" && !!u.faceDescriptor),
  };
  const names = {
    nam: users.find((u) => u.id === "nam")?.name ?? null,
    nu: users.find((u) => u.id === "nu")?.name ?? null,
  };

  const session = await getSession();
  const user = session ? users.find((u) => u.id === session.userId) : undefined;

  // Cookie hợp lệ nhưng user đã bị xóa (VD: reset DB, enroll lại) → không còn là "đăng nhập" thật,
  // dọn cookie luôn để lần request sau không phải kiểm tra lại.
  if (!session || !user) {
    if (session) await destroySession();
    return NextResponse.json({ loggedIn: false, userId: null, name: null, enrollment, names });
  }

  return NextResponse.json({
    loggedIn: true,
    userId: session.userId,
    name: user.name,
    enrollment,
    names,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { name } = body as { name?: string };
  if (!name || !name.trim()) return jsonError("Thiếu tên mới");

  await prisma.user.update({ where: { id: session.userId }, data: { name: name.trim() } });
  return NextResponse.json({ ok: true, name: name.trim() });
}
