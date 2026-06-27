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
        setError("Enter a valid listing URL (cars.com, dealer site, etc.) or a 17-character VIN.");
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
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">Inspector</span>
          <span className="text-xs text-zinc-500 ml-1">AI Car Listing Analyzer</span>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Inspect any car listing<br />
              <span className="text-blue-400">before you drive it.</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
              Paste a listing URL or VIN. Get an AI defect report from the photos, a 3D reference model, and blunt buy advice — in seconds.
            </p>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Paste a cars.com URL, dealer listing URL, or 17-character VIN…"
                className={`w-full px-5 py-4 rounded-2xl bg-zinc-900 border text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? "border-red-500/60 focus:ring-red-500/30"
                    : inputType
                    ? "border-blue-500/60 focus:ring-blue-500/30"
                    : "border-zinc-700 focus:ring-blue-500/20 hover:border-zinc-600"
                }`}
                disabled={loading}
              />
              {inputType && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  inputType === "vin"
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-blue-500/20 text-blue-300"
                }`}>
                  {inputType === "vin" ? "VIN" : "URL"}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 6.5a.875.875 0 100-1.75.875.875 0 000 1.75z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Analyzing listing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Inspect Listing
                </>
              )}
            </button>
          </form>

          {/* What it does */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: "🔍", label: "Photo defect scan", desc: "AI reads the listing photos" },
              { icon: "🚗", label: "3D reference model", desc: "Generic shape, not the actual car" },
              { icon: "💬", label: "Q&A chat", desc: "Ask anything about the listing" },
              { icon: "🎨", label: "Color preview", desc: "Try different paint & wheels" },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center">
                <div className="text-2xl mb-1.5">{item.icon}</div>
                <div className="text-xs font-semibold text-zinc-200">{item.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Disclaimers */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-xs text-zinc-500 leading-relaxed">
              <span className="text-zinc-400 font-medium">What this is not:</span> Inspector does not scrape Carfax or AutoCheck — full history reports require a paid partner API and will be added in a future version. The 3D viewer shows a generic reference model, not a reconstruction of the actual vehicle. AI defect detection is best-effort from photos — always inspect in person.
            </p>
          </div>

          {/* Recent inspections */}
          {history.length > 0 && (
            <div className="mt-8">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Recent Inspections</div>
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <button
                    key={h.listing.id}
                    onClick={() => router.push(`/inspect/${h.listing.id}`)}
                    className="w-full text-left p-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{h.listing.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {h.listing.price ? `$${h.listing.price.toLocaleString()} · ` : ""}
                        {h.listing.mileage ? `${h.listing.mileage.toLocaleString()} mi · ` : ""}
                        {new Date(h.listing.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-800/60 text-center">
        <p className="text-xs text-zinc-600">
          Inspector · AI-powered, not a substitute for professional inspection · No Carfax scraping
        </p>
      </footer>
    </main>
  );
}
