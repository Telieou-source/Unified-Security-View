import { useEffect, useRef } from "react";
import type { DomainConfig, RawEvent } from "../types";
import { CLASSIFICATION_COLORS, SEVERITY_COLORS } from "../data/config";

interface Props {
  domain: DomainConfig;
  events: RawEvent[];
  isRunning: boolean;
}

function EventTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    AUTH_ATTEMPT: "⬡",
    FILE_ACCESS: "▦",
    NETWORK_CONN: "◎",
    ANOMALY_DETECTED: "△",
    POLICY_VIOLATION: "▣",
    PROCESS_SPAWN: "◈",
    EXFIL_ATTEMPT: "◉",
    PRIVILEGE_ESC: "▲",
  };
  return <span className="font-mono text-xs opacity-70">{icons[type] ?? "◇"}</span>;
}

export function DomainPanel({ domain, events, isRunning }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div
      className={`flex flex-col rounded-lg border ${domain.borderClass} ${domain.bgClass} overflow-hidden`}
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${domain.borderClass}`}>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: domain.color,
              boxShadow: isRunning ? `0 0 6px ${domain.color}` : "none",
              animation: isRunning ? "pulse-dot 1.8s ease-in-out infinite" : "none",
            }}
          />
          <span className={`text-xs font-semibold tracking-widest ${domain.textClass}`}>
            {domain.name.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">{events.length} events</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-mono ${domain.badgeClass}`}
          >
            {isRunning ? "LIVE" : "PAUSED"}
          </span>
        </div>
      </div>

      {/* Event Stream */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0"
        style={{ maxHeight: "240px" }}
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
            Awaiting events...
          </div>
        ) : (
          events.slice(0, 30).map((evt, i) => (
            <div
              key={evt.id}
              className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs border border-transparent hover:border-white/5 hover:bg-white/3 transition-colors ${i === 0 ? "event-enter" : ""}`}
            >
              <EventTypeIcon type={evt.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-slate-300">{evt.type}</span>
                  <span className={`px-1 py-0 rounded text-xs font-mono border ${SEVERITY_COLORS[evt.severity]}`}>
                    {evt.severity}
                  </span>
                  <span className={`text-xs font-mono ${CLASSIFICATION_COLORS[evt.classification]}`}>
                    {evt.classification}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-slate-500 font-mono">
                  <span className="truncate max-w-[90px]" title={evt.sourceIp}>{evt.sourceIp}</span>
                  <span className="truncate max-w-[80px]" title={evt.userId}>{evt.userId}</span>
                  <span className="ml-auto text-slate-600">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
