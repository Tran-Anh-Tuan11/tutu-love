import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, destroySession } from "@/lib/session";

export async function GET() {
  const users = await prisma.user.findMany();
  const enrollment = {
    nam: users.some((u) => u.id === "nam" && !!u.faceDescriptor),
    nu: users.some((u) => u.id === "nu" && !!u.faceDescriptor),
  };

  const session = await getSession();
  const user = session ? users.find((u) => u.id === session.userId) : undefined;

  // Cookie hợp lệ nhưng user đã bị xóa (VD: reset DB, enroll lại) → không còn là "đăng nhập" thật,
  // dọn cookie luôn để lần request sau không phải kiểm tra lại.
  if (!session || !user) {
    if (session) await destroySession();
    return NextResponse.json({ loggedIn: false, userId: null, name: null, enrollment });
  }

  return NextResponse.json({
    loggedIn: true,
    userId: session.userId,
    name: user.name,
    enrollment,
  });
}
