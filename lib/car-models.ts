import type { CarModelEntry, BodyType } from "./types";

// Library of generic reference models.
// To add a real GLB: drop the file at /public/models/<name>.glb and set glbFile below.
// Production would license a full make/model/year library (e.g. Evox Images, VisualRoute).
export const CAR_MODEL_LIBRARY: CarModelEntry[] = [
  { makes: ["honda"], models: ["civic"], bodyType: "sedan" },
  { makes: ["honda"], models: ["accord"], bodyType: "sedan" },
  { makes: ["honda"], models: ["cr-v", "crv"], bodyType: "suv" },
  { makes: ["honda"], models: ["pilot", "passport"], bodyType: "suv" },
  { makes: ["toyota"], models: ["camry"], bodyType: "sedan" },
  { makes: ["toyota"], models: ["corolla"], bodyType: "sedan" },
  { makes: ["toyota"], models: ["rav4"], bodyType: "suv" },
  { makes: ["toyota"], models: ["highlander", "4runner"], bodyType: "suv" },
  { makes: ["toyota"], models: ["tacoma"], bodyType: "truck" },
  { makes: ["ford"], models: ["mustang"], bodyType: "coupe" },
  { makes: ["ford"], models: ["f-150", "f150", "f 150"], bodyType: "truck" },
  { makes: ["ford"], models: ["explorer", "escape", "edge", "bronco"], bodyType: "suv" },
  { makes: ["chevrolet", "chevy"], models: ["silverado"], bodyType: "truck" },
  { makes: ["chevrolet", "chevy"], models: ["equinox", "traverse", "tahoe", "suburban"], bodyType: "suv" },
  { makes: ["bmw"], models: ["3 series", "330", "328", "m3"], bodyType: "sedan" },
  { makes: ["bmw"], models: ["5 series", "530", "528", "540", "m5"], bodyType: "sedan" },
  { makes: ["bmw"], models: ["x3", "x5", "x7"], bodyType: "suv" },
  { makes: ["mercedes", "mercedes-benz"], models: ["c-class", "c300", "c43", "c63"], bodyType: "sedan" },
  { makes: ["mercedes", "mercedes-benz"], models: ["e-class", "e300", "e350", "e450"], bodyType: "sedan" },
  { makes: ["audi"], models: ["a4", "a6", "s4", "s6", "rs4", "rs6"], bodyType: "sedan" },
  { makes: ["audi"], models: ["q5", "q7", "q8", "sq5"], bodyType: "suv" },
  { makes: ["jeep"], models: ["wrangler", "cherokee", "grand cherokee", "compass"], bodyType: "suv" },
  { makes: ["ram", "dodge"], models: ["1500", "2500", "ram"], bodyType: "truck" },
  { makes: ["subaru"], models: ["outback", "forester", "crosstrek"], bodyType: "suv" },
  { makes: ["subaru"], models: ["impreza", "legacy", "wrx"], bodyType: "sedan" },
  { makes: ["volkswagen", "vw"], models: ["jetta", "passat", "arteon"], bodyType: "sedan" },
  { makes: ["volkswagen", "vw"], models: ["tiguan", "atlas", "id.4"], bodyType: "suv" },
  { makes: ["nissan"], models: ["altima", "maxima", "sentra"], bodyType: "sedan" },
  { makes: ["nissan"], models: ["rogue", "pathfinder", "armada", "murano"], bodyType: "suv" },
  { makes: ["nissan"], models: ["frontier", "titan"], bodyType: "truck" },
  { makes: ["hyundai"], models: ["sonata", "elantra", "ioniq 6"], bodyType: "sedan" },
  { makes: ["hyundai"], models: ["tucson", "santa fe", "palisade", "ioniq 5"], bodyType: "suv" },
  { makes: ["kia"], models: ["k5", "stinger"], bodyType: "sedan" },
  { makes: ["kia"], models: ["sportage", "sorento", "telluride", "ev6"], bodyType: "suv" },
  { makes: ["tesla"], models: ["model 3", "model s"], bodyType: "sedan" },
  { makes: ["tesla"], models: ["model y", "model x", "cybertruck"], bodyType: "suv" },
  { makes: ["volvo"], models: ["s60", "s90"], bodyType: "sedan" },
  { makes: ["volvo"], models: ["xc40", "xc60", "xc90"], bodyType: "suv" },
  { makes: ["lexus"], models: ["is", "es", "gs", "ls"], bodyType: "sedan" },
  { makes: ["lexus"], models: ["rx", "nx", "gx", "lx", "ux"], bodyType: "suv" },
  { makes: ["chrysler", "dodge"], models: ["pacifica", "grand caravan"], bodyType: "minivan" },
  { makes: ["toyota"], models: ["sienna"], bodyType: "minivan" },
  { makes: ["honda"], models: ["odyssey"], bodyType: "minivan" },
];

