import { NextRequest, NextResponse } from "next/server";
import { decodeVin } from "@/lib/vin-decoder";

export async function POST(req: NextRequest) {
  try {
    const { vin } = await req.json() as { vin: string };
    if (!vin) return NextResponse.json({ error: "No VIN provided" }, { status: 400 });

    const result = await decodeVin(vin.trim().toUpperCase());
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to decode VIN";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
