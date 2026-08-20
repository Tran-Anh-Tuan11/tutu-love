import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { FOOD_SUGGESTIONS, predictFromLog } from "@/lib/period";
import { jsonError } from "@/lib/api";

export async function GET() {
  const log = await prisma.periodLog.findFirst({ orderBy: { startDate: "desc" } });
  if (!log) {
    return NextResponse.json({ log: null, prediction: null, phase: null, foodSuggestions: [] });
  }
  const prediction = predictFromLog(log);
  return NextResponse.json({
    log,
    prediction,
    phase: prediction.phase,
    foodSuggestions: FOOD_SUGGESTIONS[prediction.phase],
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  if (session.userId !== "nu") return jsonError("Chỉ Nữ ghi được kỳ mới", 403);

  const body = await req.json();
  const { startDate, cycleLength, periodLength } = body as {
    startDate?: string;
    cycleLength?: number;
    periodLength?: number;
  };
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return jsonError("startDate phải theo dạng YYYY-MM-DD");
  }

  const log = await prisma.periodLog.create({
    data: {
      startDate,
      cycleLength: cycleLength && cycleLength > 0 ? cycleLength : 28,
      periodLength: periodLength && periodLength > 0 ? periodLength : 5,
    },
  });
  const prediction = predictFromLog(log);
  return NextResponse.json({ log, prediction });
}
