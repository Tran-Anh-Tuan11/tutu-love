import { daysBetween } from "@/lib/date";
import { FOOD_SUGGESTIONS, NAM_TIP } from "@/lib/period";
import { nameOfUser, type AgentData } from "@/lib/agentData";

// Bản trả lời MIỄN PHÍ, không gọi API nào — so khớp từ khoá tiếng Việt (bỏ dấu) trên vài
// mẫu câu hỏi hay dùng nhất. Dùng để test luồng end-to-end (widget → route → DB) trước khi
// tốn tiền gọi Claude thật. Khi có ANTHROPIC_API_KEY, route sẽ tự chuyển sang LLM thật,
// hiểu được câu hỏi diễn đạt tự do hơn nhiều so với file này.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function formatDays(n: number): string {
  const years = Math.floor(n / 365);
  const months = Math.floor((n % 365) / 30);
  const rest = n % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} năm`);
  if (months > 0) parts.push(`${months} tháng`);
  if (years === 0 && (months === 0 || rest > 0)) parts.push(`${rest} ngày`);
  return `${n} ngày (~${parts.join(", ")})`;
}

function answerBirthday(data: AgentData, q: string): string {
  const wantsNam = includesAny(q, ["tuan", "anh"]) && !includesAny(q, ["em", normalize(nameOfUser(data, "nu"))]);
  const wantsNu = includesAny(q, ["em", normalize(nameOfUser(data, "nu"))]) && !wantsNam;

  const birthdays = data.specialDays.filter((d) => normalize(d.name).includes("sinh nhat"));
  if (birthdays.length === 0) {
    return "App chưa lưu ngày sinh nhật nào cả — vào trang Kỷ niệm để thêm nhé.";
  }

  let picked = birthdays;
  if (wantsNam) picked = birthdays.filter((d) => normalize(d.name).includes(normalize(nameOfUser(data, "nam"))));
  else if (wantsNu) picked = birthdays.filter((d) => normalize(d.name).includes(normalize(nameOfUser(data, "nu"))));
  if (picked.length === 0) picked = birthdays;

  return picked.map((d) => `🎂 ${d.name}: lần tới vào ${d.date} (còn ${d.daysLeft} ngày).`).join("\n");
}

function answerRelationship(data: AgentData): string {
  if (!data.settings?.relationshipStart) {
    return "Chưa cài đặt ngày bắt đầu yêu nhau — vào trang Kỷ niệm để thêm ngày đó nhé.";
  }
  const days = daysBetween(data.settings.relationshipStart, data.today);
  return `💛 ${nameOfUser(data, "nam")} và ${nameOfUser(data, "nu")} yêu nhau từ ${data.settings.relationshipStart} — tới hôm nay là ${formatDays(days)} rồi.`;
}

function answerIdeas(data: AgentData): string {
  if (data.ideaTopics.length === 0) return "Bảng ý tưởng đang trống — vào trang Ý tưởng để thêm nhé.";
  const lines: string[] = [];
  for (const topic of data.ideaTopics) {
    if (topic.ideas.length === 0) continue;
    lines.push(`📌 ${topic.name}:`);
    for (const idea of topic.ideas) {
      lines.push(`  - (${nameOfUser(data, idea.authorId)}) ${idea.content}`);
    }
  }
  return lines.length > 0 ? lines.join("\n") : "Các chủ đề đều chưa có ý tưởng nào.";
}

function answerTodos(data: AgentData): string {
  const pending = data.todos.filter((t) => !t.done);
  if (pending.length === 0) return "Không còn việc nào chưa làm cả 🎉";
  const lines = pending.map((t) => {
    const owner = t.scope === "SHARED" ? "chung" : nameOfUser(data, t.ownerId ?? "");
    return `- (${owner}) ${t.content}`;
  });
  return `Việc chưa làm:\n${lines.join("\n")}`;
}

function answerSpecialDays(data: AgentData): string {
  if (data.specialDays.length === 0) return "Chưa có ngày đặc biệt nào được lưu.";
  const top = data.specialDays.slice(0, 5);
  return top.map((d) => `- ${d.name}: ${d.date} (còn ${d.daysLeft} ngày)`).join("\n");
}

function answerCycle(data: AgentData): string {
  if (data.periodLogs.length === 0 || !data.latestPrediction) {
    return "Chưa có dữ liệu chu kỳ nào trong app — vào trang Chu kỳ để nhập nhé.";
  }
  const latest = data.periodLogs[0];
  const completed = data.periodLogs.slice(1);
  const prediction = data.latestPrediction;

  const lines: string[] = [];
  lines.push(`📊 Phân tích chu kỳ của ${nameOfUser(data, "nu")}:`);

  if (completed.length > 0) {
    const avgCycle = Math.round(completed.reduce((s, l) => s + l.cycleLength, 0) / completed.length);
    const avgPeriod = Math.round((completed.reduce((s, l) => s + l.periodLength, 0) / completed.length) * 10) / 10;
    const minCycle = Math.min(...completed.map((l) => l.cycleLength));
    const maxCycle = Math.max(...completed.map((l) => l.cycleLength));
    lines.push(
      `- Dựa trên ${completed.length} chu kỳ đã ghi nhận: trung bình ${avgCycle} ngày/chu kỳ (dao động ${minCycle}–${maxCycle} ngày), hành kinh trung bình ${avgPeriod} ngày.`
    );
  }

  lines.push(
    `- Kỳ kinh gần nhất bắt đầu ${latest.startDate} → hôm nay (${data.today}) là ngày thứ ${prediction.dayOfCycle} của chu kỳ, đang ở pha "${prediction.phaseLabel}".`
  );
  lines.push(`- Dự kiến kỳ kinh tiếp theo: ${prediction.nextPeriodDate} (còn ${prediction.daysToNextPeriod} ngày).`);

  lines.push(`\n🍽️ Nên ăn gì hôm nay (pha "${prediction.phaseLabel}"):`);
  for (const s of FOOD_SUGGESTIONS[prediction.phase]) {
    lines.push(`- ${s.label}: ${s.items}`);
  }
  lines.push(`\n💡 Gợi ý cho ${nameOfUser(data, "nam")}: ${NAM_TIP[prediction.phase]}`);
  lines.push(`\n(Chỉ mang tính tham khảo, không thay thế tư vấn y tế.)`);

  return lines.join("\n");
}

const HELP_TEXT = `Bản dùng thử miễn phí, mình chỉ hiểu vài mẫu câu hỏi cố định thôi (chưa gọi AI thật):
- "ngày sinh của Tuấn/Em là gì"
- "yêu nhau bao lâu rồi"
- "có những ý tưởng gì"
- "còn việc gì chưa làm"
- "sắp tới có ngày đặc biệt gì"
- "chu kỳ hôm nay nên ăn gì" / "phân tích chu kỳ"

Khi nào m thêm ANTHROPIC_API_KEY vào .env, mình sẽ hiểu được câu hỏi tự do hơn nhiều.`;

export function answerLocally(question: string, data: AgentData): string {
  const q = normalize(question);

  if (includesAny(q, ["sinh nhat", "ngay sinh"])) return answerBirthday(data, q);
  if (includesAny(q, ["yeu nhau", "yeu bao lau", "quen nhau", "yeu duoc bao lau"])) return answerRelationship(data);
  if (includesAny(q, ["chu ky", "kinh nguyet", "an gi", "nen an"])) return answerCycle(data);
  if (includesAny(q, ["y tuong", "chu de"])) return answerIdeas(data);
  if (includesAny(q, ["viec can lam", "to do", "cong viec", "chua lam"])) return answerTodos(data);
  if (includesAny(q, ["ky niem", "ngay dac biet", "sap toi", "sap den"])) return answerSpecialDays(data);

  return HELP_TEXT;
}
