import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { jsonError } from "@/lib/api";
import { DEFAULT_MUSIC_ID, parseYoutubeId } from "@/lib/youtube";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return NextResponse.json({
    youtubeId: settings.musicYoutubeId ?? DEFAULT_MUSIC_ID,
    title: settings.musicYoutubeId ? settings.musicTitle : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Chưa đăng nhập", 401);

  const body = await req.json();
  const { url } = body as { url?: string };
  const id = url ? parseYoutubeId(url) : null;
  if (!id) return jsonError("Link YouTube không hợp lệ");

  // oEmbed vừa lấy tên bài, vừa kiểm tra video có tồn tại và cho phép nhúng không
  // (video bị chặn nhúng thì player trong app sẽ không phát được).
  let title: string | null = null;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return jsonError("Không tìm thấy video này");
    if (res.status === 401 || res.status === 403) {
      return jsonError("Video này bị chặn nhúng nên app không phát được, chọn bài khác nhé");
    }
    if (res.ok) title = ((await res.json()) as { title?: string }).title ?? null;
  } catch {
    // Không gọi được YouTube thì vẫn lưu theo ID, chỉ thiếu tên bài.
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, musicYoutubeId: id, musicTitle: title },
    update: { musicYoutubeId: id, musicTitle: title },
  });
  return NextResponse.json({ youtubeId: settings.musicYoutubeId, title: settings.musicTitle });
}
