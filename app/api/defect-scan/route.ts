import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DefectReport } from "@/lib/types";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { photoUrls, listingTitle, price, mileage } = await req.json() as {
      photoUrls: string[];
      listingTitle: string;
      price?: number;
      mileage?: number;
      year?: number;
    };

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const imageParts = await buildImageParts(photoUrls.slice(0, 8));
    if (imageParts.length === 0) {
      return NextResponse.json({ error: "Could not load any listing photos" }, { status: 400 });
    }

    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a seasoned used-car inspector with 20+ years of experience. Analyze these ${imageParts.length} car listing photo(s) for the vehicle: "${listingTitle}"${price ? ` listed at $${price.toLocaleString()}` : ""}${mileage ? ` with ${mileage.toLocaleString()} miles` : ""}.

Return ONLY a valid JSON object — no markdown fences, no explanation — matching this exact schema:
{
  "findings": [
    {
      "location": "string — where on the car (e.g. 'rear-left quarter panel', 'front bumper', 'driver seat')",
      "severity": "minor | moderate | major",
      "description": "string — specific plain-English description of the defect",
      "photo_index": 0
    }
  ],
  "summary": "string — 2-3 sentence honest condition summary",
  "overallCondition": "excellent | good | fair | poor",
  "buyRecommendation": "string — blunt 2-3 sentence take on whether this is a reasonable buy"
}

Severity: minor = cosmetic only; moderate = notable, needs attention; major = structural/safety/high-cost issue.
Look for: panel gaps, paint mismatch/overspray, rust, dents, tire wear, interior stains, glass damage, flood signs.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();

    let report: DefectReport;
    try {
      const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      report = { ...JSON.parse(cleaned), generatedAt: new Date().toISOString() };
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 });
    }

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Defect scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function buildImageParts(photoUrls: string[]) {
  const parts: { inlineData: { mimeType: string; data: string } }[] = [];
  for (const url of photoUrls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Inspector/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "image/jpeg";
      const mimeType = ct.includes("png") ? "image/png" : ct.includes("webp") ? "image/webp" : "image/jpeg";
      const data = Buffer.from(await res.arrayBuffer()).toString("base64");
      parts.push({ inlineData: { mimeType, data } });
    } catch { /* skip failed photos */ }
  }
  return parts;
}
