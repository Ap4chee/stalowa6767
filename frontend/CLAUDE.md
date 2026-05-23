# Steel Sentinel — CLAUDE.md

## Stack

| Technologia | Wersja | Uwagi |
|---|---|---|
| Next.js | 16.2.6 App Router | Breaking changes — patrz `node_modules/next/dist/docs/` |
| React | 19 | |
| TypeScript | 5 (strict) | |
| Tailwind CSS | 4 | `@import "tailwindcss"`, NOWA składnia — brak `@tailwind`/`tailwind.config` |
| CesiumJS | 1.118 | CDN w layout.tsx — `(window as any).Cesium`, brak npm types |
| Three.js | ^0.184 | W package.json ale zero importów w src — nie używać |
| lucide-react | ^1.16 | Ikonki |

---

## Plik po pliku — kontekst

---

### `layout.tsx` (root layout)

Ładuje z CDN:
- CesiumJS 1.118 (`Cesium.js` + `widgets.css`)
- Google Fonts: Rajdhani (500,600,700), Share Tech Mono, JetBrains Mono

Ustawia `<html>` i `<body>` z Tailwind klasami — ciemne tło, monospace font. Body ma `overflow-hidden` i `h-full`.

---

### `globals.css`

```css
@import "tailwindcss";
```
Tailwind v4 — NOWA składnia. Brak `@tailwind base/components/utilities`.

Custom klasy:
- `.font-rajdhani` — Rajdhani sans-serif
- `.font-sharetech` — Share Tech Mono
- `.font-jetbrains` — JetBrains Mono
- `.ticker-wrap` / `.ticker` — animacja przewijania tekstu (40s linear infinite, translateX)
- `.terminal-scroll` — custom scrollbar (4px, slate-950 track, slate-800 thumb)
- `.clip-chamfer` / `.clip-chamfer-lg` — military-style clipped corners (polygon clip-path)
- `.reticle-crosshair` — tactical grid overlay (używany?)

CSS vars: `--background: #020617`, `--foreground: #e2e8f0`.

---

### `types/index.ts`

Wszystkie interfejsy i aliasy:

```typescript
CriticalNode     — węzeł: id, name, lat/lon, type (industrial|power|water|electrical|logistic|transit|hq),
                   health (0-100), status (OPERATIONAL|DEGRADED|DESTROYED), backupPower bool, notes
WeaponSystem     — konfig broni: type (PILICA|WRE|RADAR), range (metry), color, threatsCovered[] 
DeployedSystem   — zainstalowana broń: id, type, name, lat/lon, radius, color
ThreatType       — template zagrożenia: speed, alt, immuneToWRE bool
Threat           — aktywny wróg: id, type, startLat/Lon, lat/lon, alt, targetId, pathType (DIRECT|RIVER),
                   progress 0-1, status (FLYING|JAMMED|INTERCEPTED|IMPACTED), health
LogEntry          — timestamp, text, type (info|success|warning|error|combat)
HoveredCoords     — lat, lon, alt, az (z kursora myszy)
SimState          — snapshot dla pętli Cesium: { deployedSystems, threats, simSpeed, nodes, selectedWeapon }
```

Aliasy: `WeaponType`, `ThreatTypeName`, `NodeStatus`, `LogType`, `SidebarTab` (details|cascades|playbooks).

---

### `data/nodes.ts`

- `CENTER_LAT = 50.5630`, `CENTER_LON = 22.0490` — centrum Stalowej Woli
- `INITIAL_NODES: CriticalNode[]` — 7 obiektów:
  - OBJ_01: Huta Stalowa Wola (industrial)
  - OBJ_02: Elektrownia (power) — zasila OBJ_01 i OBJ_03
  - OBJ_03: Stacja Uzdatniania MZK (water) — chłodzi OBJ_02
  - OBJ_04: GPZ Maziarnia (electrical) — zasila OBJ_07
  - OBJ_05: Węzeł Kolejowy Rozwadów (logistic) — brak zależności
  - OBJ_06: Most gen. Bora-Komorowskiego (transit) — brak zależności
  - OBJ_07: Centrum Zarządzania Kryzysowego (hq)
- `NODE_COLORS: Record<string, string>` — hex kolory per type (np. industrial: "#0e7490")

---

### `data/weapons.ts`

`WEAPONS: WeaponSystem[]` — 3 systemy:

