import { useState, useEffect, useCallback, useRef } from "react";
import type { RawEvent, SanitizedEvent, CorrelatedAlert, DomainId } from "./types";
import { DOMAINS } from "./data/config";
import { generateEvent, sanitizeEvent, tryCorrelate } from "./lib/simulation";
import { DomainPanel } from "./components/DomainPanel";
import { BoundaryLayer } from "./components/BoundaryLayer";
import { CorrelatedView } from "./components/CorrelatedView";
import { StatsBar } from "./components/StatsBar";

const MAX_RAW = 80;
const MAX_SANITIZED = 160;
const MAX_ALERTS = 60;

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [sanitizedEvents, setSanitizedEvents] = useState<SanitizedEvent[]>([]);
  const [alerts, setAlerts] = useState<CorrelatedAlert[]>([]);
  const [strippedFieldCount, setStrippedFieldCount] = useState(0);

  const sanitizedRef = useRef<SanitizedEvent[]>([]);
  sanitizedRef.current = sanitizedEvents;

  const fireEvent = useCallback(() => {
    const domainId: DomainId = DOMAINS[Math.floor(Math.random() * DOMAINS.length)].id;
    const raw = generateEvent(domainId);

    setRawEvents((prev) => [raw, ...prev].slice(0, MAX_RAW));

    const sanitized = sanitizeEvent(raw);
    const newSanitized = [sanitized, ...sanitizedRef.current].slice(0, MAX_SANITIZED);
    setSanitizedEvents(newSanitized);
    setStrippedFieldCount((c) => c + sanitized.strippedFields.length);

    const alert = tryCorrelate(newSanitized, sanitized);
    if (alert) {
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(fireEvent, speed);
    return () => clearInterval(interval);
  }, [isRunning, speed, fireEvent]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setRawEvents([]);
    setSanitizedEvents([]);
    setAlerts([]);
    setStrippedFieldCount(0);
  }, []);

  const rawByDomain = (id: DomainId) => rawEvents.filter((e) => e.domainId === id);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#111315", color: "#c8d0d8" }}>

      {/* Splunk-style top nav bar */}
      <div
        className="flex items-center justify-between px-5 py-0 border-b border-[#2d3035] flex-shrink-0"
        style={{ background: "#1a1c1f", height: "40px" }}
      >
        {/* Splunk-ish logo mark + app name */}
        <div className="flex items-center gap-0 h-full">
          <div
            className="flex items-center gap-2 px-4 h-full border-r border-[#2d3035]"
          >
            <span className="font-bold text-sm" style={{ color: "#f58220" }}>▶</span>
            <span className="font-semibold text-sm text-[#c8d0d8] tracking-wide">Splunk SIEM</span>
          </div>
          <div className="flex items-center gap-0 h-full text-xs font-mono text-[#555a62]">
            <span className="px-4 h-full flex items-center border-r border-[#2d3035] hover:text-[#c8d0d8] cursor-default">Search</span>
            <span className="px-4 h-full flex items-center border-r border-[#2d3035] hover:text-[#c8d0d8] cursor-default">Dashboards</span>
            <span
              className="px-4 h-full flex items-center border-r border-[#2d3035] cursor-default"
              style={{ background: "#1e2226", color: "#f58220", borderBottom: "2px solid #f58220" }}
            >
              Cross-Domain Notable Events
            </span>
            <span className="px-4 h-full flex items-center hover:text-[#c8d0d8] cursor-default">Reports</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#555a62]">
          <span>index=cross_domain_siem</span>
          <span className="text-[#e55555] font-semibold">TOP SECRET // HIGH SIDE</span>
        </div>
      </div>

      {/* Splunk search bar (decorative) */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-[#2d3035] flex-shrink-0"
        style={{ background: "#17191d" }}
      >
        <span className="text-xs text-[#555a62] font-mono">|</span>
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-mono text-[#7a8490]"
          style={{ background: "#1e2124", border: "1px solid #3a3d45" }}
        >
          <span style={{ color: "#f58220" }}>index</span>
          <span className="text-[#555a62">=</span>
          <span className="text-[#48c78e]">cross_domain_siem</span>
          <span className="text-[#555a62] mx-1">|</span>
          <span style={{ color: "#f58220" }}>eval</span>
          <span className="text-[#c8d0d8]"> domain IN (ALPHA, BRAVO, CHARLIE)</span>
          <span className="text-[#555a62] mx-1">|</span>
          <span style={{ color: "#f58220" }}>stats</span>
          <span className="text-[#c8d0d8]"> count by domain eventtype severity</span>
          <span className="text-[#555a62] mx-1">|</span>
          <span style={{ color: "#f58220" }}>correlate</span>
          <span className="text-[#c8d0d8]"> window=10s threshold=2</span>
        </div>
        <button
          className="px-4 py-1 rounded-sm text-xs font-semibold"
          style={{ background: "#f58220", color: "#111315" }}
        >
          Search
        </button>
        <span className="text-xs text-[#555a62] font-mono">Last 60 min</span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col gap-3">

          {/* Controls */}
          <StatsBar
            rawEvents={rawEvents}
            sanitizedEvents={sanitizedEvents}
            alerts={alerts}
            isRunning={isRunning}
            speed={speed}
            onToggle={() => setIsRunning((r) => !r)}
            onSpeedChange={setSpeed}
            onReset={handleReset}
          />

          {/* Domain panel label row */}
          <div className="flex items-center gap-1 text-xs font-mono text-[#555a62]">
            <span>sourcetype=</span>
            <span className="text-[#48c78e]">siem:events</span>
            <span className="mx-2 text-[#2d3035]">|</span>
            <span className="text-[#555a62]">Raw SIEM event streams — 3 classification domains</span>
            <span className="ml-auto flex items-center gap-4">
              {DOMAINS.map((d) => (
                <span key={d.id} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                  <span style={{ color: d.color }}>{d.name}</span>
                  <span className="text-[#444850]">({d.subnet})</span>
                </span>
              ))}
            </span>
          </div>

          {/* Three domain panels */}
          <div className="grid grid-cols-3 gap-2">
            {DOMAINS.map((domain) => (
              <DomainPanel
                key={domain.id}
                domain={domain}
                events={rawByDomain(domain.id)}
                isRunning={isRunning}
              />
            ))}
          </div>

          {/* Boundary layer */}
          <BoundaryLayer
            sanitizedCount={sanitizedEvents.length}
            strippedFieldCount={strippedFieldCount}
            recentSanitized={sanitizedEvents.slice(0, 10)}
            isRunning={isRunning}
          />

          {/* Correlated notables — high side */}
          <CorrelatedView
            alerts={alerts}
            totalEvents={rawEvents.length}
          />

          <div className="text-center text-xs text-[#333840] font-mono pb-2">
            Simulated data only — no real SIEM, network traffic, credentials, or classified material
          </div>
        </div>
      </div>
    </div>
  );
}
