import type { RawEvent, SanitizedEvent } from "../types";

const DOMAIN_CFG = {
  ALPHA:   { color: "#4ea6dc", label: "Alpha"   },
  BRAVO:   { color: "#48c78e", label: "Bravo"   },
  CHARLIE: { color: "#c9a227", label: "Charlie" },
} as const;

const BYTES_RAW   = 200;
const BYTES_SAN   = 136;
const BYTES_STRIP =  64;
const WINDOW_MS   = 30_000;

function fmtBW(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} MB/s`;
  if (bps >= 1_000)     return `${(bps / 1_000).toFixed(1)} KB/s`;
  if (bps >= 1)         return `${bps.toFixed(0)} B/s`;
  return "0 B/s";
}

function fmtTotal(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

interface Props {
  rawEvents: RawEvent[];
  sanitizedEvents: SanitizedEvent[];
  strippedFieldCount: number;
  isRunning: boolean;
}

export function HealthMonitor({ rawEvents, sanitizedEvents, strippedFieldCount, isRunning }: Props) {
  const now = Date.now();
  const recent = rawEvents.filter((e) => now - e.timestamp < WINDOW_MS);

  const domainStats = (["ALPHA", "BRAVO", "CHARLIE"] as const).map((id) => {
    const cfg = DOMAIN_CFG[id];
    const domRecent = recent.filter((e) => e.domainId === id);
    const bpsIn   = (domRecent.length * BYTES_RAW) / 30;
    const evtRate = domRecent.length / 30;
    const lastEvt = rawEvents.find((e) => e.domainId === id);
    const alive   = isRunning || (lastEvt ? now - lastEvt.timestamp < 90_000 : false);
    const latency = alive ? Math.round(8 + domRecent.length * 1.5) : 0;
    return { id, cfg, bpsIn, evtRate, alive, latency };
  });

  const maxBps       = Math.max(...domainStats.map((d) => d.bpsIn), 1);
  const guardInBps   = (recent.length * BYTES_RAW)  / 30;
  const guardOutBps  = (recent.length * BYTES_SAN)  / 30;
  const strippedBps  = (recent.length * BYTES_STRIP) / 30;
  const totalIn      = rawEvents.length * BYTES_RAW;
  const totalStrip   = strippedFieldCount * BYTES_STRIP;
  const totalOut     = sanitizedEvents.length * BYTES_SAN;
  const evtRateAll   = recent.length / 30;
  const cpuPct       = Math.min(93, Math.round(12 + evtRateAll * 14));
  const memGb        = (3.1 + evtRateAll * 0.35).toFixed(1);
  const guardLatMs   = isRunning ? (1.8 + recent.length * 0.15).toFixed(1) : "—";
  const hsEvts       = sanitizedEvents.length;

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #2a2d32", background: "#14161a" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#2a2d32]"
        style={{ background: "#16191e" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold font-mono uppercase tracking-wider text-[#888c94]">
            Bandwidth &amp; System Health
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-xs font-mono text-[#48c78e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48c78e] animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#555a62]">
          <span>In: <span className="text-[#8a9aaa]">{fmtTotal(totalIn)}</span></span>
          <span>Stripped: <span className="text-[#e55555]">{fmtTotal(totalStrip)}</span></span>
          <span>Out: <span className="text-[#48c78e]">{fmtTotal(totalOut)}</span></span>
          <span className="text-[#2a2d32]">|</span>
          <span>CPU <span style={{ color: cpuPct > 70 ? "#f58220" : "#8a9aaa" }}>{cpuPct}%</span></span>
          <span>MEM <span className="text-[#8a9aaa]">{memGb} GB</span></span>
        </div>
      </div>

      {/* ── 5-column grid ── */}
      <div className="grid grid-cols-5 divide-x divide-[#2a2d32]">

        {/* Domain cards */}
        {domainStats.map(({ id, cfg, bpsIn, evtRate, alive, latency }) => (
          <div key={id} className="px-4 py-3 flex flex-col gap-2">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${alive ? "animate-pulse" : ""}`}
                  style={{ background: alive ? cfg.color : "#3a3e44" }}
                />
                <span className="text-xs font-mono font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              <span
                className="text-xs font-mono px-1.5 rounded-sm"
                style={{ background: alive ? `${cfg.color}18` : "#222528", color: alive ? cfg.color : "#555a62" }}
              >
                {alive ? "ONLINE" : "IDLE"}
              </span>
            </div>

            {/* BW gauge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-[#555a62]">BW IN</span>
                <span className="text-xs font-mono font-semibold" style={{ color: cfg.color }}>{fmtBW(bpsIn)}</span>
              </div>
              <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "#1e2124" }}>
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{ width: `${Math.min(100, (bpsIn / maxBps) * 100)}%`, background: cfg.color, opacity: 0.8 }}
                />
              </div>
            </div>

            {/* Rate + latency */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#555a62]">
                {evtRate.toFixed(2)} <span className="text-[#3a3e44]">evt/s</span>
              </span>
              <span className="text-xs font-mono text-[#444850]">
                {alive ? `${latency}ms` : "—"}
              </span>
            </div>
          </div>
        ))}

        {/* Guard card */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#a855f7" }} />
              <span className="text-xs font-mono font-semibold" style={{ color: "#a855f7" }}>Guard</span>
            </div>
            <span className="text-xs font-mono px-1.5 rounded-sm" style={{ background: "#a855f715", color: "#a855f7" }}>
              ACTIVE
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#555a62]">IN</span>
              <span className="text-xs font-mono" style={{ color: "#a855f7" }}>{fmtBW(guardInBps)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#555a62]">OUT</span>
              <span className="text-xs font-mono text-[#48c78e]">{fmtBW(guardOutBps)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#555a62]">STRIP</span>
              <span className="text-xs font-mono text-[#e55555]">{fmtBW(strippedBps)}</span>
            </div>
          </div>
          <div className="text-xs font-mono text-[#444850]">
            Latency: <span className="text-[#8a9aaa]">{guardLatMs}{isRunning ? "ms" : ""}</span>
          </div>
        </div>

        {/* High-side card */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#f58220" }} />
              <span className="text-xs font-mono font-semibold" style={{ color: "#f58220" }}>High Side</span>
            </div>
            <span className="text-xs font-mono px-1.5 rounded-sm" style={{ background: "#f5822015", color: "#f58220" }}>
              ACTIVE
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-[#555a62]">BW IN</span>
              <span className="text-xs font-mono font-semibold" style={{ color: "#f58220" }}>{fmtBW(guardOutBps)}</span>
            </div>
            <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "#1e2124" }}>
              <div
                className="h-full rounded-sm transition-all duration-500"
                style={{
                  width: `${Math.min(100, guardInBps > 0 ? (guardOutBps / guardInBps) * 100 : 0)}%`,
                  background: "#f58220",
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#555a62]">
              {hsEvts} <span className="text-[#3a3e44]">evts</span>
            </span>
            <span className="text-xs font-mono text-[#48c78e]">CORREL.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