| System | Range | Kolor | Zwalcza |
|---|---|---|---|
| PILICA | 5000m | #ff4d4d (red) | DRONE, SHAHED, MISSILE |
| WRE | 2000m | #3b82f6 (blue) | tylko DRONE |
| RADAR | 3500m | #22c55e (green) | DRONE, SHAHED, MISSILE (tylko wizualny — nie interceptuje) |

RADAR nie ma logiki interceptu w pętli symulacji — tylko PILICA i WRE faktycznie zestrzeliwują/ zagłuszają.

---

### `data/threats.ts`

`THREAT_TYPES: Record<string, ThreatType>` — 3 typy:

| Typ | Speed | Alt | immuneToWRE | Ścieżka |
|---|---|---|---|---|
| DRONE | 0.0003 | 120m | false | DIRECT |
| SHAHED | 0.0005 | 250m | true (odporny na WRE) | RIVER (korytem Sanu) |
| MISSILE | 0.0014 | 600m | true | DIRECT |

---

### `data/river.ts`

`SAN_RIVER_COORDS` — 8 współrzędnych GPS rzeki San od południowego wschodu na północny zachód. Używane w:
- Rysowaniu polyline rzeki w Cesium (glow + core)
- Nawigacji SHAHED wzdłuż koryta (pathType === "RIVER")
- Po 80% trasy skręca do celu (bankProgress)

---

### `hooks/useAudio.ts`

```typescript
useAudio(soundEnabled: boolean) => { playBeep }
```

- `playBeep(freq, type, duration)` — tworzy AudioContext, osc + gain, 0.04 volume, exponential ramp do 0.
- Jeśli `soundEnabled === false` — no-op.
- Catchuje błędy (np. blokada autoplay).

---

### `hooks/useDefcon.ts`

```typescript
useDefcon(threats, nodes, deployedSystemsLength, defcon, setDefcon, addLog)
useEffect — odpala przy zmianie threats/nodes/deployedSystems/defcon
```

Logika DEFCON:
- 5: brak zagrożeń, brak broni
- 4: broń postawiona (deployedSystemsLength > 0)
- 3: aktywne zagrożenie (FLYING >= 1)
- 2: zniszczony węzeł (DESTROYED >= 1) lub 3+ aktywne
- 1: 3+ zniszczone

Zmiana loguje addLog z type: error (1-2), warning (3), info (4-5).

---

### `hooks/useCascadingEngine.ts`

```typescript
useCascadingEngine(nodes, setNodes, simSpeed, coolingSecondsLeft, setCoolingSecondsLeft,
                   waterSecondsLeft, setWaterSecondsLeft, addLog, nodeEntitiesRef)
```

Interval 1000ms. Logika kaskadowa:

1. **OBJ_02 (elektrownia) DESTROYED/DEGRADED**:
   - OBJ_01 (huta): health -= 5\*simSpeed, floor 15%, status DEGRADED
   - OBJ_03 (woda): jeśli OPERATIONAL → `setWaterSecondsLeft(12)`, error log

2. **waterSecondsLeft countdown**: -= 1\*simSpeed, przy 0 → OBJ_03 DESTROYED

3. **OBJ_03 DESTROYED/DEGRADED**:
   - OBJ_02: jeśli OPERATIONAL → `setCoolingSecondsLeft(6)`, error log

4. **coolingSecondsLeft countdown**: -= 1\*simSpeed, przy 0 → OBJ_02 DESTROYED

5. **OBJ_04 (GPZ) DESTROYED**: OBJ_07 → health 40, DEGRADED

Po zmianach: aktualizuje `nodeEntitiesRef` (kolory point entities w Cesium: green/amber/red).

---

### `hooks/useCesiumViewer.ts`

```typescript
useCesiumViewer({ containerRef, simStateRef, centerLat, centerLon,
                  onAddLog, setDeployedSystems, setThreats, setNodes,
                  setSelectedWeapon, setHoveredCoords,
                  setSelectedNode?, setSelectedSystem? }) => {
  viewerRef, nodeEntitiesRef, domeEntitiesRef, threatEntitiesRef,
  isCesiumLoaded, flyToNode, resetViewer, removeDeployedSystem
}
```

**Init Cesium Viewer** (useEffect, []):

- `new Cesium.Viewer(...)` z wyłączonymi wszystkimi kontrolkami, creditContainer w dummy div
- `imageryProvider: false` (bez Bing), potem `UrlTemplateImageryProvider` z CartoDB light_all
- `terrain: undefined`, `depthTestAgainstTerrain: false` (entity widoczne pod ziemią)
- `skyAtmosphere: false`, `fog: false`, `globe.baseColor: #f3f4f6` (light)
- `resolutionScale: Math.min(1.0, devicePixelRatio)` — zapobiega rozmyciu na Retina
- `PolylineCollection` dla laserów (primitive — wydajniejsze niż entity)

