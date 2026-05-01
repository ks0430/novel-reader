import { NextRequest, NextResponse } from "next/server";
import { extractNovelId, fetchNovel } from "@/lib/pixiv";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const novelId = extractNovelId(url);
  if (!novelId) {
    return NextResponse.json({ error: "Invalid Pixiv novel URL or ID" }, { status: 400 });
  }

  const sessionId = process.env.PIXIV_PHPSESSID;
  if (!sessionId) {
    return NextResponse.json({ error: "PIXIV_PHPSESSID not configured" }, { status: 500 });
  }

  try {
    const novel = await fetchNovel(novelId, sessionId);
    return NextResponse.json(novel);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
