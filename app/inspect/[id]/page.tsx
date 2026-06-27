"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ListingData, DefectReport, DefectFinding } from "@/lib/types";
import { matchCarModel, colorNameToHex } from "@/lib/car-models";
import { saveInspection, saveDefectReport, loadInspection } from "@/lib/storage";
import DefectReportPanel from "@/components/DefectReport";
import ModifyPanel from "@/components/ModifyPanel";
import ChatPanel from "@/components/ChatPanel";

// Dynamically import the 3D viewer (no SSR — Three.js is client-only)
const CarViewer = dynamic(() => import("@/components/CarViewer"), {
  ssr: false,
  loading: () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-[500px] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Loading 3D viewer…</p>
      </div>
    </div>
  ),
});

type Phase = "loading-listing" | "scanning-defects" | "ready" | "error";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InspectPage({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading-listing");
  const [listing, setListing] = useState<ListingData | null>(null);
  const [defectReport, setDefectReport] = useState<DefectReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);

  // 3D viewer state
  const [bodyColor, setBodyColor] = useState<string>("#2A3A5C");
  const [wheelStyle, setWheelStyle] = useState<string>("stock");

  const [activeTab, setActiveTab] = useState<"viewer" | "chat">("viewer");

  const loadAndAnalyze = useCallback(async () => {
    const url = searchParams.get("url");
    const vin = searchParams.get("vin");

    if (!url && !vin) {
      // Try loading from localStorage cache
      const cached = loadInspection(id);
      if (cached) {
        setListing(cached.listing);
        if (cached.defectReport) {
          setDefectReport(cached.defectReport);
          setPhase("ready");
        } else {
          setPhase("ready");
        }
        setBodyColor(colorNameToHex(cached.listing.exteriorColor));
        return;
      }
      setErrorMessage("Listing not found. Please start a new inspection.");
      setPhase("error");
      return;
    }

    // Step 1: parse listing or decode VIN
    setPhase("loading-listing");

    let listingData: ListingData;
    try {
      if (url) {
        const res = await fetch("/api/parse-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to fetch listing (${res.status})`);
        }
        const parsed = await res.json();
        listingData = {
          id,
          url,
          vin: parsed.vin,
          title: parsed.title || `${parsed.year} ${parsed.make} ${parsed.model}`,
          year: parsed.year,
          make: parsed.make,
          model: parsed.model,
          trim: parsed.trim,
          price: parsed.price,
          mileage: parsed.mileage,
          exteriorColor: parsed.exteriorColor,
          interiorColor: parsed.interiorColor,
          photoUrls: parsed.photoUrls || [],
          createdAt: new Date().toISOString(),
          hasPhotos: (parsed.photoUrls || []).length > 0,
        };
      } else {
        // VIN-only path
        const res = await fetch("/api/decode-vin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "VIN decode failed");
        }
        const decoded = await res.json();
        listingData = {
          id,
          vin: decoded.vin,
          title: `${decoded.year} ${decoded.make} ${decoded.model}${decoded.trim ? " " + decoded.trim : ""}`,
          year: decoded.year,
          make: decoded.make,
          model: decoded.model,
          trim: decoded.trim,
          photoUrls: [],
          createdAt: new Date().toISOString(),
          hasPhotos: false,
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load listing";
      setErrorMessage(msg);
      setPhase("error");
      return;
    }

    setListing(listingData);
    setBodyColor(colorNameToHex(listingData.exteriorColor));
    saveInspection(listingData);

    // Step 2: defect scan (only if we have photos)
    if (listingData.hasPhotos && listingData.photoUrls.length > 0) {
      setPhase("scanning-defects");
      try {
        const res = await fetch("/api/defect-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoUrls: listingData.photoUrls,
            listingTitle: listingData.title,
            price: listingData.price,
            mileage: listingData.mileage,
            year: listingData.year,
          }),
        });
        if (res.ok) {
          const report: DefectReport = await res.json();
          setDefectReport(report);
          saveDefectReport(id, report);
        }
        // If defect scan fails, continue without it — don't block the rest
      } catch {
        // non-blocking
      }
    }

    setPhase("ready");
  }, [id, searchParams]);

  useEffect(() => {
    loadAndAnalyze();
  }, [loadAndAnalyze]);

  if (phase === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.875.875 0 100-1.75.875.875 0 000 1.75z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white mb-1">Inspection Failed</h2>
          <p className="text-zinc-400 text-sm max-w-md">{errorMessage}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 transition-colors"
        >
          ← Back to Search
        </button>
      </div>
    );
  }

  const carEntry = listing ? matchCarModel(listing.make, listing.model) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-zinc-800/60 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex-1 min-w-0">
            {listing ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-semibold text-white truncate">{listing.title}</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-400 shrink-0">
                  {listing.price && <span>${listing.price.toLocaleString()}</span>}
                  {listing.price && listing.mileage && <span className="text-zinc-700">·</span>}
                  {listing.mileage && <span>{listing.mileage.toLocaleString()} mi</span>}
                  {listing.exteriorColor && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="capitalize">{listing.exteriorColor}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse" />
            )}
          </div>

          <div className={`shrink-0 text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
            phase === "loading-listing" ? "bg-zinc-800 text-zinc-400" :
            phase === "scanning-defects" ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" :
            "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          }`}>
            {phase === "loading-listing" && "Loading…"}
            {phase === "scanning-defects" && "Scanning photos…"}
            {phase === "ready" && "Ready"}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* VIN-only notice */}
        {listing && !listing.hasPhotos && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-300">VIN decode only — no listing photos available</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Photo-based defect analysis requires a listing URL. Paste a cars.com or dealer URL to get the full inspection.
              </p>
            </div>
          </div>
        )}

        {/* Defect report — shown FIRST, always above the 3D viewer */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Step 1 — Defect Report</h2>
          {phase === "scanning-defects" || (phase === "loading-listing") ? (
            <DefectReportPanel loading={true} />
          ) : defectReport ? (
            <DefectReportPanel
              report={defectReport}
              onSelectFinding={setSelectedFinding}
              selectedFinding={selectedFinding}
            />
          ) : listing && !listing.hasPhotos ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-500">No photos available for defect analysis. Provide a listing URL to enable photo scanning.</p>
            </div>
          ) : phase === "ready" ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-sm text-zinc-500">Defect scan unavailable for this listing.</p>
            </div>
          ) : null}
        </section>

        {/* Photos strip */}
        {listing && listing.photoUrls.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Listing Photos</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
              {listing.photoUrls.slice(0, 12).map((url, i) => (
                <div
                  key={i}
                  className={`shrink-0 w-40 h-28 rounded-xl overflow-hidden border snap-start transition-all cursor-pointer ${
                    defectReport?.findings.some((f) => f.photo_index === i)
                      ? "border-orange-500/60"
                      : "border-zinc-800"
                  }`}
                  onClick={() => {
                    const idx = defectReport?.findings.findIndex((f) => f.photo_index === i);
                    if (idx !== undefined && idx >= 0) setSelectedFinding(idx);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Listing photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
            {defectReport && defectReport.findings.some((f) => listing.photoUrls[f.photo_index]) && (
              <p className="text-xs text-zinc-500 mt-2">
                Photos with an orange border have flagged defects — click to highlight.
              </p>
            )}
          </section>
        )}

        {/* 3D viewer + panels */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Step 2 — Reference 3D Model</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 3D viewer */}
            <div className="lg:col-span-2">
              {listing && carEntry ? (
                <CarViewer
                  bodyType={carEntry.bodyType}
                  bodyColor={bodyColor}
                  findings={defectReport?.findings ?? []}
                  selectedFinding={selectedFinding}
                />
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-[500px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin mx-auto" />
                    <p className="text-sm text-zinc-500">Preparing model…</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel: tabs for Modify / VIN info */}
            <div className="space-y-4">
              {/* VIN info */}
              {listing?.vin && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">VIN</div>
                  <div className="font-mono text-sm text-zinc-200 tracking-widest">{listing.vin}</div>
                </div>
              )}

              {/* Modify panel */}
              <ModifyPanel
                currentColor={bodyColor}
                currentWheel={wheelStyle}
                onColorChange={setBodyColor}
                onWheelChange={setWheelStyle}
              />
            </div>
          </div>
        </section>

        {/* Chat */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Step 3 — Ask the Advisor</h2>
          {listing ? (
            <ChatPanel listing={listing} defectReport={defectReport ?? undefined} />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-48 flex items-center justify-center">
              <p className="text-sm text-zinc-500">Loading…</p>
            </div>
          )}
        </section>

        {/* Listing metadata */}
        {listing && (
          <section>
            <details className="group">
              <summary className="text-xs font-semibold uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors list-none flex items-center gap-2">
                <svg className="w-3 h-3 group-open:rotate-90 transition-transform" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Raw Listing Data
              </summary>
              <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Year", listing.year],
                    ["Make", listing.make],
                    ["Model", listing.model],
                    ["Trim", listing.trim],
                    ["Price", listing.price ? `$${listing.price.toLocaleString()}` : undefined],
                    ["Mileage", listing.mileage ? `${listing.mileage.toLocaleString()} mi` : undefined],
                    ["Exterior", listing.exteriorColor],
                    ["Interior", listing.interiorColor],
                    ["VIN", listing.vin],
                    ["Photos found", listing.photoUrls.length || "0"],
                    ["Source", listing.url ? new URL(listing.url).hostname : "VIN decode"],
                  ].filter(([, v]) => v !== undefined).map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-zinc-500 text-xs">{label}</dt>
                      <dd className="text-zinc-200 mt-0.5 capitalize truncate">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-800/60 text-center mt-8">
        <p className="text-xs text-zinc-600">
          Inspector · Reference 3D model — not a reconstruction of this vehicle · Best-effort AI photo analysis
        </p>
      </footer>
    </div>
  );
}
