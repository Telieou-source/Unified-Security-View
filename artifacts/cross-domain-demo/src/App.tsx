import { useState, useEffect, useCallback, useRef } from "react";
import type { RawEvent, SanitizedEvent, CorrelatedAlert, DomainId } from "./types";
import { DOMAINS } from "./data/config";
import { generateEvent, sanitizeEvent, tryCorrelate } from "./lib/simulation";
import { DomainPanel } from "./components/DomainPanel";
import { BoundaryLayer } from "./components/BoundaryLayer";
import { CorrelatedView } from "./components/CorrelatedView";
import { StatsBar } from "./components/StatsBar";

const MAX_RAW = 60;
const MAX_SANITIZED = 120;
const MAX_ALERTS = 50;

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [sanitizedEvents, setSanitizedEvents] = useState<SanitizedEvent[]>([]);
  const [alerts, setAlerts] = useState<CorrelatedAlert[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);

  const sanitizedRef = useRef<SanitizedEvent[]>([]);
  sanitizedRef.current = sanitizedEvents;

  const fireEvent = useCallback(() => {
    const domainId: DomainId = DOMAINS[Math.floor(Math.random() * DOMAINS.length)].id;
    const raw = generateEvent(domainId);

    setRawEvents((prev) => [raw, ...prev].slice(0, MAX_RAW));

    const sanitized = sanitizeEvent(raw);
    const newSanitized = [sanitized, ...sanitizedRef.current].slice(0, MAX_SANITIZED);
    setSanitizedEvents(newSanitized);

    const blockedFieldCount = sanitized.strippedFields.length;
    setBlockedCount((c) => c + blockedFieldCount);

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
    setBlockedCount(0);
  }, []);

  const rawByDomain = (id: DomainId) => rawEvents.filter((e) => e.domainId === id);
  const recentSanitized = sanitizedEvents.slice(0, 6);
  const sanitizedPassCount = sanitizedEvents.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-400" style={{ boxShadow: "0 0 10px rgba(255,255,255,0.3)" }} />
          <div>
            <h1 className="text-sm font-semibold tracking-widest text-slate-200 uppercase">
              Cross-Domain Security Metadata Aggregation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated multi-domain event correlation with sanitized boundary crossing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-600">Classification:</span>
          <span className="text-red-400 font-semibold tracking-wider">TOP SECRET // HIGH SIDE</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">

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

          {/* Architecture Legend */}
          <div className="flex items-center gap-6 px-1 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-sky-500/50 rounded" />
              <span>Domain Alpha — Cyber Ops Network</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500/50 rounded" />
              <span>Domain Bravo — Enterprise IT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-amber-500/50 rounded" />
              <span>Domain Charlie — Industrial Control Systems</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-4 h-1 border-t border-dashed border-violet-500/50" />
              <span className="text-violet-400">Sanitization boundary</span>
            </div>
          </div>

          {/* Three Domain Panels */}
          <div className="grid grid-cols-3 gap-3">
            {DOMAINS.map((domain) => (
              <DomainPanel
                key={domain.id}
                domain={domain}
                events={rawByDomain(domain.id)}
                isRunning={isRunning}
              />
            ))}
          </div>

          {/* Boundary Layer */}
          <BoundaryLayer
            sanitizedCount={sanitizedPassCount}
            blockedCount={blockedCount}
            recentSanitized={recentSanitized}
            isRunning={isRunning}
          />

          {/* Correlated View */}
          <CorrelatedView
            alerts={alerts}
            totalEvents={rawEvents.length}
            uniqueThreats={alerts.length}
          />

          {/* Footer note */}
          <div className="text-center text-xs text-slate-600 font-mono pb-2">
            All data is simulated. No real network traffic, credentials, or classified material is used.
          </div>
        </div>
      </div>
    </div>
  );
}
