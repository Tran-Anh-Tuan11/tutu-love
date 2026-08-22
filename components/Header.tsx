"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/lib/useMe";
import BackgroundPicker from "@/components/BackgroundPicker";
import HeaderClock from "@/components/HeaderClock";
import NameEditor from "@/components/NameEditor";

const NAV = [
  { href: "/", label: "Nhà", icon: "◈" },
  { href: "/viec", label: "Việc cần làm", icon: "✓" },
  { href: "/y-tuong", label: "Ý tưởng", icon: "💡" },
  { href: "/chu-ky", label: "Chu kỳ", icon: "🌸" },
  { href: "/lich", label: "Lịch", icon: "🗓" },
  { href: "/ky-niem", label: "Kỷ niệm", icon: "💛" },
  { href: "/chu-dong", label: "Chủ động", icon: "🎲" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useMe();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="paper-card mx-3 mt-3 md:mx-6 md:mt-6 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <Link href="/" className="font-display italic text-lg shrink-0">
        TuTu <span aria-hidden>&amp;</span> Love
      </Link>

      <nav className="flex items-center gap-1 flex-wrap">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                active ? "bg-[var(--paper-dim)] font-medium" : "text-[var(--ink-soft)] hover:bg-[var(--paper-dim)]"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <HeaderClock />
        <BackgroundPicker />
        {me?.loggedIn && (
          <>
            <span className="w-8 h-8 rounded-full bg-[var(--gold-soft)] flex items-center justify-center text-sm font-semibold">
              {me.name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <NameEditor />
            <button onClick={logout} className="text-sm text-[var(--ink-soft)] hover:underline">
              ⇥ Thoát
            </button>
          </>
        )}
      </div>
    </header>
  );
}
