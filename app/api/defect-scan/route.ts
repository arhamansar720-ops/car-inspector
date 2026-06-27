import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DefectReport } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { photoUrls, listingTitle, price, mileage, year } = await req.json() as {
      photoUrls: string[];
      listingTitle: string;
      price?: number;
      mileage?: number;
      year?: number;
    };

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    // Limit to 8 photos to manage token costs
    const photos = photoUrls.slice(0, 8);

    const imageContent: Anthropic.ImageBlockParam[] = await buildImageContent(photos);

    if (imageContent.length === 0) {
      return NextResponse.json({ error: "Could not load any listing photos for analysis" }, { status: 400 });
    }

    const systemPrompt = `You are a seasoned used-car inspector with 20+ years of experience evaluating vehicles at auction and for private buyers. You look at car listing photos and give an honest, detailed condition report — no sugarcoating, no overselling. You point out every flaw you can spot.

Your output must be valid JSON matching this exact schema:
{
  "findings": [
    {
      "location": "string — describe where on the car (e.g., 'rear-left quarter panel', 'front bumper', 'driver seat', 'windshield')",
      "severity": "minor | moderate | major",
      "description": "string — specific, plain-English description of what you see",
      "photo_index": number — 0-based index of which photo shows this
    }
  ],
  "summary": "string — 2-3 sentence honest summary of overall condition",
  "overallCondition": "excellent | good | fair | poor",
  "buyRecommendation": "string — blunt 2-3 sentence take on whether this looks like a reasonable buy at this price/mileage, given what you see"
}

Severity guide:
- minor: cosmetic only, common for age/mileage, no structural concern (light scratches, minor interior wear)
- moderate: notable defect that affects appearance or may need attention soon (dents, faded paint, worn tires, significant stains)
- major: structural, safety, or high-cost issue (rust through panels, frame damage signs, airbag deployment signs, major accident damage, mismatched panels suggesting poor repair)

Look for: panel gaps/misalignment suggesting accident repair, paint mismatch or overspray, rust or bubbling, dents/creases, tire tread wear, brake dust buildup suggesting rotor wear, interior wear beyond age, stains, cracks, mismatched or aftermarket wheels, glass damage, flood damage signs (water marks, mold, discolored upholstery), and anything else suspicious.

Return ONLY the JSON object, no markdown, no explanation.`;

    const userContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
      {
        type: "text",
        text: `Please inspect this ${year || ""} vehicle listing: "${listingTitle}"${price ? ` listed at $${price.toLocaleString()}` : ""}${mileage ? ` with ${mileage.toLocaleString()} miles` : ""}. Analyze all ${imageContent.length} photo(s) provided and return your findings JSON.`,
      },
      ...imageContent,
    ];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const responseText = message.content.find((c) => c.type === "text")?.text || "";

    let report: DefectReport;
    try {
      // Strip any accidental markdown fencing
      const cleaned = responseText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      report = {
        ...parsed,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: responseText }, { status: 500 });
    }

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Defect scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function buildImageContent(photoUrls: string[]): Promise<Anthropic.ImageBlockParam[]> {
  const results: Anthropic.ImageBlockParam[] = [];

  for (const url of photoUrls) {
    try {
      // Try to fetch and base64-encode the image for reliable delivery to Claude
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Inspector/1.0)" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const mediaType = contentType.includes("png") ? "image/png"
        : contentType.includes("webp") ? "image/webp"
        : contentType.includes("gif") ? "image/gif"
        : "image/jpeg";

      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      results.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64,
        },
      });
    } catch {
      // Skip photos that fail to load — continue with rest
    }
  }

  return results;
}