**Entity tworzone**:

1. **7 węzłów**: każdy to cylinder hexagonal (glassmorphic, 6 slices) + polyline beacon (ground→180m) + ground ellipse + point marker + label (dark text, WHITE outline, outlineWidth 6, scale 0.3) + sub-label GPS
2. **Rzeka San**: glow polyline (width 8, glowPower 0.35) + core polyline (width 2.5, cyan) + label
3. **Zona taktyczna**: rectangle (22.01-22.09, 50.52-50.60) + NW/SE corner labels
4. **Bronie** (przy deploy): ellipsoid z `GridMaterialProperty` (lineCount 12x12, thickness 2.5) + ground ellipse + tower cylinder (5 slices) + beacon + label

**Eventy**:

- **MOUSE_MOVE**: throttle 80ms, pickEllipsoid → `setHoveredCoords({lat, lon, alt, az})`
- **LEFT_CLICK — deploy mode** (`selectedWeapon !== null`):
  - Walidacja bounding box: lat 50.51-50.61, lon 22.01-22.09
  - Tworzy DeployedSystem + Cesium entity
  - `setDeployedSystems`, `setSelectedWeapon(null)`
- **LEFT_CLICK — picking mode** (`selectedWeapon === null`):
  - `scene.pick(click.position)` → dopasowuje entity.id do:
    - `nodes[].id` (OBJ_01 itd.) → `setSelectedNode`, `flyToNode`
    - `deployedSystems[].id` → `setSelectedSystem`
  - Pusty klik → czyści selekcję

**Pętla symulacji** (requestAnimationFrame):

- Czyta `simStateRef.current` (speed, threats, nodes, systems)
- Czyści lasery (`laserLinesRef.current.removeAll()`)
- Dla każdego FLYING threata:
  1. `progress += 0.003 * speed`
  2. Interpolacja pozycji (DIRECT: liniowa, RIVER: po współrzędnych Sanu, bankProgress 0.8-1.0)
  3. Tworzy/aktualizuje entity threata (point + label)
  4. Dla każdego systemu: `Cartesian3.distance(sysPos, threatPos)`
     - Jeśli ≤ radius: sprawdza `activeMatch` (PILICA zawsze, WRE tylko !immuneToWRE)
     - Rysuje lasery (glow + core), zadaje damage (PILICA 0.9, WRE 2.5)
     - health ≤ 0: status INTERCEPTED/JAMMED, remove entity, setThreats
  5. `progress >= 1.0` i nie zestrzelony: IMPACTED, target node DESTROYED

**Zwracane funkcje**:

- `flyToNode(lat, lon, name)` — `camera.flyTo` z wysokością 1000m, pitch -35°
- `resetViewer()` — usuwa domy i threaty z Cesium, resetuje kolory węzłów na green
- `removeDeployedSystem(sysId)` — usuwa entity po id (sysId, sysId_tower, sysId_beacon, sysId_label)

Cleanup: `cancelAnimationFrame`, `handler.destroy()`, `viewer.destroy()`.

---

### `page.tsx` (SteelSentinelDashboard)

Orchestrator — ok. 360 linii. Cały stan + callbacki + render.

**Stan** (useState):
- `nodes: CriticalNode[]` — inicjalizowany z `INITIAL_NODES`
- `deployedSystems: DeployedSystem[]`
- `selectedWeapon: WeaponType | null`
- `threats: Threat[]`
- `logs: LogEntry[]` — 3 początkowe wpisy
- `defcon: number` — start 5
- `simSpeed: number` — 1 (0 = pauza)
- `playbookActive: string | null`
- `soundEnabled: boolean`
- `activeTab: SidebarTab`
- `clockTime: string`
- `hoveredCoords: HoveredCoords`
- `coolingSecondsLeft / waterSecondsLeft: number | null`
- `leftSidebarOpen / rightSidebarOpen: boolean`
- `selectedNode / selectedSystem: ... | null`

**simStateRef**: useRef snapshot dla pętli Cesium, aktualizowany useEffect przy każdej zmianie.

**clockTime timer**: setInterval 1s.

**Callbacki**:

