import type { RawEvent, SanitizedEvent, CorrelatedAlert } from "../types";
import { DOMAINS } from "../data/config";

interface Props {
  rawEvents: RawEvent[];
  sanitizedEvents: SanitizedEvent[];
  alerts: CorrelatedAlert[];
  isRunning: boolean;
  speed: number;
  onToggle: () => void;
  onSpeedChange: (s: number) => void;
  onReset: () => void;
}

export function StatsBar({
  rawEvents, sanitizedEvents, alerts,
  isRunning, speed, onToggle, onSpeedChange, onReset,
}: Props) {
  const critCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2 rounded-sm border border-[#2d3035]"
      style={{ background: "#1c1f24" }}
    >
      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-[#555a62]">Events:</span>
          <span className="text-[#c8d0d8] font-semibold">{rawEvents.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#555a62]">Passed guard:</span>
          <span className="text-[#48c78e] font-semibold">{sanitizedEvents.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#555a62]">Notables:</span>
          <span className="text-[#a78bfa] font-semibold">{alerts.length}</span>
        </div>
        {critCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
            style={{ background: "#2d0e0e", border: "1px solid #6a2020" }}
          >
            <span className="text-[#e55555] font-bold animate-pulse">!</span>
            <span className="text-[#e55555] font-semibold">{critCount} CRITICAL</span>
          </div>
        )}
        {highCount > 0 && !critCount && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
            style={{ background: "#2d1a08", border: "1px solid #6a3a10" }}
          >
            <span className="text-[#f58220] font-semibold">{highCount} HIGH</span>
          </div>
        )}

        {/* Domain breakdowns */}
        <div className="flex items-center gap-3 border-l border-[#2d3035] pl-4">
          {DOMAINS.map((d) => {
            const count = rawEvents.filter((e) => e.domainId === d.id).length;
            return (
              <div key={d.id} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[#666b74]">{d.label}:</span>
                <span className={d.textClass}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#555a62]">Ingest rate:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="rounded-sm px-1.5 py-0.5 text-xs text-[#c8d0d8] cursor-pointer"
            style={{ background: "#252830", border: "1px solid #3a3d45" }}
          >
            <option value={3000}>1 event / 3s</option>
            <option value={1500}>1 event / 1.5s</option>
            <option value={700}>1 event / 0.7s</option>
            <option value={300}>1 event / 0.3s</option>
          </select>
        </div>

        <button
          onClick={onToggle}
          className="px-3 py-1 rounded-sm text-xs font-semibold transition-all"
          style={
            isRunning
              ? { background: "#2d2510", color: "#e5c97a", border: "1px solid #5a4a20" }
              : { background: "#1a2e18", color: "#48c78e", border: "1px solid #264a24" }
          }
        >
          {isRunning ? "■ Pause" : "▶ Start Simulation"}
        </button>

        <button
          onClick={onReset}
          className="px-3 py-1 rounded-sm text-xs font-mono transition-all"
          style={{ background: "#222528", color: "#666b74", border: "1px solid #2d3035" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
