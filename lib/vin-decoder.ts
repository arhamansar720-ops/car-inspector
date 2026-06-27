export interface VinDecodeResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyType?: string;
  engineCylinders?: string;
  fuelType?: string;
  driveType?: string;
  transmissionType?: string;
  plant?: string;
}

interface NhtsaVariable {
  Variable: string;
  Value: string | null;
}

// Free NHTSA VIN decoder — no API key required
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("NHTSA VIN decoder unavailable");

  const data = await res.json() as { Results: NhtsaVariable[] };
  const results = data.Results;

  const get = (name: string): string =>
    results.find((r) => r.Variable === name)?.Value?.trim() || "";

  const year = parseInt(get("Model Year")) || new Date().getFullYear();
  const make = get("Make") || "Unknown";
  const model = get("Model") || "Unknown";
  const trim = get("Trim") || undefined;
  const bodyType = get("Body Class") || undefined;
  const engineCylinders = get("Engine Number of Cylinders") || undefined;
  const fuelType = get("Fuel Type - Primary") || undefined;
  const driveType = get("Drive Type") || undefined;
  const transmissionType = get("Transmission Style") || undefined;
  const plant = [get("Plant City"), get("Plant State"), get("Plant Country")].filter(Boolean).join(", ") || undefined;

  return { vin, year, make, model, trim, bodyType, engineCylinders, fuelType, driveType, transmissionType, plant };
}

export function isVin(input: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(input.trim());
}

export function isUrl(input: string): boolean {
  try {
    const u = new URL(input.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
