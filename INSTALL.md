# Installation Guide — Demo SIEM

There are three ways to run Demo SIEM. Choose the one that fits your situation.

---

## Option 1 — Use the live web app (no install required)

Open a browser and go to:

```
https://unified-security-view.replit.app
```

No account, no download, no setup needed. The full simulator runs entirely in your browser.

---

## Option 2 — Install the Windows desktop app

The Windows app is a native executable built with Tauri. It runs offline and does not require a browser.

### Requirements

- Windows 10 or Windows 11 (64-bit)
- WebView2 runtime (included in the NSIS installer; already present on most Windows 11 machines)

### Steps

1. Go to the [Releases page](https://github.com/Telieou-source/Unified-Security-View/releases).
2. Find the latest release and expand **Assets**.
3. Download one of the following:

   | File | When to use |
   |---|---|
   | `Demo_SIEM_vX.X.X_x64-setup.exe` | **Recommended for personal use.** Guided installer, bundles WebView2 if missing. |
   | `Demo_SIEM_vX.X.X_x64_en-US.msi` | Enterprise / group policy deployment. |

4. Run the downloaded file and follow the on-screen prompts.
5. Launch **Demo SIEM** from the Start menu or the desktop shortcut.

> If Windows SmartScreen shows a warning, click **More info → Run anyway**. The app is not yet code-signed.

---

## Option 3 — Run from source (local development)

Use this if you want to explore or modify the code.

### Requirements

| Tool | Minimum version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 8+ | https://pnpm.io/installation |
| Git | any | https://git-scm.com |

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/Telieou-source/Unified-Security-View.git
cd Unified-Security-View
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Start the development server**

```bash
pnpm --filter @workspace/cross-domain-demo run dev
```

**4. Open the app**

The terminal will print a local URL such as `http://localhost:5173`. Open that address in your browser.

> The port may vary. Use whatever URL the terminal outputs.

**5. Stop the server**

Press `Ctrl + C` in the terminal.

---

## Option 4 — Build the Windows installer from source

Use this to produce your own `.exe` or `.msi` from the source code.

### Additional requirements (beyond Option 3)

| Tool | Notes |
|---|---|
| Rust stable | Install via https://rustup.rs — run `rustup update stable` after install |
| Visual Studio Build Tools | Required by Rust on Windows — select the **C++ build tools** workload |
| WebView2 SDK | Usually already present on Windows 11 |

### Steps

**1. Complete steps 1 and 2 from Option 3** (clone + `pnpm install`)

**2. Build the Tauri bundle**

```bash
pnpm --filter @workspace/cross-domain-demo run tauri:build
```

This compiles the Rust shell, bundles the Vite frontend, and produces installers at:

```
artifacts/cross-domain-demo/src-tauri/target/release/bundle/
├── nsis/          ← .exe installer
└── msi/           ← .msi installer
```

The first build takes several minutes while Rust compiles dependencies. Subsequent builds are faster.

---

## Releasing a new version

Push a version tag and GitHub Actions builds and publishes the installer automatically:

```bash
git tag v1.2.0
git push origin v1.2.0
```

The workflow builds the Windows bundle and attaches both installer files to a new GitHub Release.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `pnpm: command not found` | Run `npm install -g pnpm` then retry |
| Port already in use | Another process is using the port — close it or the dev server will pick the next available port automatically |
| Rust compile errors on first build | Run `rustup update stable` to ensure you have the latest stable toolchain |
| SmartScreen blocks the `.exe` | Click **More info → Run anyway** — the binary is safe but unsigned |
| WebView2 missing on older Windows 10 | Use the NSIS installer (`-setup.exe`) — it bundles the WebView2 bootstrapper |
