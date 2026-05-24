# STEEL SENTINEL — CLAUDE.md
## Tactical Common Operational Picture (COP) — Command & Control Dashboard

---

## ARCHITEKTURA APLIKACJI

Aplikacja jest w pełni samodzielnym (zero backendu) dashboardem typu C2 (Command & Control) zbudowanym na Next.js 16 (App Router). Całość stanu zarządzana jest przez React `useState`, a dane są statyczne (hardcoded) z persystencją do `localStorage`. Nie ma API, WebSocketów ani bazy danych.

### Stack technologiczny

| Technologia | Wersja | Zastosowanie |
|---|---|---|
| Next.js | 16.2.6 | Framework React (App Router) |
| React | 19.2.4 | Biblioteka UI |
| TypeScript | ^5 | Typowanie |
| Tailwind CSS | ^4 | Utility-first CSS (składnia `@import "tailwindcss"`, brak `tailwind.config`) |
| CesiumJS | 1.118 (CDN) | 3D globus GIS (ładowany z CDN w `layout.tsx`) |
| @xyflow/react | 12.10.2 | Diagram przepływów (React Flow) |
| @react-three/fiber | 9.6.1 | Renderer Three.js dla React |
| @react-three/drei | 10.7.7 | Utility do Three.js (OrbitControls, GLTF, Environment) |
| three | ^0.184.0 | Silnik 3D (zależność fiber/drei) |
| lucide-react | ^1.16.0 | Ikony |
| Google Fonts | — | Rajdhani, Share Tech Mono, JetBrains Mono (CDN) |

### Persystencja (localStorage)

| Klucz | Zawartość |
|---|---|
| `sentinel_nodes` | Tablica węzłów krytycznych (dodawanie/edycja węzłów) |
| `sentinel_relations` | Tablica relacji między węzłami |
| `sentinel_node_positions` | Pozycje węzłów w widoku DependencyFlow |
| `spaceshield_detail_card_pos` | Pozycja okienka ObjectDetailCard |
| `steel-sentinel-theme` | Motyw (`light` / `dark`) |
| `steel-sentinel-basemap` | Typ podkładu mapy (`standard` / `satellite` / `topo`) |

---

## Typy (app/types/index.ts)

- `CriticalNode` — węzeł infrastruktury krytycznej (id, name, lat, lon, type, health %, status, backupPower, notes)
- `WeaponSystem` — definicja systemu obronnego (type, range, color, threatsCovered)
- `DeployedSystem` — zainstalowany system na mapie (id, type, lat, lon, radius)
- `ThreatType` — typ zagrożenia (speed, alt, immuneToWRE)
- `Threat` — aktywne zagrożenie (position, targetId, pathType, progress, status, health)
- `LogEntry` — wpis w konsoli zdarzeń (timestamp, text, type)
- `HoveredCoords` — współrzędne pod kursorem (lat, lon, alt, az)
- `NodeRelation` — relacja między węzłami (source, target, label)
- `SimState` — snapshot całego stanu symulacji (dla refa)
- Typy pomocnicze: `WeaponType`, `ThreatTypeName`, `NodeStatus`, `LogType`, `SidebarTab`

---

## Dane statyczne (app/data/)

### nodes.ts
- `CENTER_LAT` / `CENTER_LON` (50.5630, 22.0490) — centrum Stalowej Woli
- `INITIAL_NODES` — 7 węzłów startowych (OBJ_01 do OBJ_07):
  - OBJ_01: Huta Stalowa Wola S.A. (industrial)
  - OBJ_02: Elektrownia Stalowa Wola (power)
  - OBJ_03: Stacja Uzdatniania MZK (water)
  - OBJ_04: GPZ "Maziarnia" (electrical)
  - OBJ_05: Węzeł Kolejowy Rozwadów (logistic)
  - OBJ_06: Most gen. Bora-Komorowskiego (transit)
  - OBJ_07: Centrum Zarządzania Kryzysowego (hq)
