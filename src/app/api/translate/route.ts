import { NextRequest, NextResponse } from "next/server";
import { translateCaiyun } from "@/lib/translate";

export async function POST(req: NextRequest) {
  const token = process.env.CAIYUN_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "CAIYUN_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { lines } = await req.json();
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "Missing or empty lines array" }, { status: 400 });
    }

    const translated = await translateCaiyun(lines, token);
    return NextResponse.json({ translated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
