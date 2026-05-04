import { NextRequest, NextResponse } from "next/server";
import { fetchSeriesChapters } from "@/lib/pixiv";

export async function GET(req: NextRequest) {
  const seriesId = req.nextUrl.searchParams.get("id");
  if (!seriesId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const sessionId = process.env.PIXIV_PHPSESSID;
  if (!sessionId) {
    return NextResponse.json({ error: "PIXIV_PHPSESSID not configured" }, { status: 500 });
  }

  try {
    const series = await fetchSeriesChapters(seriesId, sessionId);
    return NextResponse.json(series);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch series";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