- `NODE_COLORS` — mapa kolorów dla każdego typu węzła
- `INITIAL_RELATIONS` — 6 początkowych relacji (CHŁODZIWO, PALIWO, ZASILANIE, TELCO)

### weapons.ts
4 systemy obronne:
- **PILICA** — VSHORAD (5km, zwalcza DRONE/SHAHED/MISSILE)
- **WRE JAMMER** — walka radioelektroniczna (2km, tylko DRONE)
- **RADAR** — radar dopplerowski (3.5km, tylko detekcja)
- **PATRIOT PAC-3** — system dalekiego zasięgu (40km, SHAHED/MISSILE)

### threats.ts
3 typy zagrożeń:
- **DRONE** — niski pułap (120m), podatny na WRE
- **SHAHED** — amunicja krążąca (250m), odporny na WRE, path=RIVER
- **MISSILE** — rakieta manewrująca (600m), odporny na WRE

### river.ts
`SAN_RIVER_COORDS` — 8 waypointów koryta Sanu (używane do renderowania rzeki i nawigacji Shahed)

---

## Hooki (app/hooks/)

### useAudio.ts
- Zwraca `{ playBeep }`
- Tworzy `AudioContext` + `OscillatorNode` + `GainNode`
- Parametry: frequency (Hz), waveform type (sine/sawtooth/triangle/square), duration
- No-op gdy `soundEnabled === false`
- Łapie wyjątki związane z autoplay blocking (try/catch)

### useCascadingEngine.ts
- 1-sekundowy `setInterval`
- Główna pętla awarii kaskadowych:
  - Elektrownia (OBJ_02) zniszczona/degradowana → Huta traci zasilanie (health spada do 15%) + Ujęcie wody traci pompy (drenaż rezerw 12h)
  - Woda (OBJ_03) zniszczona → Elektrownia traci chłodzenie (6-sekundowe wygaszanie turbiny)  
  - GPZ Maziarnia (OBJ_04) zniszczony → Centrum Kryzysowe (OBJ_07) spada do 40% health
  - Aktualizuje kolory encji na Cesium (zielony → żółty → czerwony)

### useDefcon.ts
- Oblicza poziom DEFCON (1-5):
  - 5: Wszystko nominalne
  - 4: Rozstawiono systemy obronne
  - 3: Wykryto aktywne zagrożenie
  - 2: Zniszczono ≥1 węzeł LUB ≥3 aktywne zagrożenia
  - 1: Zniszczono ≥3 węzły
- Loguje zmianę poziomu

### useCesiumViewer.ts (~966 linii — największy plik)
Serce aplikacji. Inicjalizuje i zarządza CesiumJS Viewer.

**Inicjalizacja:**
- Tworzy `Cesium.Viewer` z wyłączonymi wszystkimi kontrolkami UI
- Ustawia kamerę na Stalową Wolę z wysokości ~4500m
- Dodaje `PolylineCollection` dla laserów
- Renderuje rzekę San (glow + core + label)
- Dodaje `ScreenSpaceEventHandler` dla mouse move (throttled 80ms → hoveredCoords) i left click (deployment mode vs entity picking)

**Renderowanie węzłów:**
- Dla każdego węzła: cylinder (6-boczny, glass), beacon line, ellipse ring, point + label + coord label
- Reaguje na zmiany w `nodes` i `mapLayers.nodes`

**Renderowanie relacji:**
- Paraboliczne krzywe geodezyjne (24 punkty, peak 160m)
- Glow polyline + floating label card (pill-shaped)
- Kolory: CYAN (OK), ORANGE (degraded), RED (destroyed)
- Obsługuje nakładające się relacje (multiple labels wzdłuż krzywej)

**Deployowanie systemów obronnych:**
- Kliknięcie na mapę z wybraną bronią → tworzy ellipsoidę z `GridMaterialProperty`
- Dla PATRIOT / PILICA: ładuje rzeczywisty model 3D GLB
- Dla pozostałych: cylinder (5-boczny) + beacon + label

