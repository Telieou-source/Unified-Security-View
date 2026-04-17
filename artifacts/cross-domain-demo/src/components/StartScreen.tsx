import { DOMAINS } from "../data/config";

interface Props {
  onStart: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}

export function StartScreen({ onStart, speed, onSpeedChange }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: "480px" }}
    >
      {/* Architecture diagram — static preview */}
      <div className="flex flex-col items-center gap-0 w-full max-w-2xl mb-8">
        {/* Three domain boxes */}
        <div className="grid grid-cols-3 gap-3 w-full mb-0">
          {DOMAINS.map((d) => (
            <div
              key={d.id}
              className="rounded-sm px-3 py-2.5 text-center"
              style={{
                background: "#1a1c22",
                border: `1px solid ${d.color}35`,
              }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: d.color }}>
                {d.name}
              </div>
              <div className="text-xs font-mono text-[#555a62]">{d.subnet}</div>
              <div className="text-xs text-[#444850] mt-1">SIEM log stream</div>
            </div>
          ))}
        </div>

        {/* Arrows down */}
        <div className="grid grid-cols-3 gap-3 w-full my-0">
          {DOMAINS.map((d) => (
            <div key={d.id} className="flex justify-center py-1">
              <div className="flex flex-col items-center gap-0">
                <div className="w-px h-4" style={{ background: `${d.color}60` }} />
                <div className="text-xs" style={{ color: `${d.color}60` }}>▼</div>
              </div>
            </div>
          ))}
        </div>

        {/* Boundary */}
        <div
          className="w-full flex items-center justify-center rounded-sm px-4 py-2"
          style={{ background: "#1e1a26", border: "1px dashed #4a3a70" }}
        >
          <span className="text-xs font-semibold tracking-widest text-[#a78bfa]">
            CROSS-DOMAIN GUARD — rawPacketBytes stripped, all log metadata passes
          </span>
        </div>

        {/* Arrow down to high side */}
        <div className="flex justify-center py-1 w-full">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-[#555a62]" />
            <div className="text-xs text-[#555a62]">▼</div>
          </div>
        </div>

        {/* High side box */}
        <div
          className="w-full rounded-sm px-4 py-2.5 text-center"
          style={{ background: "#1c1f24", border: "1px solid #f5822040" }}
        >
          <div className="text-xs font-semibold text-[#f58220] tracking-wide mb-0.5">
            HIGH SIDE — Unified Correlation View
          </div>
          <div className="text-xs text-[#555a62] font-mono">
            Cross-domain notables · pattern matching · rule-based correlation
          </div>
        </div>
      </div>

      {/* Start CTA */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#555a62]">Event rate:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="rounded-sm px-2 py-1 text-xs font-mono text-[#c8d0d8] cursor-pointer"
            style={{ background: "#252830", border: "1px solid #3a3d45" }}
          >
            <option value={3000}>1 event / 3s — slow</option>
            <option value={1500}>1 event / 1.5s — normal</option>
            <option value={700}>1 event / 0.7s — fast</option>
            <option value={300}>1 event / 0.3s — rapid</option>
          </select>
        </div>

        <button
          onClick={onStart}
          className="flex items-center gap-3 px-8 py-3 rounded-sm font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: "#f58220",
            color: "#111315",
            boxShadow: "0 0 24px rgba(245,130,32,0.35)",
          }}
        >
          <span className="text-lg leading-none">▶</span>
          Start Simulation
        </button>

        <p className="text-xs text-[#444850] font-mono text-center max-w-sm">
          Simulates three SIEM log streams, cross-domain guard sanitization,
          and high-side correlation in real time.
        </p>
      </div>
    </div>
  );
}
