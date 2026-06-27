"use client";

interface WheelStyle {
  id: string;
  label: string;
  color: string;
}

const WHEEL_STYLES: WheelStyle[] = [
  { id: "stock", label: "Stock", color: "#888888" },
  { id: "chrome", label: "Chrome", color: "#d4d4d4" },
  { id: "matte-black", label: "Matte Black", color: "#222222" },
  { id: "gunmetal", label: "Gunmetal", color: "#4a4a4a" },
  { id: "bronze", label: "Bronze", color: "#8b6914" },
  { id: "gold", label: "Gold", color: "#c8a800" },
];

const PAINT_COLORS = [
  { label: "Pearl White", hex: "#F4F4F0" },
  { label: "Midnight Black", hex: "#101010" },
  { label: "Silver", hex: "#A8A8A8" },
  { label: "Slate Gray", hex: "#707070" },
  { label: "Candy Red", hex: "#C02020" },
  { label: "Navy Blue", hex: "#0A2040" },
  { label: "Cobalt Blue", hex: "#1A4A8A" },
  { label: "Forest Green", hex: "#1E4020" },
  { label: "Burnt Orange", hex: "#C84A0A" },
  { label: "Solar Yellow", hex: "#D4A800" },
  { label: "Champagne", hex: "#C8A840" },
  { label: "Dark Brown", hex: "#5C3A20" },
  { label: "Midnight Purple", hex: "#4A1A7A" },
  { label: "Teal", hex: "#1A7A6A" },
  { label: "Rose Gold", hex: "#C87860" },
  { label: "Matte Gray", hex: "#555555" },
];

interface ModifyPanelProps {
  currentColor: string;
  currentWheel: string;
  onColorChange: (hex: string) => void;
  onWheelChange: (id: string) => void;
}

export default function ModifyPanel({ currentColor, currentWheel, onColorChange, onWheelChange }: ModifyPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Customize Preview</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
          Preview only
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
        Cosmetic preview — does not reflect the actual vehicle's options or available configurations.
      </p>

      {/* Paint color */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Paint Color</div>
        <div className="grid grid-cols-8 gap-2">
          {PAINT_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => onColorChange(c.hex)}
              title={c.label}
              className={`relative w-full aspect-square rounded-lg transition-transform hover:scale-110 focus:outline-none ${
                currentColor === c.hex ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900 scale-110" : ""
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {currentColor === c.hex && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={parseInt(c.hex.slice(1), 16) > 0x888888 ? "#000" : "#fff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          Selected: {PAINT_COLORS.find((c) => c.hex === currentColor)?.label ?? "Custom"}
        </div>
      </div>

      {/* Custom hex */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Custom Hex</div>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded-lg border border-zinc-700 shrink-0" style={{ backgroundColor: currentColor }} />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onColorChange(val);
            }}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </div>

      {/* Wheel style */}
      <div>
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Wheel Finish</div>
        <div className="grid grid-cols-3 gap-2">
          {WHEEL_STYLES.map((w) => (
            <button
              key={w.id}
              onClick={() => onWheelChange(w.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-colors ${
                currentWheel === w.id
                  ? "border-blue-500/60 bg-blue-500/10"
                  : "border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border border-zinc-600"
                style={{ backgroundColor: w.color }}
              />
              <span className="text-[11px] text-zinc-400">{w.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