**Pętla symulacji (requestAnimationFrame):**
- Porusza zagrożenia po ścieżkach (DIRECT lub RIVER)
- Dla Shahed: nawigacja wzdłuż SAN_RIVER_COORDS + bank approach
- Sprawdza odległość do systemów obronnych
- Rysuje lasery (PolylineCollection: glow outer + solid inner)
- Aplikuje obrażenia (PILICA: 0.9, PATRIOT: 1.8, WRE: 2.5)
- Na zniszczeniu: usuwa encję, loguje combat, zmienia status
- Na impakcie (progress ≥ 1.0): niszczy target node

**Zmiana podkładu mapy:**
- Standard: CartoDB (light/dark w zależności od theme)
- Satellite: Esri World Imagery
- Topo: Esri World Topo Map

---

## Komponenty (app/components/)

### Header.tsx
- Logo "STEEL SENTINEL" + badge wersji
- Przycisk "SCHEMAT POWIĄZAŃ" (toggle DependencyFlow)
- Przycisk "BAZA OBIEKTÓW 3D" (otwiera ThreatModelViewer)
- Wskaźnik ZAGROŻENIE (1-5) z kolorami: zielony/żółty/pomarańczowy/czerwony
- Zegar UTC
- Przyciski: motyw (light/dark), dźwięk (on/off)

### AlertTicker.tsx
- Pasek poniżej headera (fixed, top-12)
- CSS animation: 40s linear scroll
- Tryb spokojny: "SAT FEED: STALOWA WOLA NOMINALNA..."
- Tryb alarmowy (aktywne zagrożenia): "⚠️ ALARM BOJOWY: WYKRYTO ZBLIŻAJĄCE SIĘ POCISKI..."

### CesiumViewport.tsx
- Container `<div>` dla CesiumJS canvas
- Obsługuje split-screen (fade-out gdy schemaModeEnabled)
- `opacity-0 pointer-events-none invisible` gdy schemat aktywny

### LeftSidebar.tsx
- Panel lewy z 3 zakładkami:
  - **SZCZEGÓŁY** → NodeList
  - **KASKADY** → CascadeGraph (z czerwonym ping gdy timery kaskad aktywne)
  - **ALERT_CMD** → PlaybookControls
- Zawinięty w CollapsibleCard

### NodeList.tsx
- Lista wszystkich węzłów z ikonami (typ → lucide icon)
- Status badge (OPERATIONAL/DEGRADED/DESTROYED)
- Health bar (zielony/żółty/czerwony)
- Opis i notatki
- Formularz **"NOWY OBIEKT"**: nazwa, typ (select), lat/lon, opis, notatki
- Formularz **"POWIĄZANIE"**: source (select), target (select), typ relacji (select z "CUSTOM")

### CascadeGraph.tsx
- SVG graf zależności dla 5 węzłów (E2, H1, W3, G4, K7)
- Strzałki kolorowane na zielono (OK) lub czerwono (destroyed)
- Alerty kaskadowe: countdown timery dla wody (12h) i chłodzenia (6s)
- Opisy tekstowe zależności: "Pętla sprzężenia chłodzenia (W3) 🔄 (E2)"

### PlaybookControls.tsx
- 3 przyciski procedur awaryjnych:
  - 🚨 SYRENY ALARMOWE (SIREN)
  - 📱 ALERTY SMS RCB (ALERT_SMS)
  - ⚡ START GENERATORÓW (BACKUP_GEN)
- Panel statusu gdy playbook aktywny (z przyciskiem STOP)
- Każdy playbook ma unikalny opis w panelu statusu

