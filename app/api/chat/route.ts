import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, ListingData, DefectReport } from "@/lib/types";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, listing, defectReport } = await req.json() as {
      messages: ChatMessage[];
      listing: ListingData;
      defectReport?: DefectReport;
    };

    const model = genai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: buildSystemPrompt(listing, defectReport),
    });

    // Gemini needs alternating user/model turns — merge any consecutive same-role messages
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
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
  const lines = [
    "You are a blunt, knowledgeable used-car advisor — like a trusted mechanic friend who shoots straight. Give real opinions, not hedge-everything disclaimers.",
    "",
    `Vehicle: ${listing.year} ${listing.make} ${listing.model}${listing.trim ? " " + listing.trim : ""}`,
    listing.price ? `Listed price: $${listing.price.toLocaleString()}` : "",
    listing.mileage ? `Mileage: ${listing.mileage.toLocaleString()} miles` : "",
    listing.exteriorColor ? `Exterior: ${listing.exteriorColor}` : "",
    listing.vin ? `VIN: ${listing.vin}` : "",
    "",
  ];

  if (defectReport) {
    lines.push(`Overall condition: ${defectReport.overallCondition.toUpperCase()}`);
    lines.push("Visual findings:");
    for (const f of defectReport.findings) {
      lines.push(`  [${f.severity.toUpperCase()}] ${f.location}: ${f.description}`);
    }
    lines.push(`Summary: ${defectReport.summary}`);
    lines.push(`Buy recommendation: ${defectReport.buyRecommendation}`);
    lines.push("");
  }

  lines.push(
    "Answer questions about this specific vehicle. Be direct — if it looks like a bad deal, say so.",
    "Keep answers concise but complete. No excessive hedging.",
    "Carfax/AutoCheck history is not available — flag that if asked. Full history requires a paid partner API."
  );

  return lines.filter(Boolean).join("\n");
}
