export interface ListingData {
  id: string;
  url?: string;
  vin?: string;
  title: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  mileage?: number;
  exteriorColor?: string;
  interiorColor?: string;
  photoUrls: string[];
  createdAt: string;
  hasPhotos: boolean;
}

export interface DefectFinding {
  location: string;
  severity: "minor" | "moderate" | "major";
  description: string;
  photo_index: number;
}

export interface DefectReport {
  findings: DefectFinding[];
  summary: string;
  overallCondition: "excellent" | "good" | "fair" | "poor";
  buyRecommendation: string;
  generatedAt: string;
}

export interface StoredInspection {
  listing: ListingData;
  defectReport?: DefectReport;
}

export type BodyType = "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "minivan";

export interface CarModelEntry {
  makes: string[];
  models: string[];
  bodyType: BodyType;
  // Drop a .glb file at /public/models/{glbFile} for a real model.
  // Leave undefined to use the procedural fallback geometry.
  glbFile?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