### ArsenalPanel.tsx
- Panel prawy (w CollapsibleCard)
- **Arsenał defensywny**: 4 karty systemów obronnych (klikalne, select wskaźnik)
- "TRYB CELOWANIA AKTYWNY: KLIKNIJ NA MAPĘ" — animowany pasek
- Licznik aktywnych systemów na karcie
- **Symulacja zagrożeń**: 4 scenariusze:
  - SCEN_01: Rój dronów (3x DRONE na HSW, GPZ, MZK)
  - SCEN_02: Shahed rzeka (2x SHAHED na elektrownię i most)
  - SCEN_03: Rakieta taktyczna (1x MISSILE na HSW)
  - SCEN_04: Atak kombinowany (MISSILE + SHAHED + DRONE)
- Przyciski: RESET, PAUZA/WZNÓW

### ThreatMonitor.tsx
- Radar monitor (CollapsibleCard, maxHeight: 130px)
- Lista zagrożeń w odwrotnej chronologii
- Kolory: czerwony (FLYING), zielony (INTERCEPTED), cyan (JAMMED), przekreślony (IMPACTED)
- Pusta: "BRAK AKTYWNYCH ECH"
- Badge z liczbą aktywnych celów

### CommandLogger.tsx
- Konsola zdarzeń (CollapsibleCard, maxHeight: 130px)
- Kolorowanie wpisów po typie: error=red, warning=amber, success=emerald, combat=red bold
- Migający kursor na końcu
- Max 35 wpisów (auto-pruning w page.tsx)

### CollapsibleCard.tsx
- Reużywalny wrapper zwijanej karty
- Chevron animowany, badge, fixedHeight
- Płynne transition na maxHeight i opacity

### TelemetryHUD.tsx
- Bottom bar (fixed, center)
- **Współrzędne GPS**: lat/lon pod kursorem
- **Alt**: wysokość kamery
- **Az**: azymut kamery
- **Skala taktyczna**: "B2G / STALOWA WOLA DIGITAL TWIN"
- Przycisk **"WARSTWY"** → popover z toggle'ami:
  - Podkład satelitarny
  - Węzły strategiczne
  - Powiązania węzłów
  - Kopuły ochronne
  - Wektory zagrożeń
  - Siatka i strefy
  - Rzeki i hydrologia
- **Styl podkładu**: STANDARD / SATELITA / TOPO (3 przyciski)

### ObjectDetailCard.tsx
- **Dragowalny** panel szczegółów (pointer events, clamped do okna)
- Pozycja persistowana do localStorage
- Double-click resetuje pozycję do domyślnej
- **Tryb Node**: status badge, health bar, opis, notatki, mapa zależności kaskadowych, przyciski NAMIERZ GPS + URUCHOM GENERATORY
  - Dla OBJ_02 (elektrownia): przycisk DODAJ CHŁODZIWO (resetuje cooling timer)
  - Dla OBJ_03 (ujęcie wody): przycisk DOŁADUJ POMPY (resetuje water timer)
- **Tryb System**: zasięg, zwalczane cele, NAMIERZ GPS, ZDEMONTUJ SYSTEM

### DependencyFlow.tsx
- **Pełnoekranowy widok schematu blokowego** z @xyflow/react
- Custom węzły `CriticalNodeCard`: nazwa, ID, health bar, notatki, przycisk LOKALIZUJ 3D
- Krawędzie paraboliczne z kolorami: cyan (OK), żółty (degraded), czerwony (destroyed)
- Drag-and-drop do tworzenia nowych relacji (z confirmation dialog + wybór typu przepływu)
- MiniMap + Controls + Background (krzyżyki)
- Panel edytora: dodawanie węzłów i relacji
- Pozycje węzłów persistowane do localStorage

### ThreatModelViewer.tsx
- **Pełnoekranowy przeglądarka 3D** (Three.js)
- 4 modele GLB: FPV drone, Shahed-136, Patriot PAC-3, PSR-A Pilica
- Auto-rotacja z OrbitControls
- Panel info: designation, classification, specyfikacja, analiza wywiadowcza
- **Katalog zagrożeń**: przyciski prev/next (lewo/prawo)
- **Karty środków przeciwdziałania**: klikalne → modal z pełną specyfikacją (zakres, skuteczność, dane techniczne)
- Canvas z: ambient/directional/point lights, ContactShadows, Environment preset "city"
- Preload wszystkich modeli na starcie (`useGLTF.preload`)
- Dekoracje: narożniki cyan, HUD overlay z danymi modelu, grid overlay

