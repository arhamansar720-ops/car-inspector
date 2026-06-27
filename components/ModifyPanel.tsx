"use client";

const PAINTS = [
  { label: "Pearl White",    hex: "#F4F4F0" },
  { label: "Midnight Black", hex: "#101010" },
  { label: "Silver",         hex: "#A8A8A8" },
  { label: "Slate Gray",     hex: "#666666" },
  { label: "Candy Red",      hex: "#C01818" },
  { label: "Navy Blue",      hex: "#0A1E40" },
  { label: "Cobalt Blue",    hex: "#1A4A9A" },
  { label: "Forest Green",   hex: "#1A3E1A" },
  { label: "Burnt Orange",   hex: "#C84800" },
  { label: "Solar Yellow",   hex: "#D4A400" },
  { label: "Champagne",      hex: "#C8A840" },
  { label: "Midnight Purple",hex: "#3E1070" },
];

const WHEELS = [
  { id: "stock",       label: "Stock",     color: "#888" },
  { id: "chrome",      label: "Chrome",    color: "#d0d0d0" },
  { id: "matte-black", label: "Matte Blk", color: "#222" },
  { id: "gunmetal",    label: "Gunmetal",  color: "#4a4a50" },
  { id: "bronze",      label: "Bronze",    color: "#8b6210" },
  { id: "gold",        label: "Gold",      color: "#c8a200" },
];

interface Props {
  currentColor: string;
  currentWheel: string;
  onColorChange: (hex: string) => void;
  onWheelChange: (id: string) => void;
}

export default function ModifyPanel({ currentColor, currentWheel, onColorChange, onWheelChange }: Props) {
  const isDark = parseInt(currentColor.replace("#", "").padEnd(6, "0"), 16) < 0x888888;

  return (
    <div className="rounded-[16px] bg-[#0f0f0f] border border-white/[0.07] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white/85">Customize Preview</h3>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 bg-white/[0.05] px-2 py-1 rounded-md">
          Preview only
        </span>
      </div>
      <p className="text-[12px] text-white/25 mb-5 leading-relaxed">
        Cosmetic only — does not reflect the actual vehicle&apos;s options.
      </p>

      {/* Paint swatches */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22 mb-3">Paint Color</p>
        <div className="grid grid-cols-6 gap-2">
          {PAINTS.map((p) => {
            const active = currentColor === p.hex;
            return (
              <button
                key={p.hex}
                onClick={() => onColorChange(p.hex)}
                title={p.label}
                className={`aspect-square rounded-[8px] border transition-all duration-150 hover:scale-105 focus:outline-none ${
                  active
                    ? "scale-110 ring-2 ring-[#0a84ff] ring-offset-[3px] ring-offset-[#0f0f0f] border-transparent"
                    : "border-white/[0.08]"
                }`}
                style={{ backgroundColor: p.hex }}
              >
                {active && (
                  <svg className="w-full h-full p-1.5" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke={isDark ? "#fff" : "#000"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-white/22 mt-2">
          {PAINTS.find((p) => p.hex === currentColor)?.label ?? "Custom"}
        </p>
      </div>

      {/* Custom hex */}
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22 mb-2.5">Custom Hex</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[7px] border border-white/[0.1] shrink-0" style={{ backgroundColor: currentColor }} />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onColorChange(e.target.value); }}
            className="flex-1 h-8 bg-[#161616] border border-white/[0.08] focus:border-white/[0.18] rounded-[8px] px-3 text-[12px] font-mono text-white/65 focus:outline-none transition-colors"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Wheel finish */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22 mb-2.5">Wheel Finish</p>
        <div className="grid grid-cols-3 gap-1.5">
          {WHEELS.map((w) => {
            const active = currentWheel === w.id;
            return (
              <button
                key={w.id}
                onClick={() => onWheelChange(w.id)}
                className={`flex flex-col items-center gap-2 py-3 rounded-[10px] border transition-all duration-150 ${
                  active
                    ? "border-[#0a84ff]/25 bg-[#0a84ff]/[0.06]"
                    : "border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.1]"
                }`}
              >
                <div className="w-7 h-7 rounded-full border border-white/[0.1]" style={{ backgroundColor: w.color }} />
                <span className="text-[11px] text-white/40">{w.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
