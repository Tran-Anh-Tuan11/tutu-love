import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";
import { todayKey } from "@/lib/date";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    meetDate: settings?.nextMeetDate ?? null,
    setOn: settings?.meetDateSetOn ?? null,
  });
}

// body: { meetDate: "YYYY-MM-DD" } để đặt/đổi ngày gặp, { meetDate: null } để bỏ hẹn.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const { meetDate } = (await req.json().catch(() => ({}))) as { meetDate?: string | null };

  if (meetDate === null) {
    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: { nextMeetDate: null, meetDateSetOn: null },
    });
    return NextResponse.json({ meetDate: null, setOn: null });
  }

  if (!meetDate || !/^\d{4}-\d{2}-\d{2}$/.test(meetDate)) {
    return jsonError("Ngày gặp phải theo dạng YYYY-MM-DD");
  }
  const today = todayKey();
  if (meetDate < today) return jsonError("Ngày gặp nhau phải từ hôm nay trở đi");

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, nextMeetDate: meetDate, meetDateSetOn: today },
    update: { nextMeetDate: meetDate, meetDateSetOn: today },
  });
  return NextResponse.json({ meetDate: settings.nextMeetDate, setOn: settings.meetDateSetOn });
}
