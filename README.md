# Demo SIEM — Cross-Domain Security Metadata Simulator

An interactive browser-based simulator demonstrating how security event data flows across multiple classified network domains, passes through a sanitization boundary (cross-domain guard), and is correlated on a unified high-side analysis platform. Styled as a realistic SIEM product for briefing, training, and architecture demonstration purposes.

> All data is entirely synthetic. No real network traffic, credentials, or classified material is involved.

---

## Overview

Demo SIEM models three isolated classification domains, each generating realistic SIEM log events. Events flow through a cross-domain guard that strips raw packet bytes while passing all structured log metadata. On the high side, a correlation engine detects synchronized threat patterns across domains in real time.

---

## Features

- **Live simulation** — configurable event rate (1–10 events/second) with pause, resume, and reset
- **Three classification domains** — Alpha (10.1.0.0/16), Bravo (10.2.0.0/16), Charlie (10.3.0.0/16)
- **Cross-domain guard** — strips `rawPacketBytes` only; all SIEM metadata passes through
- **Real-time correlation engine** — detects synchronized threat patterns across domains with confidence scoring
- **Bandwidth & system health monitor** — live per-domain throughput, guard IN/OUT/STRIP rates, CPU and memory indicators
- **Six analytical dashboards** — Threat Overview, Domain Activity, Network Analysis, User Behavior, Incident Timeline, Executive Summary
- **Search** — full-text and field-filtered search across all events
- **Reports** — downloadable CSV and plain-text event reports with configurable filters
- **Investigations** — create and manage analyst investigations from notable events or from scratch
- **76 pre-loaded seed events** — realistic historical data available before the simulation starts

---

## Architecture

```
┌─────────────┐  ┌─────────────┐  ┌───────────────┐
│ Domain Alpha │  │ Domain Bravo│  │ Domain Charlie │
│ 10.1.0.0/16 │  │ 10.2.0.0/16 │  │  10.3.0.0/16  │
│ SIEM stream  │  │ SIEM stream  │  │  SIEM stream   │
└──────┬───────┘  └──────┬───────┘  └───────┬───────┘
       │                 │                   │
       └─────────────────┼───────────────────┘
                         ▼
          ┌──────────────────────────────┐
          │      CROSS-DOMAIN GUARD      │
          │  rawPacketBytes → STRIPPED   │
          │  all log metadata → PASSES   │
          └──────────────┬───────────────┘
                         ▼
          ┌──────────────────────────────┐
          │   HIGH SIDE — Unified View   │
          │ correlation · pattern match  │
          │ rule-based alert generation  │
          └──────────────────────────────┘
```

---

## Event Types

| Type | Severity |
|---|---|
| ExfilAttempt | FATAL |
| PrivilegeEsc | FATAL |
| AnomalyDetected | ERROR |
| PolicyViolation | ERROR |
| Authentication | WARN |
| NetworkConn | WARN |
| FileAccess | INFO |
| ProcessSpawn | INFO |

---

## Dashboards

| Dashboard | Description |
|---|---|
| Threat Overview | Severity distribution, alert type breakdown, top threat-generating hosts |
| Domain Activity Monitor | Per-domain event volumes, ingest rates, top hosts and users |
| Network Connection Analysis | Source IPs, destination ports, protocol breakdown, exfil signal detection |
| User Behavior Analytics | Cross-domain users, privilege escalation tracking, exfil actors |
| Incident Timeline | Chronological FATAL/ERROR events with full actor details |
| Executive Summary | Risk posture gauge, KPIs, severity/domain health, bandwidth panel, analyst recommendations |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v8+

### Install and run

```bash
pnpm install
pnpm --filter @workspace/cross-domain-demo run dev
```

The app will be available at `http://localhost:<PORT>` (port is assigned automatically).

### Build for production

```bash
pnpm --filter @workspace/cross-domain-demo run build
```

Output is written to `artifacts/cross-domain-demo/dist/public/`.

---

## Windows Desktop App

A native Windows installer is built automatically via GitHub Actions whenever a version tag is pushed.

### Download

Go to [Releases](https://github.com/Telieou-source/Unified-Security-View/releases) and download:

| File | Description |
|---|---|
| `Demo_SIEM_vX.X.X_x64-setup.exe` | **Recommended.** NSIS installer — guided setup, bundles WebView2 |
| `Demo_SIEM_vX.X.X_x64_en-US.msi` | MSI package for enterprise/group policy deployment |

**Requirements:** Windows 10 or 11 (64-bit)

### Build locally (Windows)

Requires [Node.js](https://nodejs.org/) v20+, [pnpm](https://pnpm.io/), and [Rust stable](https://rustup.rs/).

```bash
pnpm install
pnpm --filter @workspace/cross-domain-demo run tauri:build
```

Installers are written to `artifacts/cross-domain-demo/src-tauri/target/release/bundle/`.

### Release a new version

```bash
git tag v1.2.0
git push origin v1.2.0
```

GitHub Actions builds the Windows installer and attaches it to the release automatically.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite 7** (dev server and build)
- **Tailwind CSS v4**
- All simulation logic is client-side — no backend, no database, no external API calls

---

## Project Structure

```
artifacts/cross-domain-demo/
├── src/
│   ├── App.tsx                  # Root component, simulation loop, state
│   ├── components/
│   │   ├── DomainPanel.tsx      # Per-domain event stream display
│   │   ├── BoundaryLayer.tsx    # Cross-domain guard visualization
│   │   ├── CorrelatedView.tsx   # High-side correlated alert feed
│   │   ├── DashboardView.tsx    # All six analytical dashboards
│   │   ├── HealthMonitor.tsx    # Bandwidth & system health strip
│   │   ├── NavPanel.tsx         # Search, Reports, Investigations panels
│   │   ├── StatsBar.tsx         # Simulation controls and live counters
│   │   ├── AlertDetailModal.tsx # Correlated alert detail overlay
│   │   └── StartScreen.tsx      # Pre-simulation landing screen
│   ├── lib/
│   │   ├── simulation.ts        # Event generation, sanitization, correlation
│   │   └── reports.ts           # Report generation logic
│   ├── data/
│   │   ├── config.ts            # Domain configuration
│   │   └── seedEvents.ts        # 76 pre-loaded historical events
│   └── types.ts                 # Shared TypeScript types
└── vite.config.ts
```

---

## Live Demo

Cross-Domain Security Metadata Demo
https://unified-security-view.replit.app

## License

This project is provided for demonstration and educational purposes.
