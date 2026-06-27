"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InspectError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("Inspect page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-[#0a0a0a]">
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.875.875 0 100-1.75.875.875 0 000 1.75z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-zinc-400 text-sm mb-1">{error.message || "The inspection page failed to load."}</p>
        <p className="text-zinc-600 text-xs">Check that your ANTHROPIC_API_KEY is set in Vercel environment variables.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white transition-colors">
          Try again
        </button>
        <button onClick={() => router.push("/")} className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 transition-colors">
          ← Back to search
        </button>
      </div>
    </div>
  );
}
