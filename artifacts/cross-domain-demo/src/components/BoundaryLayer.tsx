import { useState } from "react";
import { BOUNDARY_RULES } from "../data/config";
import type { SanitizedEvent } from "../types";

interface Props {
  sanitizedCount: number;
  blockedCount: number;
  recentSanitized: SanitizedEvent[];
  isRunning: boolean;
}

export function BoundaryLayer({ sanitizedCount, blockedCount, recentSanitized, isRunning }: Props) {
  const [showRules, setShowRules] = useState(false);

  const passRate = sanitizedCount + blockedCount > 0
    ? Math.round((sanitizedCount / (sanitizedCount + blockedCount)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header Bar */}
      <div className="relative flex items-center gap-0">
        <div className="flex-1 border-t border-dashed border-slate-700" />
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 mx-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-violet-400"
              style={{
                animation: isRunning ? "pulse-dot 1.2s ease-in-out infinite" : "none",
                boxShadow: isRunning ? "0 0 8px #a78bfa" : "none",
              }}
            />
            <span className="text-xs font-semibold tracking-widest text-violet-300">
              SANITIZATION BOUNDARY
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-green-400">{sanitizedCount} passed</span>
            <span className="text-red-400">{blockedCount} stripped</span>
            <span className="text-slate-400">{passRate}% pass-rate</span>
          </div>
          <button
            onClick={() => setShowRules(!showRules)}
            className="text-xs px-2 py-0.5 rounded border border-violet-700/50 text-violet-400 hover:bg-violet-900/30 transition-colors"
          >
            {showRules ? "Hide Rules" : "View Rules"}
          </button>
        </div>
        <div className="flex-1 border-t border-dashed border-slate-700" />
      </div>

      {/* Rules panel */}
      {showRules && (
        <div className="rounded-lg border border-violet-800/40 bg-violet-950/20 p-3">
          <div className="text-xs font-semibold text-violet-300 mb-2 tracking-wider">BOUNDARY POLICY RULES</div>
          <div className="space-y-1">
            {BOUNDARY_RULES.map((rule) => (
              <div key={rule.field} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-32 text-slate-400">{rule.field}</span>
                <span
                  className={`px-1.5 py-0 rounded border text-xs ${
                    rule.action === "STRIP"
                      ? "text-red-400 bg-red-900/20 border-red-700/30"
                      : rule.action === "HASH"
                      ? "text-yellow-400 bg-yellow-900/20 border-yellow-700/30"
                      : "text-green-400 bg-green-900/20 border-green-700/30"
                  }`}
                >
                  {rule.action}
                </span>
                <span className="text-slate-500 truncate">{rule.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sanitized events */}
      {recentSanitized.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {recentSanitized.slice(0, 6).map((evt, i) => (
            <div
              key={evt.id}
              className={`px-2 py-1.5 rounded border border-violet-800/30 bg-violet-950/20 text-xs font-mono ${i === 0 ? "event-enter" : ""}`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-violet-300 truncate">{evt.type}</span>
                <span className="text-slate-500 text-xs">{evt.domainId}</span>
              </div>
              <div className="text-slate-600 truncate" title={evt.userIdHash}>
                usr: {evt.userIdHash.substring(8, 20)}…
              </div>
              <div className="flex gap-2 mt-0.5 flex-wrap">
                {evt.strippedFields.map((f) => (
                  <span key={f} className="text-red-500/60 text-xs">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