---

## Stany i logika w page.tsx (SteelSentinelDashboard)

### State management
- `nodes`, `relations`, `deployedSystems`, `selectedWeapon`, `threats` — główne stany symulacji
- `logs` — tablica logów (max 35)
- `defcon` — poziom zagrożenia (1-5)
- `simSpeed` — prędkość symulacji (0=pauza, 1=normal)
- `playbookActive` — aktywna procedura alarmowa
- `soundEnabled`, `theme`, `baseMapType` — preferencje
- `schemaModeEnabled` — tryb DependencyFlow
- `threatViewerOpen` — modal ThreatModelViewer
- `selectedNode`, `selectedSystem` — zaznaczony obiekt (ObjectDetailCard)
- `mapLayers` — 7 toggle'ów warstw (baseMap, nodes, relations, domes, threats, tacticalZones, hydrology)
- `coolingSecondsLeft`, `waterSecondsLeft` — timery kaskadowe

### Callbacki
- `addLog(text, type)` — dodaje wpis z timestampem + odtwarza dźwięk
- `spawnThreat(type, targetId)` — tworzy nowe zagrożenie (start position losowa)
- `launchScenario(index)` — 4 predefiniowane scenariusze
- `activatePlaybook(id, name)` — uruchamia procedurę (SIREN/ALERT_SMS/BACKUP_GEN)
- `handleReset()` — resetuje wszystko do stanu początkowego
- `handleNodeClick(node)` — zaznacza i leci do węzła
- `handleAddNode(newNode)` — dodaje węzeł
- `handleAddRelation(newRel)` — dodaje relację
- `handleActivateBackupPower(nodeId)` — ręczne załączenie generatora
- `handleResetCooling()` — reset chłodzenia (OBJ_02)
- `handleResetWater()` — reset pomp (OBJ_03)
- `handleRemoveSystem(sysId)` — demontaż systemu obronnego
- `handleToggleLayer(key)` — toggle warstwy mapy

### useEffect'y
1. Ładowanie basemap z localStorage
2. Zapis basemap do localStorage
3. Ładowanie theme z localStorage
4. Sync theme → body class + localStorage
5. Ładowanie nodes/relations z localStorage
6. Zapis nodes do localStorage
7. Zapis relations do localStorage
8. Sync simStateRef (dla Cesium → unikanie closure stale values)
9. Zegar (1s interwał)
10. Resize Cesium viewer przy toggle schema

### symStateRef
- `MutableRefObject<SimState>` — zawsze aktualny snapshot stanu dla `useCesiumViewer` (przekracza problem zamknięcia w closure)

---

## Routing

Single-page application. Jedna ścieżka:
- `/` → `app/page.tsx` → `SteelSentinelDashboard`

Brak API routes, dynamic routes, nested layouts.

---

## Interakcje klawiszowo-myszowe

- **Mouse move** na Cesium canvas: throttled (80ms) → aktualizacja HUD z GPS/alt/az
- **Left click** na Cesium canvas:
  - Bez wybranej broni: entity picking (node/system selection)
  - Z wybraną bronią: deploy systemu w kliknięte miejsce
- **Drag** na ObjectDetailCard: przesuwanie panelu
- **Double click** na ObjectDetailCard: reset pozycji do domyślnej

---

## Motywy (CSS)

Zdefiniowane w `globals.css` przez CSS custom properties:

| Właściwość | Light | Dark |
|---|---|---|
| `--bg-app` | #f8fafc | #020617 |
| `--bg-panel` | rgba(255,255,255,0.96) | rgba(10,15,30,0.96) |
| `--border-panel` | #cbd5e1 | #1e293b |
| `--text-primary` | #0f172a | #e2e8f0 |
| `--neon-cyan` | #0891b2 | #06b6d4 |

