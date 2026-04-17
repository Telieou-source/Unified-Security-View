import { useEffect, useRef } from "react";
import type { DomainConfig, RawEvent } from "../types";
import { SEVERITY_STYLE } from "../data/config";

interface Props {
  domain: DomainConfig;
  events: RawEvent[];
  isRunning: boolean;
}

function fmt(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) +
    "." +
    d.getMilliseconds().toString().padStart(3, "0")
  );
}

export function DomainPanel({ domain, events, isRunning }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [events.length]);

  return (
    <div
      className={`flex flex-col border ${domain.borderClass} rounded-sm overflow-hidden`}
      style={{ background: "#14161a" }}
    >
      {/* Panel header — Splunk style */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b ${domain.borderClass}`}
        style={{ background: "#1c1f24" }}
      >
        <div className="flex items-center gap-2">
          {isRunning && (
            <span
              className="live-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: domain.color }}
            />
          )}
          <span className={`text-xs font-semibold tracking-wide ${domain.textClass}`}>
            {domain.name}
          </span>
          <span className="text-xs text-[#555a62] font-mono">{domain.subnet}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#555a62]">{events.length} events</span>
          <span
            className="px-1.5 py-0 rounded-sm text-xs font-semibold"
            style={{
              background: isRunning ? "rgba(245,130,32,0.15)" : "#222528",
              color: isRunning ? "#f58220" : "#555a62",
              border: `1px solid ${isRunning ? "#6a3a10" : "#2d3035"}`,
            }}
          >
            {isRunning ? "LIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div
        className={`grid text-xs font-semibold text-[#888c94] px-2 py-1 border-b ${domain.borderClass}`}
        style={{
          gridTemplateColumns: "90px 90px 70px 60px 1fr 56px",
          background: "#191c20",
          letterSpacing: "0.04em",
        }}
      >
        <span>Time</span>
        <span>Source</span>
        <span>Src IP</span>
        <span>Proto</span>
        <span>EventType</span>
        <span className="text-right">Severity</span>
      </div>

      {/* Event rows */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: "220px" }}
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-xs text-[#444850]">
            No events — click Start
          </div>
        ) : (
          events.slice(0, 40).map((evt, i) => {
            const sev = SEVERITY_STYLE[evt.severity];
            const isNew = i === 0;
            return (
              <div
                key={evt.id}
                className={`grid text-xs font-mono px-2 py-1 border-b border-[#1f2226] hover:bg-[#1f2428] transition-colors ${isNew ? "event-new" : ""}`}
                style={{
                  gridTemplateColumns: "90px 90px 70px 60px 1fr 56px",
                  background: isNew ? undefined : i % 2 === 0 ? domain.rowEvenClass : domain.rowOddClass,
                }}
              >
                <span className="text-[#666b74] truncate">{fmt(evt.timestamp)}</span>
                <span className={`${domain.textClass} truncate`} title={evt.host}>{evt.host}</span>
                <span className="text-[#8a9aaa] truncate" title={evt.srcIp}>{evt.srcIp}</span>
                <span className="text-[#7a8490]">{evt.protocol}</span>
                <span className="text-[#c8d0d8] truncate">{evt.type}</span>
                <span className={`text-right ${sev.cell}`}>{evt.severity}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
