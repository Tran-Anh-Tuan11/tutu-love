import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";
import { formatAgentContext } from "@/lib/agentContext";
import { getAgentData } from "@/lib/agentData";
import { answerLocally } from "@/lib/agentRules";

// Dùng Haiku mặc định — hội thoại ngắn, context nhỏ, chi phí mỗi lượt hỏi gần như không đáng
// kể. Đổi sang "claude-sonnet-5" nếu muốn câu trả lời "khôn" hơn, đổi lại tốn hơn 1 chút.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_HISTORY = 12;

const SYSTEM_PROMPT = `Bạn là trợ lý riêng trong app TuTu & Love của một cặp đôi (2 người dùng duy nhất).
Chỉ trả lời dựa trên dữ liệu được cung cấp bên dưới — không bịa thêm thông tin không có ở đó.
Nếu không có dữ liệu để trả lời, hãy nói thật là chưa biết/app chưa lưu, đừng đoán.
Trả lời ngắn gọn, gần gũi, thân mật, xưng hô bằng tên thật khi biết, luôn trả lời bằng tiếng Việt.
Khi được hỏi nên ăn gì theo chu kỳ kinh nguyệt, dựa vào pha chu kỳ hiện tại và bảng gợi ý món ăn
để đưa lời khuyên cụ thể, dễ làm; luôn nhắc đây chỉ là tham khảo, không thay thế tư vấn y tế.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const messages = body?.messages as ChatMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError("Thiếu nội dung hỏi");
  }
  const lastQuestion = String(messages[messages.length - 1]?.content ?? "");

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Chưa cấu hình API key thật (chưa muốn tốn phí) → trả lời bằng bộ luật so khớp từ khoá
  // cố định trong lib/agentRules.ts, không gọi ra ngoài, để test luồng widget → route → DB.
  if (!apiKey) {
    const data = await getAgentData();
    const reply = answerLocally(lastQuestion, data);
    return NextResponse.json({ reply, mode: "local" });
  }

  const trimmed = messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(m.content ?? "").slice(0, 4000),
  }));

  const data = await getAgentData();
  const context = formatAgentContext(data);

  const anthropic = new Anthropic({ apiKey });
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `${SYSTEM_PROMPT}\n\n--- Dữ liệu hiện có trong app ---\n${context}`,
      messages: trimmed,
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply: reply || "Xin lỗi, hiện chưa trả lời được câu này.", mode: "llm" });
  } catch (err) {
    console.error("Agent call failed:", err);
    return jsonError("Agent đang gặp lỗi, thử lại sau", 502);
  }
}
