import { useState } from "react";
import { BOUNDARY_RULES } from "../data/config";
import type { SanitizedEvent } from "../types";
import { SEVERITY_STYLE } from "../data/config";

interface Props {
  sanitizedCount: number;
  strippedFieldCount: number;
  recentSanitized: SanitizedEvent[];
  isRunning: boolean;
}

function fmt(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function BoundaryLayer({ sanitizedCount, strippedFieldCount, recentSanitized, isRunning }: Props) {
  const [showRules, setShowRules] = useState(false);

  const passRules = BOUNDARY_RULES.filter((r) => r.action === "PASS");
  const stripRules = BOUNDARY_RULES.filter((r) => r.action === "STRIP");

  return (
    <div>
      {/* Boundary line + label */}
      <div className="relative flex items-center gap-0 my-1">
        <div className="flex-1 border-t-2 border-dashed border-[#3a3040]" />
        <div
          className="flex items-center gap-3 px-4 py-1.5 mx-3 rounded-sm"
          style={{
            background: "#1e1a26",
            border: "1px solid #3a3040",
          }}
        >
          <div className="flex items-center gap-2">
            {isRunning && (
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
            )}
            <span className="text-xs font-semibold tracking-widest text-[#a78bfa]">
              CROSS-DOMAIN GUARD — SANITIZATION BOUNDARY
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#48c78e]">{sanitizedCount} events passed</span>
            <span className="text-[#e55555]">{strippedFieldCount} rawPacketBytes stripped</span>
          </div>
          <button
            onClick={() => setShowRules(!showRules)}
            className="text-xs px-2 py-0.5 rounded-sm font-mono transition-colors"
            style={{
              background: showRules ? "#2e2040" : "#25203a",
              color: "#a78bfa",
              border: "1px solid #4a3a70",
            }}
          >
            {showRules ? "Hide Policy" : "View Policy"}
          </button>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-[#3a3040]" />
      </div>

      {/* Policy rules table */}
      {showRules && (
        <div
          className="rounded-sm border border-[#3a3040] mb-3"
          style={{ background: "#1a1620" }}
        >
          <div
            className="px-3 py-1.5 border-b border-[#3a3040] text-xs font-semibold text-[#a78bfa] tracking-wider"
            style={{ background: "#1e1a26" }}
          >
            Guard Policy — Field-Level Rules
          </div>
          <div
            className="grid text-xs font-semibold text-[#666b74] px-3 py-1 border-b border-[#2a2535]"
            style={{ gridTemplateColumns: "140px 70px 1fr", letterSpacing: "0.04em" }}
          >
            <span>Field</span>
            <span>Action</span>
            <span>Reason</span>
          </div>
          {BOUNDARY_RULES.map((rule) => (
            <div
              key={rule.field}
              className="grid text-xs font-mono px-3 py-1.5 border-b border-[#1f1c28] last:border-b-0 hover:bg-[#201d2c]"
              style={{ gridTemplateColumns: "140px 70px 1fr" }}
            >
              <span className="text-[#c8d0d8]">{rule.field}</span>
              <span
                className="font-semibold"
                style={{
                  color: rule.action === "STRIP" ? "#e55555" : "#48c78e",
                }}
              >
                {rule.action}
              </span>
              <span className="text-[#666b74]">{rule.reason}</span>
            </div>
          ))}
          <div className="px-3 py-2 text-xs text-[#555a62] border-t border-[#2a2535]">
            <span className="text-[#48c78e] font-semibold">{passRules.length} fields pass</span>
            {" · "}
            <span className="text-[#e55555] font-semibold">{stripRules.length} field stripped</span>
            {" · "}
            Raw packet captures are the only data removed. All structured SIEM log metadata (5-tuple, identity, asset) is preserved for correlation.
          </div>
        </div>
      )}

      {/* Sanitized event pass-through log */}
      {recentSanitized.length > 0 && (
        <div
          className="rounded-sm border border-[#3a3040] mb-1"
          style={{ background: "#14161a" }}
        >
          <div
            className="px-3 py-1 border-b border-[#3a3040] text-xs font-semibold text-[#888c94] tracking-wide flex items-center justify-between"
            style={{ background: "#191c20" }}
          >
            <span>Sanitized Events — Passed to High Side</span>
            <span className="font-mono text-[#555a62]">rawPacketBytes → [STRIPPED]</span>
          </div>
          <div
            className="grid text-xs font-semibold text-[#555a62] px-2 py-1 border-b border-[#1f2226]"
            style={{ gridTemplateColumns: "70px 80px 90px 90px 50px 80px 70px 60px", letterSpacing: "0.04em", background: "#17191d" }}
          >
            <span>Time</span>
            <span>Domain</span>
            <span>Host</span>
            <span>User</span>
            <span>Proto</span>
            <span>Src IP</span>
            <span>EventType</span>
            <span>Sev</span>
          </div>
          {recentSanitized.slice(0, 8).map((evt, i) => {
            const sev = SEVERITY_STYLE[evt.severity];
            return (
              <div
                key={evt.id}
                className={`grid text-xs font-mono px-2 py-1 border-b border-[#1a1c20] last:border-b-0 hover:bg-[#1e2124] ${i === 0 ? "event-new" : ""}`}
                style={{
                  gridTemplateColumns: "70px 80px 90px 90px 50px 80px 70px 60px",
                  background: i % 2 === 0 ? "#14161a" : "#171a1e",
                }}
              >
                <span className="text-[#555a62]">{fmt(evt.timestamp)}</span>
                <span
                  className="font-semibold truncate"
                  style={{ color: evt.domainId === "ALPHA" ? "#4ea6dc" : evt.domainId === "BRAVO" ? "#48c78e" : "#c9a227" }}
                >
                  {evt.domainId}
                </span>
                <span className="text-[#8a9aaa] truncate">{evt.host}</span>
                <span className="text-[#c8d0d8] truncate">{evt.userId}</span>
                <span className="text-[#7a8490]">{evt.protocol}</span>
                <span className="text-[#8a9aaa] truncate">{evt.srcIp}</span>
                <span className="text-[#c8d0d8] truncate">{evt.type}</span>
                <span className={sev.cell}>{evt.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
