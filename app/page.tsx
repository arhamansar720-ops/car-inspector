"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isVin, isUrl } from "@/lib/vin-decoder";
import { loadAllInspections } from "@/lib/storage";
import type { StoredInspection } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredInspection[]>([]);
  const [inputType, setInputType] = useState<"url" | "vin" | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setHistory(loadAllInspections());
  }, []);

  const handleInputChange = (val: string) => {
    setInput(val);
    setError(null);
    if (isVin(val)) setInputType("vin");
    else if (isUrl(val)) setInputType("url");
    else setInputType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const params = new URLSearchParams({ id });
      if (isUrl(trimmed)) {
        params.set("url", trimmed);
      } else if (isVin(trimmed)) {
        params.set("vin", trimmed.toUpperCase());
      } else {
        setError("Enter a listing URL or a 17-character VIN.");
        setLoading(false);
        return;
      }
      router.push(`/inspect/${id}?${params.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-black">
      {/* Wordmark */}
      <header className="px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-[7px] bg-[#0a84ff] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 14 14" fill="none">
              <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8.5 8.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-white/90">Inspector</span>
        </div>
        <span className="text-[12px] text-white/25 tracking-wide font-medium">AI — Preview</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-16 -mt-10">
        <div className="w-full max-w-[560px]">

          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-5">
              AI Car Inspection
            </p>
            <h1 className="text-[42px] sm:text-[52px] font-bold tracking-tight text-white leading-[1.08] mb-4">
              Know before<br/>you buy.
            </h1>
            <p className="text-[15px] text-white/40 leading-relaxed">
              Paste a listing URL or VIN. Get a photo defect report,<br className="hidden sm:block"/>
              a 3D reference model, and straight-talking buy advice.
            </p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit}>
            <div className={`relative rounded-[16px] transition-all duration-200 ${
              focused
                ? "ring-1 ring-[#0a84ff]/60 shadow-[0_0_0_4px_rgba(10,132,255,0.12)]"
                : "ring-1 ring-white/[0.08]"
            } bg-[#0f0f0f]`}>
              <div className="flex items-center gap-3 px-4 py-4">
                <svg className="w-4 h-4 text-white/25 shrink-0" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Paste a listing URL or 17-character VIN…"
                  className="flex-1 bg-transparent text-[14px] text-white placeholder-white/20 focus:outline-none"
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                {inputType && (
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                    inputType === "vin"
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-[#0a84ff]/15 text-[#409cff]"
                  }`}>
                    {inputType}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 h-8 px-4 rounded-[10px] bg-[#0a84ff] hover:bg-[#409cff] disabled:bg-white/[0.06] disabled:text-white/20 text-white text-[13px] font-semibold transition-colors duration-150 flex items-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Inspect"
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-center text-[13px] text-[#ff453a]">{error}</p>
            )}
          </form>

          {/* Feature row */}
          <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
            {[
              { icon: "✦", text: "Photo defect scan" },
              { icon: "◈", text: "3D reference model" },
              { icon: "◎", text: "Buy/skip advice" },
              { icon: "◇", text: "Color preview" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-1.5">
                <span className="text-white/20 text-[11px]">{f.icon}</span>
                <span className="text-[12px] text-white/30 font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-center text-[11px] text-white/18 leading-relaxed">
            Best-effort AI analysis — not a substitute for in-person inspection.
            No Carfax scraping. 3D model is generic, not a reconstruction.
          </p>

          {/* Recent inspections */}
          {history.length > 0 && (
            <div className="mt-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-3 text-center">
                Recent
              </p>
              <div className="space-y-1.5">
                {history.slice(0, 4).map((h) => (
                  <button
                    key={h.listing.id}
                    onClick={() => router.push(`/inspect/${h.listing.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-[#0f0f0f] hover:bg-[#161616] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-150 group text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-white/80 truncate">{h.listing.title}</div>
                      <div className="text-[12px] text-white/25 mt-0.5">
                        {h.listing.price ? `$${h.listing.price.toLocaleString()} · ` : ""}
                        {h.listing.mileage ? `${h.listing.mileage.toLocaleString()} mi · ` : ""}
                        {new Date(h.listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition-colors shrink-0 ml-3" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