- `addLog(text, type)` — append do logs (max 35), playBeep per type
- `spawnThreat(type, targetId)` — tworzy Threat, startLat random w paśmie, startLon = CENTER_LON + 0.08 (wschód), SHAHED pathType=RIVER
- `launchScenario(index)` — 4 scenariusze z setTimeout
- `activatePlaybook(id, name)` — SIREN / ALERT_SMS / BACKUP_GEN
- `handleReset` — resetuje stan + resetViewer
- `handleNodeClick(node)` — selectedNode + flyToNode
- `handleActivateBackupPower(nodeId)` — backupPower=true
- `handleResetCooling()` — przywraca OBJ_02
- `handleResetWater()` — przywraca OBJ_03
- `handleRemoveSystem(sysId)` — deployedSystems.filter + removeDeployedSystem

Używa hooków: `useAudio`, `useCascadingEngine`, `useDefcon`, `useCesiumViewer`.

---

### Components

---

#### `Header.tsx`

Props: `defcon, clockTime, soundEnabled, onToggleSound`

- Po lewej: logo (Shield icon + "STEEL SENTINEL" + "CESIUM_COP v4.0.2") + Compass + "STALOWA WOLA DIGITAL TWIN"
- Po prawej: DEFCON badge (kolor/animacja per poziom) + zegar UTC + mute toggle
- `onAddLog` w props ale nieużywany (onToggleSound woła addLog w page.tsx, nie tutaj)

---

#### `AlertTicker.tsx`

Props: `threats: Threat[]`

- fixed top-12, wysokość 24px, slate-900 tło
- "TACTICAL FEED" label + ticker (CSS animation 40s)
- if any FLYING → czerwony alert, else normalny status feed

---

#### `CesiumViewport.tsx`

Props: `cesiumContainerRef: MutableRefObject<HTMLDivElement | null>`

- `<main>` z `pt-[72px]` (miejsce na header + ticker)
- `<div ref={cesiumContainerRef}>` — tutaj Cesium rysuje canvas
- Floating badge: "CESIUM_GIS_LINK" + "STW_GRID: 3D TERRAIN ACTIVE"
- `cursor-crosshair` na kontenerze

---

#### `LeftSidebar.tsx`

Props: `activeTab, onTabChange, nodes, coolingSecondsLeft, waterSecondsLeft, onNodeClick, playbookActive, onActivatePlaybook, onStopPlaybook, isOpen, onToggle`

- fixed left-4, top-20, width 320px, height calc(100vh - 230px)
- `clip-chamfer`, `backdrop-blur-md`
- **Toggle button** po prawej stronie (vertical "UKRYJ"/"WĘZŁY")
- `translate-x` animacja 300ms — wysuwa/chowa sidebar
- 3 zakładki: SZCZEGÓŁY / KASKADY / ALERT_CMD
- Renderuje warunkowo: NodeList | CascadeGraph | PlaybookControls
- Zakładka KASKADY ma czerwone ping gdy timery aktywne

---

#### `NodeList.tsx`

Props: `nodes, onNodeClick`

- "WĘZŁY INFRASTRUKTURY" + licznik OPERATIONAL/07
- Lista węzłów: ikonka per type, nazwa, status badge, opis, health bar (kolor wg poziomu), notes
- Kliknięcie → `onNodeClick(node)` (flyTo w page.tsx)
- Kolory: DESTROYED=red, DEGRADED=amber, OPERATIONAL=slate

---

#### `CascadeGraph.tsx`

Props: `nodes, coolingSecondsLeft, waterSecondsLeft`

- "GRAF ZALEŻNOŚCI MIĘDZYWĘZŁOWYCH"
- **Alert box**: gdy timery aktywne — czerwony z AlertTriangle + countdown
- **SVG 280x160**: strzałki (green/red) + kółka z etykietami (E2, H1, W3, G4, K7)
- Strzałki: E2→H1, E2→W3, W3→E2 (feedback loop), G4→K7
- Opisy zależności pod spodem

---

#### `PlaybookControls.tsx`

Props: `playbookActive, onActivatePlaybook, onStopPlaybook`

- "PROCEDURY BEZPIECZEŃSTWA (PLAYBOOKS)"
- 3 przyciski: SYRENY (amber), ALERTY SMS (cyan), START GENERATORÓW (emerald)
- Każdy z "ODPAL" badge
- Gdy `playbookActive` — panel "PROCEDURA W TOKU" z opisem per id + STOP button

---

#### `ArsenalPanel.tsx`

Props: `weapons, deployedSystems, selectedWeapon, onSelectWeapon, onLaunchScenario, onReset, simSpeed, onTogglePause, onAddLog, isOpen, onToggle`

