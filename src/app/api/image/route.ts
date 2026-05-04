import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.includes("pximg.net")) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        Referer: "https://www.pixiv.net",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: resp.status });
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buffer = await resp.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image proxy failed" }, { status: 500 });
  }
}