Klasy pomocnicze: `theme-bg-app`, `theme-bg-panel`, `theme-border`, `theme-text-primary`, `theme-neon-text`, `theme-neon-border`, itd.
Transition 300ms na wszystkich właściwościach.

### clip-chamfer
- `clip-path` wielokątny (8-punktowy) → ścięte rogi militarny styl
- `::before` → border (1 warstwa)
- `::after` → tło panelu z backdrop-filter (1 warstwa)
- Działa jak border-radius ale z militarnym wyglądem

### Fonty
- Rajdhani: nagłówki, etykiety (sans-serif, techniczny)
- Share Tech Mono: dane telemetryczne, monospace
- JetBrains Mono: główny font body

---

## Scenariusze ataku

| Scenariusz | Zagrożenia | Opis |
|---|---|---|
| SCEN_01 | 3x DRONE na OBJ_01, OBJ_04, OBJ_03 | Rój dronów rozpoznawczych |
| SCEN_02 | 2x SHAHED na OBJ_02, OBJ_06 | Amunicja krążąca korytem Sanu |
| SCEN_03 | 1x MISSILE na OBJ_01 | Taktyczny pocisk rakietowy |
| SCEN_04 | MISSILE(OBJ_02) + SHAHED(OBJ_04) + DRONE(OBJ_03) | Atak kombinowany saturacyjny |

---

## Playbooki (Procedury alarmowe)

| Playbook | Efekt |
|---|---|
| SYRENY ALARMOWE | Log: "Miejskie syreny akustyczne nadają sygnał alarmowy" + dźwięk sawtooth 320Hz |
| ALERTY SMS RCB | Log: "Rozesłano kryzysowy komunikat SMS" + dźwięk sine 480Hz |
| START GENERATORÓW | Wszystkie węzły dostają `backupPower: true` + dźwięk success |

---

## Łańcuchy kaskadowe

```
OBJ_02 (Elektrownia) zniszczona
  → OBJ_01 (Huta): health spada do 15% (brak zasilania)
  → OBJ_03 (Woda): drenaż rezerw 12h (brak zasilania pomp)

OBJ_03 (Woda) zniszczona (lub wyczerpanie rezerw)
  → OBJ_02 (Elektrownia): wygaszanie turbiny w 6s (brak chłodzenia)

OBJ_04 (GPZ Maziarnia) zniszczony
  → OBJ_07 (Centrum Kryzysowe): health spada do 40%
```

---

## Uruchamianie

```bash
npm run dev     # next dev (deweloperski)
npm run build   # next build (produkcyjny)
npm run start   # next start (produkcyjny)
npm run lint    # eslint
```

---

## Pliki modeli 3D (public/3d_models/)

| Plik | Opis |
|---|---|
| `fpv_drone.glb` | Dron FPV (zagrożenie) |
| `iranian_shahed-136_military_drone.glb` | Shahed-136 (zagrożenie) |
| `patriot.glb` | MIM-104 Patriot PAC-3 (sojuszniczy) |
| `pilica.glb` | PSR-A Pilica VSHORAD (sojuszniczy) |

---

## Uwagi techniczne

- CesiumJS ładowany z CDN (nie npm) — dostępny jako `window.Cesium`
- Next.js w wersji 16 — sprawdzać `node_modules/next/dist/docs/` przed pisaniem kodu (zgodnie z AGENTS.md)
- Tailwind v4 — nowa składnia: `@import "tailwindcss"` (brak pliku konfiguracyjnego)
- Wszystkie interfejsy w jednym pliku `types/index.ts`
- Brak plików CSS modules — wszystkie style w `globals.css` + Tailwind utility classes
- `three` jest zainstalowane ale nie importowane bezpośrednio w żadnym pliku źródłowym (dependency fiber/drei)
