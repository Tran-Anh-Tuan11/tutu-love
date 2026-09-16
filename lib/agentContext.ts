import { daysBetween } from "@/lib/date";
import { FOOD_SUGGESTIONS, NAM_TIP, PHASE_LABEL } from "@/lib/period";
import { getAgentData, nameOfUser, type AgentData } from "@/lib/agentData";

// Gom toàn bộ dữ liệu "biết được" của app thành 1 khối text tiếng Việt, dùng làm system
// prompt cho agent hỏi-đáp (LLM). Dữ liệu 2 người dùng thật, tập nhỏ — nhét thẳng vào context
// mỗi lần hỏi đơn giản và rẻ hơn nhiều so với tool-calling/RAG cho quy mô này.
export async function buildAgentContext(): Promise<string> {
  const data = await getAgentData();
  return formatAgentContext(data);
}

export function formatAgentContext(data: AgentData): string {
  const { today, settings, specialDays, todos, ideaTopics, periodLogs, latestPrediction } = data;
  const nameOf = (id: string) => nameOfUser(data, id);

  const lines: string[] = [];

  lines.push(`Hôm nay là ngày ${today} (giờ Việt Nam).`);
  lines.push(`Hai người dùng app: "nam" tên là ${nameOf("nam")}, "nu" tên là ${nameOf("nu")}.`);

  if (settings?.relationshipStart) {
    const days = daysBetween(settings.relationshipStart, today);
    lines.push(`Hai người yêu nhau từ ngày ${settings.relationshipStart}, tức là đã ${days} ngày.`);
  } else {
    lines.push(`Chưa cài đặt ngày bắt đầu yêu nhau.`);
  }

  lines.push("");
  lines.push("Các ngày đặc biệt đã lưu (ngày sinh nhật, kỷ niệm...):");
  if (specialDays.length === 0) {
    lines.push("- (chưa có ngày nào)");
  } else {
    for (const d of specialDays) {
      lines.push(`- ${d.name}: lần tới vào ${d.date} (còn ${d.daysLeft} ngày)`);
    }
  }

  lines.push("");
  lines.push("Danh sách việc cần làm:");
  if (todos.length === 0) {
    lines.push("- (chưa có việc nào)");
  } else {
    for (const t of todos) {
      const owner = t.scope === "SHARED" ? "chung" : nameOf(t.ownerId ?? "");
      lines.push(`- [${t.done ? "đã xong" : "chưa xong"}] (${owner}) ${t.content}`);
    }
  }

  lines.push("");
  lines.push("Bảng ý tưởng (mỗi chủ đề gồm nhiều ý tưởng do 1 trong 2 người đề xuất):");
  if (ideaTopics.length === 0) {
    lines.push("- (chưa có chủ đề nào)");
  } else {
    for (const topic of ideaTopics) {
      lines.push(`Chủ đề "${topic.name}":`);
      if (topic.ideas.length === 0) {
        lines.push("  - (chưa có ý tưởng nào)");
      } else {
        for (const idea of topic.ideas) {
          lines.push(`  - (${nameOf(idea.authorId)}) ${idea.content}`);
        }
      }
    }
  }

  lines.push("");
  lines.push("Chu kỳ kinh nguyệt của " + nameOf("nu") + ":");
  if (periodLogs.length === 0 || !latestPrediction) {
    lines.push("- (chưa có dữ liệu chu kỳ nào)");
  } else {
    const latest = periodLogs[0];
    lines.push(
      `- Hiện đang ở ngày thứ ${latestPrediction.dayOfCycle} của chu kỳ, pha "${latestPrediction.phaseLabel}".`
    );
    lines.push(
      `- Chu kỳ gần nhất bắt đầu ${latest.startDate}, độ dài chu kỳ ước tính ${latest.cycleLength} ngày, số ngày hành kinh ${latest.periodLength} ngày.`
    );
    lines.push(
      `- Dự kiến kỳ kinh tiếp theo vào khoảng ${latestPrediction.nextPeriodDate} (còn ${latestPrediction.daysToNextPeriod} ngày).`
    );
    lines.push(`- Gợi ý món ăn cho pha "${latestPrediction.phaseLabel}":`);
    for (const s of FOOD_SUGGESTIONS[latestPrediction.phase]) {
      lines.push(`  - ${s.label}: ${s.items}`);
    }
    lines.push(`- Gợi ý cho "${nameOf("nam")}" trong pha này: ${NAM_TIP[latestPrediction.phase]}`);

    lines.push("- Lịch sử chu kỳ đã ghi nhận (từ cũ đến mới, ngày bắt đầu / độ dài chu kỳ / số ngày hành kinh):");
    for (const log of [...periodLogs].reverse()) {
      lines.push(`  - ${log.startDate}: ${log.cycleLength} ngày / hành kinh ${log.periodLength} ngày`);
    }

    lines.push("");
    lines.push("Bảng gợi ý món ăn theo từng pha chu kỳ (tham khảo chung, không phải riêng hôm nay):");
    for (const phase of Object.keys(PHASE_LABEL) as (keyof typeof PHASE_LABEL)[]) {
      lines.push(`- Pha "${PHASE_LABEL[phase]}": ${FOOD_SUGGESTIONS[phase].map((s) => `${s.label} (${s.items})`).join("; ")}`);
    }
  }

  return lines.join("\n");
}
