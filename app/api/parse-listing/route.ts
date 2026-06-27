import { NextRequest, NextResponse } from "next/server";
import { parseListingUrl } from "@/lib/listing-parser";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string };
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    const parsed = await parseListingUrl(url);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
