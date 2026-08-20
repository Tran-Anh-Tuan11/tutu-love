import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

type Status = "none" | "partial" | "full";

function statusOf(morningDone: boolean, eveningDone: boolean): Status {
  if (morningDone && eveningDone) return "full";
  if (morningDone || eveningDone) return "partial";
  return "none";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scope: string }> }
) {
  const { scope } = await params;
  if (!["nam", "nu", "chung"].includes(scope)) {
    return jsonError("scope phải là nam, nu hoặc chung");
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const rows = await prisma.checkIn.findMany({
    where: { date: { startsWith: monthPrefix } },
  });
  const byUserDate = new Map(rows.map((r) => [`${r.userId}:${r.date}`, r]));

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${monthPrefix}${String(d).padStart(2, "0")}`;
    let status: Status;
    if (scope === "chung") {
      const nam = byUserDate.get(`nam:${date}`);
      const nu = byUserDate.get(`nu:${date}`);
      const namFull = !!(nam?.morningDone && nam?.eveningDone);
      const nuFull = !!(nu?.morningDone && nu?.eveningDone);
      const anyProgress = !!(nam?.morningDone || nam?.eveningDone || nu?.morningDone || nu?.eveningDone);
      status = namFull && nuFull ? "full" : anyProgress ? "partial" : "none";
    } else {
      const row = byUserDate.get(`${scope}:${date}`);
      status = statusOf(!!row?.morningDone, !!row?.eveningDone);
    }
    days.push({ date, status });
  }

  return NextResponse.json({ days });
}
