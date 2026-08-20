import { addDays, daysBetween, todayKey } from "@/lib/date";

export type CyclePhase = "kinh_nguyet" | "nang_trung" | "rung_trung" | "hoang_the";

export const PHASE_LABEL: Record<CyclePhase, string> = {
  kinh_nguyet: "Kinh nguyệt",
  nang_trung: "Nang trứng",
  rung_trung: "Rụng trứng",
  hoang_the: "Hoàng thể",
};

export type FoodSuggestion = { label: string; items: string };

// Chỉ mang tính tham khảo, không thay thế tư vấn y tế — xem note ở UI.
export const FOOD_SUGGESTIONS: Record<CyclePhase, FoodSuggestion[]> = {
  kinh_nguyet: [
    { label: "Bù sắt", items: "thịt bò, gan, rau bina, hạt bí" },
    { label: "Giảm co thắt", items: "cá hồi, hạt lanh, nghệ" },
    { label: "Dịu bụng", items: "trà gừng ấm, chuối, cháo yến mạch" },
    { label: "Hạn chế", items: "cà phê, đồ mặn, nước lạnh" },
  ],
  nang_trung: [
    { label: "Tăng năng lượng", items: "trứng, ngũ cốc nguyên hạt, các loại đậu" },
    { label: "Hỗ trợ nội tiết", items: "rau họ cải, hạt lanh, bông cải xanh" },
    { label: "Nhẹ bụng", items: "trái cây tươi, sữa chua, các loại hạt" },
    { label: "Hạn chế", items: "đồ chiên nhiều dầu, đường tinh luyện" },
  ],
  rung_trung: [
    { label: "Chống oxy hóa", items: "việt quất, cà chua, rau lá xanh đậm" },
    { label: "Hỗ trợ rụng trứng", items: "bơ, dầu ô liu, cá béo" },
    { label: "Bổ sung kẽm", items: "hải sản, hạt điều, hạt hướng dương" },
    { label: "Hạn chế", items: "rượu bia, thức khuya" },
  ],
  hoang_the: [
    { label: "Giảm căng thẳng tiền kinh", items: "chuối, socola đen ít đường, hạt óc chó" },
    { label: "Bổ sung magie", items: "rau bina, hạnh nhân, đậu nành" },
    { label: "Ổn định đường huyết", items: "khoai lang, gạo lứt, thịt gà" },
    { label: "Hạn chế", items: "cà phê, đồ mặn, đồ ngọt nhiều đường" },
  ],
};

export const NAM_TIP: Record<CyclePhase, string> = {
  kinh_nguyet: "Nấu bữa ấm, nhắc uống nước, đừng để phải nhắc hai lần.",
  nang_trung: "Năng lượng đang lên cao — rủ đi chơi, thử món mới cùng nhau.",
  rung_trung: "Nhẹ nhàng quan tâm hơn thường ngày, đừng để em phải tự lên tiếng trước.",
  hoang_the: "Kiên nhẫn hơn bình thường, chuẩn bị đồ ăn dịu nhẹ, bỏ qua những câu nói khó chịu.",
};

export type PeriodPrediction = {
  dayOfCycle: number;
  phase: CyclePhase;
  phaseLabel: string;
  daysToNextPeriod: number;
  nextPeriodDate: string;
  cycleLength: number;
  periodLength: number;
};

export function predictFromLog(log: {
  startDate: string;
  cycleLength: number;
  periodLength: number;
}): PeriodPrediction {
  const { startDate, cycleLength, periodLength } = log;
  const elapsed = daysBetween(startDate, todayKey());
  const dayOfCycle = ((elapsed % cycleLength) + cycleLength) % cycleLength + 1;
  const daysToNextPeriod = cycleLength - dayOfCycle;
  const nextPeriodDate = addDays(todayKey(), daysToNextPeriod);

  // Rụng trứng ước tính 14 ngày trước kỳ sau (pha hoàng thể tương đối cố định ~14 ngày,
  // biến động chu kỳ chủ yếu nằm ở pha nang trứng).
  const ovulationDay = Math.max(periodLength + 1, cycleLength - 14);

  let phase: CyclePhase;
  if (dayOfCycle <= periodLength) phase = "kinh_nguyet";
  else if (dayOfCycle < ovulationDay) phase = "nang_trung";
  else if (dayOfCycle <= ovulationDay + 2) phase = "rung_trung";
  else phase = "hoang_the";

  return {
    dayOfCycle,
    phase,
    phaseLabel: PHASE_LABEL[phase],
    daysToNextPeriod,
    nextPeriodDate,
    cycleLength,
    periodLength,
  };
}
