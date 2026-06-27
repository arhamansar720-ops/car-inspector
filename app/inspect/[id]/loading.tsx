export default function InspectLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        <p className="text-sm text-zinc-400">Loading inspection…</p>
      </div>
    </div>
  );
}
