export type Role = "nam" | "nu";
export type Names = { nam: string | null; nu: string | null };

// Trước khi enroll, người đó chưa có tên hiển thị — fallback về "Anh"/"Em" cho tới khi đặt tên.
export const ROLE_FALLBACK: Record<Role, string> = { nam: "Anh", nu: "Em" };

export function nameOf(names: Names | undefined | null, role: Role): string {
  return names?.[role]?.trim() || ROLE_FALLBACK[role];
}
