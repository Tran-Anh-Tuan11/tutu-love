import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, name, descriptor, setupKey } = body as {
    userId?: string;
    name?: string;
    descriptor?: number[];
    setupKey?: string;
  };

  if (setupKey !== process.env.SETUP_KEY) {
    return jsonError("Setup key không đúng", 403);
  }
  if (userId !== "nam" && userId !== "nu") {
    return jsonError("userId phải là 'nam' hoặc 'nu'");
  }
  if (!name || !name.trim()) {
    return jsonError("Thiếu tên hiển thị");
  }
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    return jsonError("Thiếu dữ liệu khuôn mặt");
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      role: userId,
      name: name.trim(),
      faceDescriptor: JSON.stringify(descriptor),
      enrolledAt: new Date(),
    },
    update: {
      name: name.trim(),
      faceDescriptor: JSON.stringify(descriptor),
      enrolledAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
