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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type EntryInput = { startDate?: string; cycleLength?: number; periodLength?: number };

function toLogData(entry: EntryInput) {
  return {
    startDate: entry.startDate!,
    cycleLength: entry.cycleLength && entry.cycleLength > 0 ? entry.cycleLength : 28,
    periodLength: entry.periodLength && entry.periodLength > 0 ? entry.periodLength : 5,
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);
  // Cả Anh và Em đều ghi/sửa được ngày đến kỳ.

  const body = await req.json();
  const { startDate, cycleLength, periodLength, entries } = body as EntryInput & { entries?: EntryInput[] };

  // Nhập từ file: mảng nhiều dòng (mỗi dòng 1 kỳ trong quá khứ) được parse ở client rồi gửi lên đây.
  if (Array.isArray(entries)) {
    if (entries.length === 0) return jsonError("File không có dữ liệu hợp lệ");
    for (const e of entries) {
      if (!e.startDate || !DATE_RE.test(e.startDate)) {
        return jsonError("File chứa ngày không hợp lệ — cần dạng YYYY-MM-DD");
      }
    }
    await prisma.periodLog.createMany({ data: entries.map(toLogData) });
    const log = await prisma.periodLog.findFirst({ orderBy: { startDate: "desc" } });
    const prediction = log ? predictFromLog(log) : null;
    return NextResponse.json({ log, prediction, imported: entries.length });
  }

  if (!startDate || !DATE_RE.test(startDate)) {
    return jsonError("startDate phải theo dạng YYYY-MM-DD");
  }

  const log = await prisma.periodLog.create({
    data: toLogData({ startDate, cycleLength, periodLength }),
  });
  const prediction = predictFromLog(log);
  return NextResponse.json({ log, prediction });
}
