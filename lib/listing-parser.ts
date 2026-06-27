import * as cheerio from "cheerio";

export interface ParsedListing {
  title: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  mileage?: number;
  exteriorColor?: string;
  interiorColor?: string;
  vin?: string;
  photoUrls: string[];
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

export async function parseListingUrl(url: string): Promise<ParsedListing> {
  const hostname = new URL(url).hostname.toLowerCase();

  const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);

  const html = await res.text();
  const $ = cheerio.load(html);

  if (hostname.includes("cars.com")) {
    return parseCarscom($, url);
  }
  if (hostname.includes("autotrader.com")) {
    return parseAutotrader($, url);
  }
  if (hostname.includes("cargurus.com")) {
    return parseCarGurus($, url);
  }

  // Generic fallback parser — works reasonably well on most dealer sites
  return parseGeneric($, url);
}

function parseCarscom($: cheerio.CheerioAPI, url: string): ParsedListing {
  const title =
    $('h1.listing-title').text().trim() ||
    $('[class*="listing-title"]').first().text().trim() ||
    $("h1").first().text().trim();

  const priceText = $('[class*="price"]').first().text().replace(/[^0-9]/g, "");
  const price = priceText ? parseInt(priceText) : undefined;

  const mileageText = $('[class*="mileage"]').first().text().replace(/[^0-9]/g, "");
  const mileage = mileageText ? parseInt(mileageText) : undefined;

  const photoUrls: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src && (src.includes("i.cars.com") || src.includes("listing"))) {
      const clean = src.split("?")[0];
      if (clean && !photoUrls.includes(clean)) photoUrls.push(clean);
    }
  });

  let vin: string | undefined;
  $("*").each((_, el) => {
    const text = $(el).text();
    const m = text.match(/\bVIN[:\s]*([A-HJ-NPR-Z0-9]{17})\b/i);
    if (m) vin = m[1];
  });

  const { year, make, model, trim } = parseVehicleTitle(title);
  const exteriorColor = extractColorFromPage($, "exterior");
  const interiorColor = extractColorFromPage($, "interior");

  return { title, year, make, model, trim, price, mileage, vin, exteriorColor, interiorColor, photoUrls: photoUrls.slice(0, 20) };
}

function parseAutotrader($: cheerio.CheerioAPI, _url: string): ParsedListing {
  const title = $("h1").first().text().trim();
  const priceText = $('[class*="price-section"]').first().text().replace(/[^0-9]/g, "");
  const price = priceText ? parseInt(priceText) : undefined;

  const photoUrls: string[] = [];
  $("img[src*='autotrader']").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && !photoUrls.includes(src)) photoUrls.push(src);
  });
  // Also grab from srcset / data-src
  $("img[data-src]").each((_, el) => {
    const src = $(el).attr("data-src") || "";
    if (src && !photoUrls.includes(src)) photoUrls.push(src);
  });

  const { year, make, model, trim } = parseVehicleTitle(title);
  const exteriorColor = extractColorFromPage($, "exterior");
  const interiorColor = extractColorFromPage($, "interior");

  return { title, year, make, model, trim, price, exteriorColor, interiorColor, photoUrls: photoUrls.slice(0, 20) };
}

function parseCarGurus($: cheerio.CheerioAPI, _url: string): ParsedListing {
  const title = $("h1").first().text().trim();
  const priceText = $('[data-testid="listing-price"]').text().replace(/[^0-9]/g, "") ||
    $('[class*="price"]').first().text().replace(/[^0-9]/g, "");
  const price = priceText ? parseInt(priceText) : undefined;

  const photoUrls: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src && src.includes("cargurus") && !photoUrls.includes(src)) {
      photoUrls.push(src);
    }
  });

  const { year, make, model, trim } = parseVehicleTitle(title);
  const exteriorColor = extractColorFromPage($, "exterior");

  return { title, year, make, model, trim, price, exteriorColor, photoUrls: photoUrls.slice(0, 20) };
}

