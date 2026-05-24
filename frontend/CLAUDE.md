# STEEL SENTINEL — CLAUDE.md
## Tactical Common Operational Picture (COP) — Command & Control Dashboard

---

## ARCHITEKTURA APLIKACJI

Aplikacja jest w przeważającej części samodzielnym dashboardem typu C2 (Command & Control) zbudowanym na Next.js 16 (App Router). Całość stanu symulacji zarządzana jest przez React `useState`, a dane są statyczne (hardcoded) z persystencją do `localStorage`. **Wyjątek:** moduł STRATEG AI używa server-side API routes (`/api/strateg/*`) do wywołań OpenAI z kluczem chronionym w `.env.local` (zob. sekcja „STRATEG AI" poniżej).

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
| Google Fonts | — | Inter (UI) + JetBrains Mono (dane/liczby) — CDN |
| ai | ^6.0 | Vercel AI SDK — streaming structured outputs (STRATEG AI) |
| @ai-sdk/openai | ^3.0 | OpenAI provider dla AI SDK (gpt-4o vision) |
| zod | ^4.4 | Walidacja request/response + schematy Structured Outputs |

### Persystencja (localStorage)

| Klucz | Zawartość |
|---|---|
| `sentinel_nodes` | Tablica węzłów krytycznych (dodawanie/edycja węzłów) |
| `sentinel_relations` | Tablica relacji między węzłami |
| `sentinel_node_positions` | Pozycje węzłów w widoku DependencyFlow |
| `spaceshield_detail_card_pos` | Pozycja okienka ObjectDetailCard |
| `steel-sentinel-theme` | Motyw (`light` / `dark`) |
| `steel-sentinel-basemap` | Typ podkładu mapy (`standard` / `satellite` / `topo`) |

### Zmienne środowiskowe (`.env.local`)

| Klucz | Wymagany | Opis |
|---|---|---|
| `OPENAI_API_KEY` | tak (dla STRATEG AI) | Klucz OpenAI używany server-side w `/api/strateg/*`. NIE z prefiksem `NEXT_PUBLIC_`. |
| `STRATEG_MODEL` | nie | Override modelu (default: `gpt-4o`). Można podmienić na `gpt-4o-mini` w testach. |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | opcjonalnie | Token Cesium ion (Google Photorealistic 3D Tiles). |

`.env.example` w repo trzyma szablon — `.env.local` jest w `.gitignore`.

---

## SYSTEM DESIGNU (v2 — soft SaaS / Linear-inspired)

Wizualny + interakcyjny kontrakt jakiego każdy nowy komponent MUSI przestrzegać. Język wizualny to **soft modern SaaS dashboard** (referencja: Linear, Notion, Knowledge-app) — NIE tactical/military hard-edge. DefenseTech gravitas idzie przez treść (terminologia, struktura danych, eskalacja statusu), nie przez ostre wizualne dekoracje.

### Twarde zasady — NIE łamać

1. **Żadnych ikon w listach/kartach jako wskaźnik typu/kategorii.** Generyczne ikony lucide (Zap, Droplet, Shield, Flame…) NIE działają jako oznaczenie kategorii w karcie. Tożsamość przekazuje **typografia (callsign OBJ_01 · Przemysł) + StatusPill w prawym górnym rogu**. Żadnych dekoracyjnych pasków statusu po lewej stronie karty.
   - Ikony DOZWOLONE tylko w: małym eyebrow nagłówka sekcji, w buttonach (interakcyjnie), w brand mark.
   - Reguła zapisana w pamięci: `feedback_no_category_icons.md`.
2. **Żadnych ikon w obwódkach.** Nigdy nie owijaj ikony w pojemnik z bordersem (nawet neutralnym). Ikona stoi sama, kolorem na surowej powierzchni. Reguła: `feedback_no_tone_on_tone_icons.md`.
3. **Żadnego tone-on-tone.** Nigdy bg-{tone}-soft + border-{tone}/40 + text-{tone} jednocześnie. Jeden kolor per element.
4. **Sentence case wszędzie.** „Scenariusze ataku" nie „SCENARIUSZE ATAKU". Nie używaj `tracking-widest`. CAPS tylko dla micro-labels rzadko.
5. **Soft surfaces.** Panel radius `14–24px` (--r-md / --r-lg / --r-xl). Hairline borders (rgba ~6%). Padding `p-4 / p-5` (NIE `p-2.5`). Soft shadows (low opacity, duży blur).
6. **Color sparingly.** 90% interfejsu neutralny. Akcent (cyan) tylko dla: active states, primary CTA, focus rings. Status colors tylko dla rzeczywistego statusu (ok/warn/error/critical/info).
7. **Anti-AI-slop.** Algorytmiczna jednorodność (4 identyczne karty pod sobą) jest odrzucana. Łam hierarchię: 1 hero + N secondary. Jeden panel hand-crafted.
8. **Jeden Dialog dla wszystkich modali.** Add Object, Add Relation, Relocation Confirmation, każdy przyszły modal — wszystkie używają `<Dialog>` z `app/ui/`. Spójny backdrop blur, slide-down anim, ESC + click-outside zamyka, header (eyebrow + title + X) + body + footer slot.
9. **Collapsed ≠ Expanded wizualnie.** Kiedy panel collapsible jest zwinięty, renderuj **kompaktowy pasek-tab** (`px-4 py-2.5`, `rounded-(--r-md)`, `elev-1`, single-line) zamiast pełnej Panel-karty. Drastycznie oszczędza miejsce. Logger + ThreatMonitor domyślnie zwinięte.

Reguły wizualne są również utrwalone w `~/.claude/projects/.../memory/`:
- `feedback_visual_language_soft_saas.md` — soft SaaS aesthetic
- `feedback_no_category_icons.md` — brak ikon w listach
- `feedback_no_tone_on_tone_icons.md` — brak tone-on-tone

### Tokeny (zdefiniowane w `app/globals.css`)

**Typografia** — używana jako CSS klasy (`text-micro`, `text-caption`, `text-body`, etc.):

| Klasa | Rozmiar | Waga | Użycie |
|---|---|---|---|
| `text-micro` | 11px | 500 | Etykiety pomocnicze, eyebrows |
| `text-caption` | 12px | 400 | Pomocniczy tekst, opisy w kartach |
| `text-body` | 14px | 400 | Body tekst, default |
| `text-label` | 12px | 500 | Małe etykiety (rzadko CAPS) |
| `text-data` | 13px | 500 | Liczby/koordynaty (JetBrains Mono, tabular-nums) |
| `text-heading` | 15px | 600 | Tytuły kart, headery wewnętrzne |
| `text-title` | 18px | 600 | Tytuły paneli, modali |
| `text-display` | 28px | 700 | DEFCON number, hero numbers |

Color utilities: `text-primary` / `text-secondary` / `text-muted` / `text-accent` / `text-ok` / `text-warn` / `text-error` / `text-critical` / `text-info`.

**Surfaces** — semantyczne tła:
- `bg-canvas` — tło aplikacji (gradient w body)
- `bg-surface-1` — domyślna karta/panel
- `bg-surface-2` — floating panel z elevation
- `bg-surface-3` — modal
- `bg-surface-data` — sunken wells (inputs, data boxes)
- `bg-surface-hover` — hover state

**Borders** — `border-subtle` (hairline ~6% alpha) / `border-strong` (~10%) / `border-accent` / `border-{tone}`.

**Radii**: `--r-sm: 8px` / `--r-md: 14px` / `--r-lg: 20px` / `--r-xl: 24px` / `--r-pill: 999px`. Używaj jako `rounded-(--r-md)` (Tailwind v4 canonical).

**Elevations**: `elev-1` (resting) / `elev-2` (floating panel) / `elev-3` (modal).

**Status colors**: `--ok` (zielony) / `--warn` (amber) / `--error` (czerwony) / `--critical` (jasny czerwony) / `--info` (niebieski). Plus każdy `*-soft` (~10% alpha) jako tło.

**Motion**: `--dur-fast: 140ms` / `--dur-base: 220ms` / `--dur-slow: 360ms`. Easing: `--ease-out` / `--ease-snap`.

**Fonty**: `--font-sans` = Inter, `--font-mono` = JetBrains Mono. Inter dla całego UI, mono tylko dla numerycznych danych (GPS, timestamps, kbd hints).

### Prymitywy UI (`app/ui/`)

Wszystkie komponenty domain-specific (`app/components/`) MUSZĄ używać tych prymitywów. Nie reimplementuj — rozszerzaj.

| Plik | API (skrócone) | Cel |
|---|---|---|
| `Panel.tsx` | `<Panel variant="solid\|ghost\|floating\|data" rounded="md\|lg\|xl" density="compact\|regular\|comfortable">` | Bazowy kontener karty. Wszystkie panele używają `variant="floating" rounded="xl"`. |
| `SectionHeader.tsx` | `<SectionHeader title eyebrow badge actions collapsible emphasis="regular\|hero">` | Header panelu z opcjonalnym eyebrow + badge + collapsible. |
| `StatusPill.tsx` | `<StatusPill tone="ok\|warn\|error\|critical\|info\|accent\|neutral" size="xs\|sm\|md" dot pulse icon>` | Pill statusu z opcjonalną kropką + animacja. |
| `Button.tsx` | `<Button variant="primary\|secondary\|ghost\|danger\|success\|warning" size="sm\|md\|lg" icon iconRight kbd fullWidth active loading>` | Wszystkie przyciski. Kbd hint inline. |
| `IconButton.tsx` | `<IconButton icon variant="ghost\|solid\|accent" size="sm\|md" active tooltip>` | Square icon-only button. |
| `HealthBar.tsx` | `<HealthBar value label size="xs\|sm\|md" showValue>` | Pasek zdrowia (ok/warn/error tone wg progu). |
| `DataField.tsx` | `<DataField label value hint format="mono\|text" orientation="row\|col" align>` | Para label/value dla danych. |
| `Toggle.tsx` | `<Toggle checked onChange label description icon size tone>` | Pill toggle z opcjonalnym labelem. |
| `Kbd.tsx` | `<Kbd>Q</Kbd>` | Klawisz w boxie. |
| `Coachmark.tsx` | `<Coachmark storageKey hideWhen title steps footer position>` | Floating onboarding helper. |
| `Dialog.tsx` | `<Dialog open onClose title eyebrow width="sm\|md\|lg" footer closeOnBackdrop closeOnEscape showCloseButton>` | **Jedyny modal w aplikacji.** Backdrop blur, slide-down, ESC + click-outside, ARIA modal. |

Eksport zbiorczy: `import { Panel, Button, StatusPill, Dialog, ... } from "../ui";`

### Layout (fixed positioning — single page)

```
┌──────────────────────────────────────────────────────┐
│ Header   top-3 left-3 right-3   h-14   elev-2        │  ← floating
├──────────────────────────────────────────────────────┤
│ AlertTicker   top-19 left-3 right-3   h-9            │  ← floating
├──────────┬────────────────────────┬──────────────────┤
│ LEFT     │                        │ RIGHT            │
│ left-3   │                        │ right-3          │
│ top-32   │        CESIUM 3D       │ top-32           │
│ bottom-24│        (cały viewport) │ bottom-24        │
│ w-80     │                        │ w-80             │
│ ↓        │                        │ ↓                │
│ Obiekty  │                        │ Scenariusze      │
│ Wykryte  │                        │ Arsenał          │
│ cele     │                        │ Konsola          │
├──────────┴────────────────────────┴──────────────────┤
│            TelemetryHUD (centered pill)  bottom-4    │
└──────────────────────────────────────────────────────┘
```

- Wszystkie kolumny `fixed` z `z-40+`
- Wewnątrz kolumn: `flex flex-col gap-3 h-full min-h-0 overflow-y-auto scroll-thin pr-1`
- Brak `pointer-events-none` warstwy (rozwala scroll wheel)
- `scrollbar-gutter: stable` w `.scroll-thin` żeby nie skakała treść

### Konwencja Dialog

WSZYSTKIE modale (Add Object, Add Relation, Relocation Confirmation, przyszłe) używają `<Dialog>`:

```tsx
<Dialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  eyebrow="Lewy panel"
  title="Nowy obiekt strategiczny"
  width="md"
  footer={
    <>
      <Button variant="ghost" onClick={onClose}>Anuluj</Button>
      <Button form={formId} type="submit" variant="primary">Zapisz</Button>
    </>
  }
>
  <form id={formId} onSubmit={handleSubmit}>...</form>
</Dialog>
```

- Backdrop: `bg-black/40 backdrop-blur-sm`
- Card: `bg-surface-2 rounded-(--r-xl) elev-3` z `anim-slide-down`
- Header: `eyebrow + title + X button` w stałej strukturze
- Body: `overflow-y-auto scroll-thin px-6 pb-5`
- Footer: opcjonalny, z górnym separator + `bg-surface-1`
- ARIA: `role="dialog" aria-modal="true"`

### Skróty klawiszowe (`useKeyboardShortcuts` hook)

| Klawisz | Akcja |
|---|---|
| `1` `2` `3` `4` | Uruchom scenariusz 1–4 |
| `Q` `W` `E` `R` | Wybierz broń (PILICA / WRE / RADAR / PATRIOT) |
| `Space` | Pauza / wznów symulację |
| `Esc` | Anuluj wybór broni / zamknij modal / anuluj relokację |
| `Shift+R` | Reset całej symulacji |
| `S` | Toggle widoku schematu sieci |
| `M` | Otwórz katalog 3D modeli |
| `A` | Toggle panelu STRATEG AI |

Hook ignoruje zdarzenia gdy focus jest w `input/textarea/select/contenteditable` (z wyjątkiem `Esc`).

### Co JEST zrobione (v2) vs co ZOSTAŁO stare

✅ **Zrobione w v2**: tokeny, prymitywy w `app/ui/`, Header, AlertTicker, LeftSidebar, NodeList (+ AddNode/AddRelation dialogs), ScenariosPanel (hero+secondary), ArsenalPanel, ThreatMonitor, CommandLogger, TelemetryHUD, ObjectDetailCard, DefconOverlay, Coachmark, Relocation Dialog.

⏳ **Wciąż w starym stylu** (do refaktoru gdy zacznie być widoczne / wymagane):
- `DependencyFlow.tsx` — pełnoekranowy graf (tryb `S`)
- `ThreatModelViewer.tsx` — modal katalogu 3D (tryb `M`)
- `CascadeGraph.tsx`, `PlaybookControls.tsx`, `CollapsibleCard.tsx` — istnieją ale nie są używane w głównym layoucie
- **Markery na mapie Cesium** w `useCesiumViewer.ts` (1455 linii) — cylindry/beacony/labels w starym tactical-mocnym stylu. Wymaga dedykowanej sesji.

### Backward-compat (CSS legacy klas)

`globals.css` trzyma żywe (aliasowane do nowych tokenów):
- `theme-bg-app` / `theme-bg-panel` / `theme-border` / `theme-text-*` / `theme-neon-*`
- `font-rajdhani` / `font-sharetech` / `font-jetbrains` → wszystko `var(--font-sans)` lub `var(--font-mono)`
- `clip-chamfer` → neutralized do `border-radius: var(--r-md)`, bez clip-path

Te aliasy istnieją żeby niezmigrowane komponenty (np. `DependencyFlow`, markery Cesium) nadal działały. NOWY kod używa wyłącznie nowych tokenów (`bg-surface-1`, `border-subtle`, etc.).

---

## Typy (app/types/index.ts)

- `CriticalNode` — węzeł infrastruktury krytycznej (id, name, lat, lon, type, description, health %, status, backupPower, notes)
- `WeaponSystem` — definicja systemu obronnego (type, name, range, color, colorHex, description, threatsCovered)
- `DeployedSystem` — zainstalowany system na mapie (id, type, name, lat, lon, radius, color, status?, relocationSecondsLeft?, targetLat?, targetLon?)
- `ThreatType` — typ zagrożenia (type, name, speed, alt, description, immuneToWRE)
- `Threat` — aktywne zagrożenie (id, type, name, startLat/Lon, lat/lon, alt, targetId, pathType, progress, status, health)
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
- Parametry: frequency (Hz), waveform type, duration
- No-op gdy `soundEnabled === false`
- Łapie wyjątki związane z autoplay blocking (try/catch)

### useCascadingEngine.ts
- 1-sekundowy `setInterval`
- Główna pętla awarii kaskadowych:
  - Elektrownia (OBJ_02) zniszczona/degradowana → Huta traci zasilanie (health spada do 15%) + Ujęcie wody traci pompy (drenaż rezerw 12h)
  - Woda (OBJ_03) zniszczona/wyczerpanie → Elektrownia traci chłodzenie (6-sekundowe wygaszanie turbiny)
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

### useCesiumViewer.ts (~1455 linii — największy plik)
Serce aplikacji. Inicjalizuje i zarządza CesiumJS Viewer.

**Inicjalizacja:**
- Tworzy `Cesium.Viewer` z wyłączonymi wszystkimi kontrolkami UI
- Ustawia kamerę na Stalową Wolę z wysokości ~4500m
- Dodaje `PolylineCollection` dla laserów
- Renderuje rzekę San (glow + core + label)
- Dodaje `ScreenSpaceEventHandler` dla mouse move (throttled 80ms) i left click

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

**Relokacja systemów (przeciąganie):**
- `startRelocationDrag(sysId)` — tworzy ghost entities (model, dome, label) podążające za kursorem
- `MOUSE_MOVE` — aktualizuje pozycję ghost entities
- `LEFT_CLICK` w trybie relokacji → wywołuje `onConfirmRelocationPosition`
- `cancelRelocationDrag()` — czyści ghost entities
- `drawDeployedSystem(sys)` — przerysowuje system (używane przy aktualizacji statusu RELOCATING)

**Pętla symulacji (requestAnimationFrame):**
- Porusza zagrożenia po ścieżkach (DIRECT lub RIVER)
- Dla Shahed: nawigacja wzdłuż SAN_RIVER_COORDS + bank approach
- Sprawdza odległość do systemów obronnych (pomija systemy z statusem RELOCATING)
- Rysuje lasery (PolylineCollection: glow outer + solid inner)
- Aplikuje obrażenia (PILICA: 0.9, PATRIOT: 1.8, WRE: 2.5)
- Na zniszczeniu: usuwa encję, loguje combat, zmienia status
- Na impakcie (progress ≥ 1.0): niszczy target node

**Entity picking (drillPick):**
- `drillPick` przebija przez przezroczyste kopuły
- Priorytetyzuje modele/beacony/towers nad domami
- Rozpoznaje entity po ID: OBJ_* (node), SYS_* (system), suffix _model/_tower/_beacon
- Kliknięcie w cluster indicator → flyTo nad miasto

**Zmiana podkładu mapy:**
- Standard: CartoDB (light/dark w zależności od theme)
- Satellite: Esri World Imagery
- Topo: Esri World Topo Map

**Cluster indicator:**
- Gdy kamera oddali się >28km → pokazuje zgrupowanie obiektów
- Klikalny, zlicza obiekty + systemy

---

## Komponenty (app/components/)

> Wszystkie komponenty domain-specific MUSZĄ konsumować prymitywy z `app/ui/` i przestrzegać twardych zasad z sekcji „System Designu". Stare wzorce (CollapsibleCard, ikony w obwódkach, paski statusu po lewej, monospace eyebrowy, CAPS) są deprecated.

### Header.tsx — `v2 soft`
- Floating: `fixed top-3 left-3 right-3 h-14`, `bg-surface-1 elev-2 rounded-(--r-lg)`
- Brand: monochrom kafelek "S" (bg `var(--text-1)`, biała litera) + „Steel Sentinel" sentence-case + sub-line „Stalowa Wola · Digital Twin"
- DEFCON: `text-display` 28px + StatusPill tone wg poziomu (`ok / info / warn / error / critical`)
- Spacer · UTC clock (text-data, mono, tabular)
- IconButton x4: schemat (S), katalog 3D (M), theme toggle, sound toggle
- Brak CAPS, brak gradientów

### DefconOverlay.tsx — `v2 soft`
- Pojawia się przy zmianie DEFCON, auto-hide 6s lub ESC/X
- Pojedyncza pill-card (`bg-surface-2 elev-3 rounded-(--r-lg)`) z anim-slide-down
- Vignette tylko dla DEFCON ≤ 2 (czerwona inset shadow z anim-pulse)
- Treść: kropka statusu + eyebrow „Zmiana stanu gotowości" + heading „DEFCON N · {nazwa}"

### AlertTicker.tsx — `v2 soft`
- Floating: `top-19 left-3 right-3 h-9`, `rounded-(--r-md)`
- Tryb spokojny: `bg-surface-1`, "Tactical feed" + ticker treść
- Tryb alarmowy: `bg-error-soft`, kropka anim-pulse + "Alarm bojowy · N aktywne" + ticker treść
- Bez emoji, sentence case

### CesiumViewport.tsx
- Container `<div>` dla CesiumJS canvas (fullscreen, z-index niżej niż panele)
- Obsługuje split-screen (fade-out gdy schema mode enabled)

### LeftSidebar.tsx — `v2 soft`
- `<Panel variant="floating" rounded="xl">` z header (eyebrow „Lewy panel" + title „Obiekty chronione")
- Badge: StatusPill OK/warn/error z liczbą węzłów
- Przycisk collapse (ChevronLeft/Right) — gdy zwinięty: szerokość `w-14`, panel jest pusty (tylko ikona)
- Wewnątrz: `NodeList`

### NodeList.tsx — `v2 soft` (przepisane)
- Brak ikon typu w kartach (zasada 1)
- Karta: `bg-surface-data` (lub `bg-accent-soft` jeśli selected, `bg-surface-hover` jeśli hovered, lub `border-{tone}/40` jeśli DEGRADED/DESTROYED)
- Layout: eyebrow „OBJ_01 · Przemysł" (text-micro muted) + tytuł `text-heading` + StatusPill prawy górny + HealthBar bez wartości + opcjonalny opis
- Cross-highlight: `onMouseEnter/Leave` → `onHoverNode(id)` (propagowane do mapy w przyszłości)
- **Add Object / Add Relation**: dwa buttony ghost → otwierają osobne komponenty `AddNodeDialog` / `AddRelationDialog` (wewnątrz tego samego pliku) używające `<Dialog>` prymitywu z `app/ui/`
- Formularze wewnątrz Dialog: każde pole owinięte w `Field` wrapper (text-micro label + input)

### ScenariosPanel.tsx — `v2 soft` (NOWY, wydzielony z ArsenalPanel)
- `<Panel variant="floating" rounded="xl">` z headerem „Symulacja · Scenariusze ataku" + StatusPill (LIVE/Pauza/Gotowy)
- **Hero card** — recommended demo (scenariusz #4): `bg-(--text-1) text-(--canvas)` dark slate card z eyebrow „Rekomendowane" + tytuł + krótki opis + biały pill button „Uruchom demo" + Kbd `4` + duration `~70 s`
- **Secondary list** — 3 mniejsze pozycje (rói dronów / Shahed / rakieta) jako proste rzędy z Kbd + nazwa + hint + duration
- Footer: `Reset` (ghost) + `Pauza/Wznów` (ghost, active gdy paused)

### ArsenalPanel.tsx — `v2 soft` (slim, tylko 4 broń)
- `<Panel variant="floating" rounded="xl">` z headerem „Rozstawianie · Arsenał obronny" + StatusPill (tryb celowania / N na pozycji / 0)
- Gdy `armed`: pasek `bg-accent-soft` „Kliknij na mapie 3D, aby rozstawić" + Kbd Esc
- 4 rzędy broni: Kbd po lewej (Q/W/E/R) + nazwa + zasięg + opis + licznik `Nx` lub kolorowa kropka brand-color (no tone-on-tone!)
- Brak ikon, brak kart-w-kartach

### ThreatMonitor.tsx — `v2 soft, dual-state`
- Domyślnie **collapsed**: kompaktowy pasek `bg-surface-1 elev-1 rounded-(--r-md)` z chevron + „Wykryte cele" + status pill „N aktywne" lub „brak echa"
- Expanded: pełna `<Panel>` z listą zagrożeń (Threat name + → target + StatusPill statusu)
- Empty state: „Niebo czyste — brak aktywnych ech radarowych"

### CommandLogger.tsx — `v2 soft, dual-state`
- Domyślnie **collapsed**: kompaktowy pasek z chevron + „Dziennik zdarzeń" + licznik wpisów
- Expanded: pełna `<Panel>` z scrollowanymi logami (`max-h-48`)
- Wpisy: `text-data` timestamp + treść w kolorze typu (error/warn/success/combat/info)
- Migający kursor (`anim-blink`) na końcu

### TelemetryHUD.tsx — `v2 soft`
- Floating pill bar: `fixed bottom-4 center-x`, `rounded-(--r-pill) bg-surface-2 elev-2`
- Sekcje rozdzielone pionowymi `w-px` dividerami: Pozycja kursora · Alt · Az · IconButton warstw
- IconButton warstw → otwiera popover panel z 5 Toggle'ami (Obiekty / Kopuły / Wektory zagrożeń / Powiązania / Hydrologia) + selector podkładu (Mapa / Satelita / Topo)
- Toggle'i bez ikon (sentence-case label + pill switch)

### ObjectDetailCard.tsx — `v2 soft` (przepisane)
- Dragowalny floating panel (pointer events, clamped do okna, double-click reset)
- Pozycja w `localStorage` (`spaceshield_detail_card_pos`)
- `<Panel variant="floating" rounded="xl">` z header (eyebrow „OBJ_xx · Typ" + tytuł + RotateCcw reset position + X close)
- **Tryb Node**: StatusPill + GPS (text-data) + HealthBar etykietowana + opis + notatki (`bg-warn-soft`) + mapa zależności kaskadowych (`bg-surface-data` z text-warn dla połączonych obiektów) + alerty cooling/water (`bg-error-soft`) + akcje (Namierz GPS / Uruchom generator)
- **Tryb System**: StatusPill (Aktywny / W marszu) + GPS + box `bg-surface-data` z zasięgiem i celami + akcje (GPS / Przemieść / Demontuj)
- Tryb relokacji (drag aktywny): `bg-warn-soft` info box + Anuluj
- Wszystkie ikony tylko w buttonach (nigdzie jako kategoria)

### CascadeGraph.tsx — `legacy`
- SVG graf zależności (E2, H1, W3, G4, K7) — istnieje w repo, ale **nie jest używany w głównym layoucie** v2 (info kaskadowe pokazuje się w ObjectDetailCard)

### PlaybookControls.tsx — `legacy`
- 3 przyciski procedur (SYRENY / SMS / GENERATORS) — istnieje w repo, **nie jest używany w głównym layoucie** v2 (BACKUP_GEN dostępne jako przycisk w ObjectDetailCard)

### CollapsibleCard.tsx — `legacy / DEPRECATED`
- Stary wrapper zwijanej karty (chevron + badge + maxHeight transition)
- Nie używać w nowym kodzie — zastąpiony przez `<SectionHeader collapsible>` z `app/ui/` + custom dual-state render w komponencie (jak `ThreatMonitor`, `CommandLogger`)

### DependencyFlow.tsx — `legacy` (do refaktoru gdy potrzebne)
- Pełnoekranowy widok schematu blokowego z @xyflow/react (tryb `S`)
- Custom węzły `CriticalNodeCard`, drag-and-drop, krawędzie paraboliczne
- Wciąż używa starych klas `theme-*` — refactor odłożony

### ThreatModelViewer.tsx — `legacy` (do refaktoru gdy potrzebne)
- Pełnoekranowy modal z Three.js katalogiem 4 modeli GLB (tryb `M`)
- Panel info + katalog środków przeciwdziałania
- Wciąż w starym tactical-cyan stylu — refactor odłożony

### Coachmark.tsx (`app/ui/`)
- Floating onboarding helper „Pierwsze kroki"
- Storage key (sessionStorage) — pokazuje się raz na sesję
- `hideWhen` — auto-ukrywa gdy user wykonał akcję (np. spawnował zagrożenie, kliknął obiekt)
- Renderuje numerowane kroki (neutral kółka, nie accent — żeby nie tone-on-tone)

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
- `isRelocationDragging` — czy trwa przeciąganie systemu po mapie
- `relocationConfirmation` — dane potwierdzenia marszu (sysId, lat, lon, distance, seconds, realTime)

### Callbacki
- `addLog(text, type)` — dodaje wpis z timestampem + odtwarza dźwięk
- `calculateDistanceKm(lat1, lon1, lat2, lon2)` — helper odległości (Haversine)
- `formatRealTime(distanceKm, type)` — formatuje czas marszu dla demo
- `spawnThreat(type, targetId)` — tworzy nowe zagrożenie (start position od wschodu)
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
- `handleConfirmRelocationPosition(sysId, lat, lon)` — przygotowuje potwierdzenie marszu
- `handleRelocateSystem(sysId, lat, lon, seconds)` — rozpoczyna relokację

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
10. Relocation countdown tick (1s interwał dla systemów z status RELOCATING)
11. Resize Cesium viewer przy toggle schema

### simStateRef
- `MutableRefObject<SimState>` — zawsze aktualny snapshot stanu dla `useCesiumViewer`

---

## Routing

Single-page application. Jedna ścieżka:
- `/` → `app/page.tsx` → `SteelSentinelDashboard`

Brak API routes, dynamic routes, nested layouts.

---

## Interakcje klawiszowo-myszowe

**Mysz / pointer**
- **Mouse move** na Cesium canvas: throttled (80ms) → aktualizacja HUD z GPS/alt/az + pozycja ghost relokacji
- **Left click** na Cesium canvas:
  - Tryb relokacji: wywołuje `onConfirmRelocationPosition` (otwiera `Dialog` potwierdzenia marszu)
  - Bez wybranej broni: entity picking (node/system selection) z drillPick
  - Z wybraną bronią: deploy systemu w kliknięte miejsce
- **Hover** na karcie w NodeList → wywoła `onHoverNode(id)` (przyszły hook do glow markera na mapie)
- **Drag** na ObjectDetailCard: przesuwanie panelu
- **Double click** na ObjectDetailCard: reset pozycji do domyślnej
- **Click backdrop** modalu (Dialog): zamyka (chyba że `closeOnBackdrop={false}`)

**Klawiatura** (kompletna lista — patrz sekcja „Skróty klawiszowe" w System Designu)
- `1` `2` `3` `4` — uruchom scenariusze 1-4
- `Q` `W` `E` `R` — wybierz broń (PILICA / WRE / RADAR / PATRIOT)
- `Space` — pauza / wznów symulację
- `Esc` — kaskadowo: anuluj wybór broni → anuluj relokację → zamknij modal → zamknij DefconOverlay → odznacz selectedNode/selectedSystem
- `Shift+R` — reset całej symulacji
- `S` — toggle widoku DependencyFlow
- `M` — otwórz ThreatModelViewer

Hook `useKeyboardShortcuts` ignoruje zdarzenia gdy focus jest w `input/textarea/select/contenteditable` (poza `Esc`).

---

## Motywy

Tokeny + utility klasy + reguły wizualne są opisane w sekcji **SYSTEM DESIGNU (v2)** na początku tego pliku. Jedno źródło prawdy — nie powielać tutaj.

Klasy starsze (`theme-*`, `clip-chamfer`, `font-rajdhani`, `font-sharetech`) zostały zachowane jako backward-compat aliasy → tokeny v2 (`bg-canvas`, `border-subtle`, `var(--font-sans)`). NIE używać w nowym kodzie. Patrz „Backward-compat" w sekcji System Designu.

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

## Relokacja systemów obronnych

Systemy obronne można przemieszczać dwoma sposobami:

1. **Przeciąganie po mapie** (drag):
   - Kliknij PRZEMIEŚĆ w ObjectDetailCard → pojawia się ghost systemu podążający za kursorem
   - Kliknij w nowe miejsce → pojawia się modal z potwierdzeniem (dystans, czas marszu)
   - Zatwierdź → system przechodzi w status RELOCATING na 5s (demo) → wraca do OPERATIONAL na nowej pozycji
   - W trakcie relokacji system jest nieaktywny (nie zwalcza zagrożeń)

2. **Ręczne wpisywanie GPS** (w ObjectDetailCard):
   - Wpisz target lat/lon → automatyczna estymacja czasu marszu
   - Zatwierdź → ten sam mechanizm RELOCATING

Czas marszu w demo skrócono do 5s niezależnie od dystansu.

---

## STRATEG AI — vision-based defense architect

Pełnoprawny moduł AI oparty o GPT-4o (vision) realizujący 4-etapową pętlę planowania i red-teamu. Otwierany przyciskiem **"STRATEG AI"** w Headerze (skrót: `A`).

### Etapy pętli

| # | Etap | Co robi | Endpoint |
|---|---|---|---|
| 1 | **Ocena sytuacyjna** | Robi screenshot Cesium + serializuje stan; vision model identyfikuje wrażliwości i przewiduje wektory ataku. Po ukończeniu rysuje **pomarańczowe parabole** (predicted vectors) i **czerwone halo** wokół najbardziej narażonych węzłów. | `POST /api/strateg/assess` |
| 2 | **Plan obrony** | Strukturalna rekomendacja 3-6 deploymentów (typ + GPS + rationale) + playbooki + warstwowa strategia + ryzyko rezydualne. | `POST /api/strateg/plan` |
| 3 | **Rozstawienie** | Każda rekomendacja ma button „Rozstaw" lub „Rozstaw wszystko" (sekwencyjna animacja 350ms/sys). Wpina się w istniejący `setDeployedSystems` + `drawDeployedSystem`. | (klient) |
| 4 | **Red team + AAR** | AI wciela się w przeciwnika i generuje **scenariusz ataku dopasowany do luk w planie**. Po jego wykonaniu (waves spawnują się przez `spawnThreat` z `delaySeconds`), klient czeka aż wszystkie threats przejdą do INTERCEPTED/IMPACTED, po czym wywołuje streaming AAR. | `POST /api/strateg/redteam`, `POST /api/strateg/aar` |

### Struktura plików

```
app/
├── api/strateg/
│   ├── assess/route.ts    — streamObject + vision (image_url)
│   ├── plan/route.ts      — streamObject (strukturalny PlanSchema)
│   ├── redteam/route.ts   — streamObject (RedTeamScenarioSchema, temperature 0.7)
│   └── aar/route.ts       — streamText (markdown raport, temperature 0.5)
├── strateg/
│   ├── schemas.ts         — Zod schematy + typy (snapshot, assessment, plan, red team, AAR)
│   ├── prompts.ts         — SYSTEM_CONTEXT + 4 prompty (po polsku)
│   └── overlays.ts        — drawStrategOverlays / clearStrategOverlays / captureCesiumScreenshot
├── hooks/useStrategAgent.ts  — Hook state-machine, parsowanie partial JSON przez `parsePartialJson` z `ai`
└── components/StrategPanel.tsx — Right-side drawer (w-[460px]), 4 sekcje, postępy fazowe
```

### Strumieniowanie struktur

API routes używają `streamObject({ model: openai("gpt-4o"), schema, ... })` z AI SDK. Klient odbiera stream przez `fetch` + `ReadableStream`, akumuluje tekst i parsuje **partial JSON** progresywnie (`parsePartialJson` z `ai`). Dzięki temu UI renderuje karty rekomendacji „na żywo" zanim cała struktura dotrze.

### Wymagania środowiska

- `OPENAI_API_KEY` w `.env.local` (server-side only).
- Bez tego klucza endpointy zwracają `500 {"error":"OPENAI_API_KEY not configured on server."}`.
- Model można nadpisać przez `STRATEG_MODEL` (default `gpt-4o`).

### Integracja z istniejącą symulacją

- **Deploy:** `handleStrategDeploy({type, lat, lon})` konstruuje `DeployedSystem`, dodaje do `deployedSystems`, wywołuje `drawDeployedSystem(newSys)` — używa tej samej ścieżki renderingu co manualny click.
- **Red team waves:** `handleStrategLaunchWave({threatType, targetNodeId})` → `spawnThreat(type, targetId)`. Delaye `setTimeout` po stronie StrategPanel.
- **Overlays:** rysowane bezpośrednio na `viewerRef.current.entities` z prefiksem ID `STRATEG_OVERLAY_*`. Cleanup iteruje `viewer.entities.values` i usuwa po prefiksie.
- **Screenshot:** `viewer.scene.canvas.toDataURL("image/png")` → base64 bez prefixu, wysyłany jako `image_url` part w user message.

### Skrót klawiszowy

| Klawisz | Akcja |
|---|---|
| `A` | Toggle panelu STRATEG AI |

### Co STRATEG AI mówi (po polsku)

Wszystkie prompty wymuszają polski język w polach narracyjnych (summary, rationale, doctrine, reasoning, AAR). Techniczne ID (`OBJ_01`, `PILICA`, `SHAHED`) zostają verbatim. System prompt zna geografię miasta, korytarz Sanu, charakterystyki broni i zagrożeń.

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
- Entity picking na Cesium używa `drillPick` do przebijania przez przezroczyste kopuły
- `app/utils/` istnieje ale jest pusty
- `backend/` w katalogu nadrzędnym jest pusty
