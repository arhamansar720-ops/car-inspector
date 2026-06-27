import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ListingData, DefectReport } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, listing, defectReport } = await req.json() as {
      messages: ChatMessage[];
      listing: ListingData;
      defectReport?: DefectReport;
    };

    const systemPrompt = buildSystemPrompt(listing, defectReport);

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    // Return a streaming text response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function buildSystemPrompt(listing: ListingData, defectReport?: DefectReport): string {
  const lines: string[] = [
    "You are a blunt, knowledgeable used-car advisor — think of a trusted mechanic friend who will shoot straight with you. Give real opinions, not hedge-everything disclaimers.",
    "",
    "Current listing context:",
    `- Vehicle: ${listing.year} ${listing.make} ${listing.model}${listing.trim ? " " + listing.trim : ""}`,
    listing.price ? `- Listed price: $${listing.price.toLocaleString()}` : "",
    listing.mileage ? `- Mileage: ${listing.mileage.toLocaleString()} miles` : "",
    listing.exteriorColor ? `- Exterior: ${listing.exteriorColor}` : "",
    listing.vin ? `- VIN: ${listing.vin}` : "",
    "",
  ];

  if (defectReport) {
    lines.push("Visual inspection findings (from AI photo analysis):");
    lines.push(`- Overall condition: ${defectReport.overallCondition.toUpperCase()}`);
    if (defectReport.findings.length > 0) {
      for (const f of defectReport.findings) {
        lines.push(`- [${f.severity.toUpperCase()}] ${f.location}: ${f.description}`);
      }
    } else {
      lines.push("- No significant defects visible in photos");
    }
    lines.push("");
    lines.push(`Inspector summary: ${defectReport.summary}`);
    lines.push(`Buy recommendation: ${defectReport.buyRecommendation}`);
    lines.push("");
  }

  lines.push(
    "Answer questions about this specific vehicle. Be direct and concrete — if it looks like a bad deal, say so. If something in the photos concerns you, elaborate. If the user asks what something is worth, give a ballpark based on make/model/year/mileage/condition.",
    "Keep answers concise but complete. Use plain language. No excessive hedging.",
    "",
    "Note: Carfax/AutoCheck history is not available in this MVP — flag that explicitly if the user asks about accident history beyond what photos show. Full history report integration requires a paid partner API (VinAudit, etc.) and will be added in a future version."
  );

  return lines.filter((l) => l !== undefined).join("\n");
}
