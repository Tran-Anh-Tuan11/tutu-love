"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ReminderBanner from "@/components/ReminderBanner";
import { useMe } from "@/lib/useMe";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me && !me.loggedIn) {
      router.replace("/login");
    }
  }, [loading, me, router]);

  if (loading || !me?.loggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--ink-soft)]">
        Đang kiểm tra đăng nhập…
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <ReminderBanner />
      <main className="flex-1 px-3 py-4 md:px-6 md:py-6">{children}</main>
    </div>
  );
}
