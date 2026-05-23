# STEEL SENTINEL

Tactical C2 dashboard — defense of critical infrastructure in Stalowa Wola. Next.js 16 + CesiumJS 3D globe.

## Stack

| Co | Wersja |
|---|---|
| Next.js | 16.2.6 (App Router) |
| React | 19 |
| TypeScript | 5 (strict) |
| Tailwind CSS | 4 |
| CesiumJS | 1.118 (CDN, nie npm) |
| Three.js | ^0.184 (zainstalowany, nieużywany w src) |

CesiumJS jest ładowany z CDN w `layout.tsx` — nie przez npm.

## Struktura

```
frontend/app/
├── types/index.ts          — interfejsy TS (CriticalNode, Threat, LogEntry, itd.)
├── data/
│   ├── nodes.ts            — dane 7 węzłów infrastruktury + stałe GPS
│   ├── weapons.ts          — konfiguracja broni (PILICA, WRE, RADAR)
│   ├── threats.ts          — typy zagrożeń (DRONE, SHAHED, MISSILE)
│   └── river.ts            — współrzędne rzeki San (polyline)
├── hooks/
│   ├── useAudio.ts         — Web Audio API (oscillator beep)
│   ├── useCascadingEngine.ts — logika kaskad (zależności między węzłami)
│   ├── useDefcon.ts        — wyliczanie poziomu DEFCON
│   └── useCesiumViewer.ts  — inicjalizacja Cesium + entity management + pętla symulacji
├── components/
│   ├── Header.tsx           — górny pasek: DEFCON, zegar, mute
│   ├── AlertTicker.tsx      — pasek z newsem (ticker CSS animation)
│   ├── CesiumViewport.tsx   — kontener na canvas Cesium + floating badge
│   ├── LeftSidebar.tsx      — lewy panel z 3 zakładkami (orchestrator)
│   │   ├── NodeList.tsx     — lista węzłów z paskami zdrowia
│   │   ├── CascadeGraph.tsx — SVG graf zależności + timery
│   │   └── PlaybookControls.tsx — przyciski procedur awaryjnych
│   ├── ArsenalPanel.tsx     — prawy panel: wybór broni + scenariusze + pauza/reset
│   ├── ThreatMonitor.tsx    — lista aktywnych zagrożeń (lewy dół)
│   ├── CommandLogger.tsx    — konsola logów (prawy dół)
│   └── TelemetryHUD.tsx     — współrzędne GPS + wysokość (dolny środek)
└── page.tsx                 — stan + klejenie wszystkiego (~250 linii)
```

## Uruchomienie

```bash
cd frontend
npm install
npm run dev
```

## Uwagi

- `backend/` jest pusty — `.gitignore` sugeruje Laravel, ale nic nie zostało zaimplementowane.
- Three.js jest w dependencies ale nie ma importu w src — relikt lub do wywalenia.
- `code.html` w root projektu to wcześniejszy prototyp (HTML standalone), nieużywany.
- CesiumJS nie ma własnego tokena — używa CartoDB Voyager jako basemap (light, bez Bing).