export function matchCarModel(make: string, model: string): CarModelEntry {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  for (const entry of CAR_MODEL_LIBRARY) {
    const makeMatch = entry.makes.some((m) => makeLower.includes(m) || m.includes(makeLower));
    const modelMatch = entry.models.some((m) => modelLower.includes(m) || m.includes(modelLower));
    if (makeMatch && modelMatch) return entry;
  }

  // Fallback: match by make only, pick first entry
  for (const entry of CAR_MODEL_LIBRARY) {
    if (entry.makes.some((m) => makeLower.includes(m) || m.includes(makeLower))) {
      return entry;
    }
  }

  // Default generic sedan
  return { makes: [], models: [], bodyType: "sedan" };
}

const COLOR_MAP: [string[], string][] = [
  [["pearl white", "glacier white", "alpine white", "super white"], "#F4F4F0"],
  [["white"], "#F0F0EC"],
  [["midnight black", "jet black", "obsidian black", "phantom black", "piano black"], "#101010"],
  [["black"], "#1A1A1A"],
  [["silver", "lunar silver", "billet silver", "ingot silver"], "#A8A8A8"],
  [["gray", "grey", "magnetic gray", "machine gray", "nardo gray", "slate"], "#707070"],
  [["candy apple red", "san marino red", "barcelona red", "radiant red"], "#C02020"],
  [["red", "scarlet", "crimson", "ruby"], "#B82020"],
  [["navy blue", "deep sea blue", "mediterranean blue", "kona blue", "intense blue"], "#0A2040"],
  [["blue", "cobalt", "sky blue", "aegean blue", "portimão blue"], "#1A4A8A"],
  [["forest green", "dark green", "midnight green", "british racing green"], "#1E4020"],
  [["green", "lime"], "#2A5C2A"],
  [["orange", "solar orange", "tango blast", "inferno orange"], "#C84A0A"],
  [["yellow", "lightning yellow", "solar yellow"], "#D4A800"],
  [["gold", "champagne", "golden"], "#C8A840"],
  [["brown", "burnished bronze", "copper bronze"], "#5C3A20"],
  [["beige", "sandstone", "sand", "desert"], "#C8B48A"],
  [["purple", "midnight purple", "ultraviolet"], "#4A1A7A"],
  [["teal", "aquamarine", "voodoo blue"], "#1A7A6A"],
];

export function colorNameToHex(colorName?: string): string {
  if (!colorName) return "#2A3A5C";
  const lower = colorName.toLowerCase();
  for (const [keywords, hex] of COLOR_MAP) {
    if (keywords.some((k) => lower.includes(k))) return hex;
  }
  return "#2A3A5C"; // default dark blue
}

// Approximate 3D positions for common defect location descriptions
export const DEFECT_LOCATION_MAP: Record<string, [number, number, number]> = {
  "front bumper": [0, 0.2, 2.3],
  "rear bumper": [0, 0.2, -2.3],
  "hood": [0, 0.75, 1.6],
  "trunk": [0, 0.75, -1.8],
  "roof": [0, 1.35, 0],
  "windshield": [0, 1.0, 1.4],
  "rear window": [0, 1.0, -1.4],
  "front-left": [-1.0, 0.5, 1.3],
  "front-right": [1.0, 0.5, 1.3],
  "rear-left": [-1.0, 0.5, -1.3],
  "rear-right": [1.0, 0.5, -1.3],
  "driver": [-1.1, 0.6, 0.2],
  "passenger": [1.1, 0.6, 0.2],
  "left": [-1.2, 0.6, 0],
  "right": [1.2, 0.6, 0],
  "front": [0, 0.4, 2.2],
  "rear": [0, 0.4, -2.2],
  "wheel": [1.1, 0.1, 1.0],
  "tire": [1.1, 0.0, 1.0],
  "interior": [0, 0.6, 0.2],
  "seat": [0, 0.5, 0.3],
  "dashboard": [0, 0.7, 1.1],
};

export function findDefectPosition(location: string): [number, number, number] {
  const lower = location.toLowerCase();
  for (const [key, pos] of Object.entries(DEFECT_LOCATION_MAP)) {
    if (lower.includes(key)) return pos;
  }
  // Generic top-center fallback
  return [0, 1.0, 0];
}

export function bodyTypeLabel(bodyType: BodyType): string {
  const labels: Record<BodyType, string> = {
    sedan: "Sedan",
    suv: "SUV / Crossover",
    truck: "Pickup Truck",
    coupe: "Coupe",
    hatchback: "Hatchback",
    minivan: "Minivan",
  };
  return labels[bodyType];
}
