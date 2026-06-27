"use client";

import { useEffect, useState, useCallback, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ListingData, DefectReport } from "@/lib/types";
import { matchCarModel, colorNameToHex } from "@/lib/car-models";
import { saveInspection, saveDefectReport, loadInspection } from "@/lib/storage";
import DefectReportPanel from "@/components/DefectReport";
import ModifyPanel from "@/components/ModifyPanel";
import ChatPanel from "@/components/ChatPanel";

const CarViewer = dynamic(() => import("@/components/CarViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin" />
        <p className="text-[12px] text-white/30">Rendering model…</p>
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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin" />
      </div>
    }>
      <InspectInner id={id} />
    </Suspense>
  );
}

function InspectInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading-listing");
  const [listing, setListing] = useState<ListingData | null>(null);
  const [defectReport, setDefectReport] = useState<DefectReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);
  const [bodyColor, setBodyColor] = useState<string>("#2A3A5C");
  const [wheelStyle, setWheelStyle] = useState<string>("stock");

  const loadAndAnalyze = useCallback(async () => {
    const url = searchParams.get("url");
    const vin = searchParams.get("vin");

    if (!url && !vin) {
      const cached = loadInspection(id);
      if (cached) {
        setListing(cached.listing);
        if (cached.defectReport) setDefectReport(cached.defectReport);
        setBodyColor(colorNameToHex(cached.listing.exteriorColor));
        setPhase("ready");
        return;
      }
      setErrorMessage("Listing not found. Start a new inspection.");
      setPhase("error");
      return;
    }

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
          id, url,
          vin: parsed.vin,
          title: parsed.title || `${parsed.year} ${parsed.make} ${parsed.model}`,
          year: parsed.year, make: parsed.make, model: parsed.model, trim: parsed.trim,
          price: parsed.price, mileage: parsed.mileage,
          exteriorColor: parsed.exteriorColor, interiorColor: parsed.interiorColor,
          photoUrls: parsed.photoUrls || [],
          createdAt: new Date().toISOString(),
          hasPhotos: (parsed.photoUrls || []).length > 0,
        };
      } else {
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
          id, vin: decoded.vin,
          title: `${decoded.year} ${decoded.make} ${decoded.model}${decoded.trim ? " " + decoded.trim : ""}`,
          year: decoded.year, make: decoded.make, model: decoded.model, trim: decoded.trim,
          photoUrls: [], createdAt: new Date().toISOString(), hasPhotos: false,
        };
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load listing");
      setPhase("error");
      return;
    }

    setListing(listingData);
    setBodyColor(colorNameToHex(listingData.exteriorColor));
    saveInspection(listingData);

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
      } catch { /* non-blocking */ }
    }

    setPhase("ready");
  }, [id, searchParams]);

  useEffect(() => { loadAndAnalyze(); }, [loadAndAnalyze]);

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-5 px-6">
        <div className="w-11 h-11 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#ff453a]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.875.875 0 100-1.75.875.875 0 000 1.75z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-[16px] font-semibold text-white mb-1.5">Inspection Failed</h2>
          <p className="text-[13px] text-white/40 max-w-sm leading-relaxed">{errorMessage}</p>
        </div>
        <button onClick={() => router.push("/")}
          className="h-9 px-5 rounded-[10px] bg-white/[0.07] hover:bg-white/[0.11] text-[13px] font-medium text-white/70 transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  const carEntry = listing ? matchCarModel(listing.make, listing.model) : null;
  const isLoading = phase === "loading-listing";
  const isScanning = phase === "scanning-defects";

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-white/35 hover:text-white/70 transition-colors text-[13px] shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <div className="w-px h-4 bg-white/[0.08] shrink-0" />

          <div className="flex-1 min-w-0 flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin" />
                <span className="text-[13px] text-white/30">Fetching listing…</span>
              </div>
            ) : listing ? (
              <>
                <h1 className="text-[14px] font-semibold text-white/90 truncate">{listing.title}</h1>
                <div className="hidden sm:flex items-center gap-2 text-[12px] text-white/30 shrink-0">
                  {listing.price && <span>${listing.price.toLocaleString()}</span>}
                  {listing.price && listing.mileage && <span className="text-white/12">·</span>}
                  {listing.mileage && <span>{listing.mileage.toLocaleString()} mi</span>}
                </div>
              </>
            ) : null}
          </div>

          {/* Phase pill */}
          <div className={`shrink-0 flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold tracking-wide ${
            isScanning
              ? "bg-[#0a84ff]/10 text-[#409cff]"
              : phase === "ready"
              ? "bg-[#30d158]/10 text-[#30d158]"
              : "bg-white/[0.05] text-white/30"
          }`}>
            {isScanning && <div className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse" />}
            {phase === "ready" && <div className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />}
            <span>
              {isLoading && "Loading"}
              {isScanning && "Scanning photos"}
              {phase === "ready" && "Ready"}
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-5 sm:px-8 py-7">
        <div className="flex gap-6 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* VIN-only notice */}
            {listing && !listing.hasPhotos && (
              <div className="flex items-start gap-3 p-4 rounded-[14px] bg-[#ff9f0a]/[0.07] border border-[#ff9f0a]/20">
                <svg className="w-4 h-4 text-[#ff9f0a] shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M6.788 1.996c.533-.924 1.892-.924 2.424 0l5.025 8.7c.528.914-.14 2.054-1.212 2.054H2.975c-1.072 0-1.74-1.14-1.212-2.054l5.025-8.7zM8 5a.625.625 0 01.625.625v2.75a.625.625 0 01-1.25 0v-2.75A.625.625 0 018 5zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-[13px] font-medium text-[#ff9f0a]">VIN decoded — no listing photos</p>
                  <p className="text-[12px] text-[#ff9f0a]/50 mt-0.5 leading-relaxed">
                    Photo defect analysis requires a listing URL. Paste a cars.com or dealer URL for the full report.
                  </p>
                </div>
              </div>
            )}

            {/* ── Defect Report ── */}
            <Section label="Defect Report">
              {(isLoading || isScanning) ? (
                <DefectReportPanel loading={true} />
              ) : defectReport ? (
                <DefectReportPanel
                  report={defectReport}
                  onSelectFinding={setSelectedFinding}
                  selectedFinding={selectedFinding}
                />
              ) : (
                <EmptyCard text={
                  listing && !listing.hasPhotos
                    ? "No photos available — provide a listing URL to enable defect scanning."
                    : "Defect scan unavailable for this listing."
                }/>
              )}
            </Section>

            {/* ── Photo strip ── */}
            {listing && listing.photoUrls.length > 0 && (
              <Section label="Listing Photos">
                <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x scroll-smooth">
                  {listing.photoUrls.slice(0, 16).map((url, i) => {
                    const hasFinding = defectReport?.findings.some((f) => f.photo_index === i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const idx = defectReport?.findings.findIndex((f) => f.photo_index === i) ?? -1;
                          if (idx >= 0) setSelectedFinding(idx);
                        }}
                        className={`shrink-0 w-[140px] h-[96px] rounded-[10px] overflow-hidden border snap-start transition-all ${
                          hasFinding
                            ? "border-[#ff9f0a]/50 shadow-[0_0_0_1px_rgba(255,159,10,0.3)]"
                            : "border-white/[0.07] hover:border-white/[0.14]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                        />
                      </button>
                    );
                  })}
                </div>
                {defectReport && defectReport.findings.length > 0 && (
                  <p className="text-[11px] text-white/20 mt-2.5">
                    Orange-bordered photos contain flagged defects — click to highlight on model.
                  </p>
                )}
              </Section>
            )}

            {/* ── 3D Viewer ── */}
            <Section label="Reference 3D Model">
              <div className="rounded-[16px] overflow-hidden border border-white/[0.07] bg-[#0f0f0f]">
                {/* Disclaimer strip */}
                <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">Reference Only</span>
                  <span className="text-white/10">·</span>
                  <span className="text-[11px] text-white/20">
                    Generic {carEntry?.bodyType ?? "vehicle"} — not a reconstruction of the listed car
                  </span>
                </div>
                <div className="h-[400px]">
                  {listing && carEntry ? (
                    <CarViewer
                      bodyType={carEntry.bodyType}
                      bodyColor={bodyColor}
                      findings={defectReport?.findings ?? []}
                      selectedFinding={selectedFinding}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Customize ── */}
            <Section label="Customize Preview">
              <ModifyPanel
                currentColor={bodyColor}
                currentWheel={wheelStyle}
                onColorChange={setBodyColor}
                onWheelChange={setWheelStyle}
              />
            </Section>

            {/* ── Raw data ── */}
            {listing && (
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.12em] text-white/20 hover:text-white/40 transition-colors w-fit">
                  <svg className="w-2.5 h-2.5 group-open:rotate-90 transition-transform duration-150" viewBox="0 0 10 10" fill="none">
                    <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Listing Data
                </summary>
                <div className="mt-3 p-4 rounded-[14px] bg-[#0f0f0f] border border-white/[0.06]">
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
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
                      ["Photos", listing.photoUrls.length || "0"],
                      ["Source", listing.url ? new URL(listing.url).hostname : "VIN decode"],
                    ].filter(([, v]) => v !== undefined).map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1">{label}</dt>
                        <dd className="text-[13px] text-white/70 capitalize truncate">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            )}
          </div>

          {/* ── Right sidebar — Chat ── */}
          <div className="hidden lg:block w-[360px] shrink-0 sticky top-[72px]">
            <Section label="Advisor Chat">
              {listing ? (
                <ChatPanel listing={listing} defectReport={defectReport ?? undefined} />
              ) : (
                <div className="h-[520px] flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin" />
                </div>
              )}
            </Section>
          </div>
        </div>

        {/* Chat on mobile — below everything */}
        <div className="lg:hidden mt-5">
          <Section label="Advisor Chat">
            {listing ? (
              <ChatPanel listing={listing} defectReport={defectReport ?? undefined} />
            ) : (
              <EmptyCard text="Loading…" />
            )}
          </Section>
        </div>
      </div>

      <footer className="border-t border-white/[0.04] px-8 py-5">
        <p className="text-[11px] text-white/15 text-center">
          Inspector · Reference 3D model — not a reconstruction · AI photo analysis is best-effort
        </p>
      </footer>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/20 mb-2.5">{label}</p>
      {children}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="p-5 rounded-[16px] bg-[#0f0f0f] border border-white/[0.06]">
      <p className="text-[13px] text-white/25">{text}</p>
    </div>
  );
}
