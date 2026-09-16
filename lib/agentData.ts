import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date";
import { predictFromLog, type PeriodPrediction } from "@/lib/period";
import { getSpecialDays, type SpecialDayItem } from "@/lib/specialDays";
import type { Idea, IdeaTopic, PeriodLog, Settings, Todo, User } from "@prisma/client";

// 1 lần fetch dùng chung cho cả 2 đường trả lời — agent thật (lib/agentContext.ts, gọi LLM)
// và bản dùng thử miễn phí không cần API key (lib/agentRules.ts) — để không viết 2 lần cùng
// một đống query Prisma.
export type AgentData = {
  today: string;
  users: User[];
  settings: Settings | null;
  ideaTopics: (IdeaTopic & { ideas: Idea[] })[];
  todos: Todo[];
  periodLogs: PeriodLog[];
  specialDays: SpecialDayItem[];
  latestPrediction: PeriodPrediction | null;
};

export async function getAgentData(): Promise<AgentData> {
  const [users, settings, ideaTopics, todos, periodLogs, specialDays] = await Promise.all([
    prisma.user.findMany(),
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.ideaTopic.findMany({ orderBy: { createdAt: "asc" }, include: { ideas: { orderBy: { createdAt: "asc" } } } }),
    prisma.todo.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.periodLog.findMany({ orderBy: { startDate: "desc" } }),
    getSpecialDays(),
  ]);

  const latestPrediction = periodLogs.length > 0 ? predictFromLog(periodLogs[0]) : null;

  return {
    today: todayKey(),
    users,
    settings,
    ideaTopics,
    todos,
    periodLogs,
    specialDays,
    latestPrediction,
  };
}

export function nameOfUser(data: AgentData, id: string): string {
  return data.users.find((u) => u.id === id)?.name || (id === "nam" ? "Anh" : "Em");
}
