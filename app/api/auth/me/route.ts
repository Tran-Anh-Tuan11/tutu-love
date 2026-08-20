import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const users = await prisma.user.findMany();
  const enrollment = {
    nam: users.some((u) => u.id === "nam" && !!u.faceDescriptor),
    nu: users.some((u) => u.id === "nu" && !!u.faceDescriptor),
  };

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ loggedIn: false, userId: null, name: null, enrollment });
  }

  const user = users.find((u) => u.id === session.userId);
  return NextResponse.json({
    loggedIn: true,
    userId: session.userId,
    name: user?.name ?? null,
    enrollment,
  });
}