- fixed right-4, top-20, width 320px
- **Toggle button** po lewej stronie (vertical "UKRYJ"/"ARSENAŁ")
- Sekcja broni: lista WEAPONS z klikiem → select/deselect + "TRYB CELOWANIA AKTYWNY"
- Każda broń: kolorowa kropka, nazwa, opis, zasięg, pokrywane cele, licznik AKTYWNE
- Sekcja scenariuszy: grid 2x2 — SCEN_01 do SCEN_04
- Dolny rząd: RESET SYSTEMU + PAUZA SIM/WZNÓW SIM (toggle)
- `translate-x` animacja po isOpen

---

#### `ObjectDetailCard.tsx`

Props: `selectedNode, selectedSystem, onClose, onActivateBackupPower, coolingSecondsLeft, waterSecondsLeft, onResetCooling, onResetWater, onRemoveSystem, onFlyTo`

- fixed bottom-44, centered, width 480px, z-50
- Renderuje się tylko gdy `selectedNode || selectedSystem` (inaczej null)
- **Node mode**:
  - Status badge + GPS coordinates
  - Health bar (rounded, z animacją)
  - Description + notes (amber box dla system messages)
  - "MAPA ZALEŻNOŚCI KASKADOWYCH" — per-node info o zależnościach
  - 2 przyciski: NAMIERZ GPS + URUCHOM GENERATORY (disabled gdy już aktywne)
  - Emergency override dla OBJ_02 (coolingSecondsLeft) i OBJ_03 (waterSecondsLeft) — czerwone pulse box + przycisk restartu
- **System mode**:
  - Status: AKTYWNY / SKANOWANIE + GPS
  - Zasięg, zwalczane cele, sygnatura WebGL
  - NAMIERZ GPS + ZDEMONTUJ SYSTEM (usuwa z Cesium + state)

---

#### `ThreatMonitor.tsx`

Props: `threats, nodes, isOpen`

- fixed left-4 bottom-4, width 320px, height 144px
- "MONITOR WYKRYWANIA RADAROWEGO" + licznik ECHO CELE
- Lista threatów (reverse order): nazwa, typ, cel, status (AKTYWNY/ZESTRZELONY/ZAKŁÓCONY/TRAFIENIE)
- Kolory per status: red/emerald/blue/slate line-through
- Empty state: "BRAK AKTYWNYCH ECH"
- `translate-x` animacja po isOpen

---

#### `CommandLogger.tsx`

Props: `logs, clockTime, isOpen`

- fixed right-4 bottom-4, width 384px, height 144px
- "KONSOLA ZDARZEŃ BOJOWYCH I ALARMOWYCH"
- Lista logów: timestamp + kolorowany tekst per type
- Cursor blink na końcu (pulsująca cyan kreska)
- `translate-x` animacja po isOpen

---

#### `TelemetryHUD.tsx`

Props: `hoveredCoords`

- fixed bottom-4 center, px-6 py-2
- 4 sekcje: GPS coord (cyan), Altitude, Azimuth, Tactical Scale
- Wartości z `hoveredCoords` (aktualizowane przez mouse move w Cesium)

---

## Ważne uwagi techniczne

1. **CesiumJS przez CDN** — `(window as any).Cesium`, żadnych importów ani typów npm.
2. **Next.js 16 breaking changes** — sprawdź `AGENTS.md` i `node_modules/next/dist/docs/`.
3. **Three.js jest DEAD** — w package.json, zero importów. Nie używać.
4. **`backend/` pusty** — `.gitignore` hintuje Laravel, ale nic nie ma.
5. **`code.html`** w root — stary prototyp HTML. Nie ruszać.
6. **Tailwind v4 składnia** — `@import "tailwindcss"`, brak `tailwind.config`. Klasy jak w v3 + nowe (np. `rounded-[...]`).
7. **Brak lintera/formattera** — eslint tylko next-core. Trzymaj się istniejącego stylu.
8. **Custom CSS w globals.css** — font-rajdhani/sharetech/jetbrains, ticker animacja, terminal-scroll, clip-chamfer.
9. **Lasery w PolylineCollection** (primitive, nie entity) dla wydajności — czyszczone `removeAll()` co klatkę.
10. **Logi max 35** — `if (next.length > 35) next.shift()`.
11. **Wszystkie entity Cesium mają `disableDepthTestDistance: POSITIVE_INFINITY`** — zawsze widoczne na wierzchu.
12. **Entity ID dla broni** — domyślnie `SYS_${Date.now()}`, potem `_tower`, `_beacon`, `_label` — te sub-ID są używane przy `removeDeployedSystem` i przy entity pickingu.
