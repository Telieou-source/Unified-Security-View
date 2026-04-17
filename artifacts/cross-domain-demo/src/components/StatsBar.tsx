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

export function StatsBar({ rawEvents, sanitizedEvents, alerts, isRunning, speed, onToggle, onSpeedChange, onReset }: Props) {
  const critCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-xs font-mono">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Total:</span>
          <span className="text-slate-200">{rawEvents.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Sanitized:</span>
          <span className="text-green-400">{sanitizedEvents.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Correlated:</span>
          <span className="text-violet-300">{alerts.length}</span>
        </div>
        {critCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-900/40 border border-red-700/40">
            <span className="text-red-400 animate-pulse">◉</span>
            <span className="text-red-300">{critCount} CRITICAL</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Domain event counts */}
        {DOMAINS.map((d) => {
          const count = rawEvents.filter((e) => e.domainId === d.id).length;
          return (
            <div key={d.id} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className={d.textClass}>{d.label}: {count}</span>
            </div>
          );
        })}

        {/* Speed control */}
        <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
          <span className="text-slate-500">Rate:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-300 cursor-pointer"
          >
            <option value={3000}>Slow (3s)</option>
            <option value={1500}>Normal (1.5s)</option>
            <option value={700}>Fast (0.7s)</option>
            <option value={300}>Rapid (0.3s)</option>
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`px-3 py-1 rounded border text-xs font-semibold transition-all ${
              isRunning
                ? "border-yellow-700/50 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/40"
                : "border-green-700/50 bg-green-900/20 text-green-400 hover:bg-green-900/40"
            }`}
          >
            {isRunning ? "⏸ Pause" : "▶ Start"}
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1 rounded border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-xs transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
