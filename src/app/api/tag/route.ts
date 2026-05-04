import { NextRequest, NextResponse } from "next/server";
import { searchNovelsByTag } from "@/lib/pixiv";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  if (!tag) {
    return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
  }

  const mode = (req.nextUrl.searchParams.get("mode") || "safe") as "safe" | "r18" | "all";
  if (!["safe", "r18", "all"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode. Use: safe, r18, all" }, { status: 400 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1);

  const sessionId = process.env.PIXIV_PHPSESSID;
  if (!sessionId) {
    return NextResponse.json({ error: "PIXIV_PHPSESSID not configured" }, { status: 500 });
  }

  try {
    const result = await searchNovelsByTag(tag, sessionId, mode, page);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