function parseGeneric($: cheerio.CheerioAPI, _url: string): ParsedListing {
  const title = $("h1").first().text().trim() || $("title").text().trim();

  // Extract price — look for dollar amounts
  let price: number | undefined;
  const pricePatterns = [
    /\$\s*([\d,]+)/,
    /price[:\s]*([\d,]+)/i,
  ];
  const bodyText = $("body").text();
  for (const pattern of pricePatterns) {
    const m = bodyText.match(pattern);
    if (m) { price = parseInt(m[1].replace(/,/g, "")); break; }
  }

  // Extract mileage
  let mileage: number | undefined;
  const mileageM = bodyText.match(/([\d,]+)\s*(?:miles|mi\.)/i);
  if (mileageM) mileage = parseInt(mileageM[1].replace(/,/g, ""));

  // Extract VIN
  let vin: string | undefined;
  const vinM = bodyText.match(/\bVIN[:\s#]*([A-HJ-NPR-Z0-9]{17})\b/i);
  if (vinM) vin = vinM[1];

  // Collect images
  const photoUrls: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
    if (src && src.startsWith("http") && !src.includes("logo") && !src.includes("icon") && !photoUrls.includes(src)) {
      photoUrls.push(src);
    }
  });

  const exteriorColor = extractColorFromPage($, "exterior");
  const interiorColor = extractColorFromPage($, "interior");
  const { year, make, model, trim } = parseVehicleTitle(title);

  return { title, year, make, model, trim, price, mileage, vin, exteriorColor, interiorColor, photoUrls: photoUrls.slice(0, 20) };
}

function extractColorFromPage($: cheerio.CheerioAPI, type: "exterior" | "interior"): string | undefined {
  const text = $("body").text();
  const pattern = new RegExp(`${type}[^a-z]*color[:\\s]*([a-z\\s]+?)(?:\\n|,|\\.|\\d|$)`, "i");
  const m = text.match(pattern);
  if (m) return m[1].trim();

  // Also check meta/structured data
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const colorWords = ["white", "black", "silver", "gray", "grey", "red", "blue", "green", "yellow", "orange", "brown", "beige", "gold", "purple"];
  for (const word of colorWords) {
    if (metaDesc.toLowerCase().includes(word)) return word;
  }
  return undefined;
}

const MAKES = [
  "acura", "alfa romeo", "aston martin", "audi", "bentley", "bmw", "bugatti", "buick",
  "cadillac", "chevrolet", "chevy", "chrysler", "dodge", "ferrari", "fiat", "ford",
  "genesis", "gmc", "honda", "hyundai", "infiniti", "jaguar", "jeep", "kia",
  "lamborghini", "land rover", "lexus", "lincoln", "lotus", "maserati", "mazda",
  "mclaren", "mercedes-benz", "mercedes", "mini", "mitsubishi", "nissan",
  "polestar", "porsche", "ram", "rivian", "rolls-royce", "subaru", "tesla",
  "toyota", "volkswagen", "volvo",
];

export function parseVehicleTitle(title: string): { year: number; make: string; model: string; trim?: string } {
  // Extract year (4-digit number between 1900-2030)
  const yearM = title.match(/\b(19[5-9]\d|20[0-3]\d)\b/);
  const year = yearM ? parseInt(yearM[1]) : new Date().getFullYear();

  const titleLower = title.toLowerCase();
  let make = "Unknown";
  let makeIdx = -1;

  for (const m of MAKES) {
    const idx = titleLower.indexOf(m);
    if (idx >= 0) {
      make = m.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      makeIdx = idx;
      break;
    }
  }

  // Model is the next word(s) after the make
  let model = "Unknown";
  let trim: string | undefined;
  if (makeIdx >= 0) {
    const afterMake = title.slice(makeIdx + make.length).trim();
    const parts = afterMake.split(/\s+/);
    if (parts.length > 0) {
      // Model could be 1-2 words; rest is trim
      model = parts[0];
      if (parts.length > 1 && parts[1] && !/^\d/.test(parts[1]) && !["for", "sale", "used", "certified"].includes(parts[1].toLowerCase())) {
        model += " " + parts[1];
        if (parts.length > 2) trim = parts.slice(2).join(" ");
      } else if (parts.length > 1) {
        trim = parts.slice(1).join(" ");
      }
    }
  }

  return { year, make, model, trim };
}
