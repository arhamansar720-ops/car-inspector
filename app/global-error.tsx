"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
          <p className="text-zinc-400 text-sm">{error.message}</p>
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
