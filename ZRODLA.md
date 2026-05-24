# Źródła danych — Steel Sentinel (Stalowa Wola Digital Twin)

Dokument zbiera wszystkie zewnętrzne źródła danych, treści i bibliotek wykorzystanych
w projekcie. Wartości liczbowe (zasięgi broni, prędkości zagrożeń, czasy kaskad) są
parametrami demo — bazują na otwartych publikacjach, ale nie odzwierciedlają danych
operacyjnych.

---

## 1. Dane geograficzne

### 1.1 Współrzędne obiektów krytycznych (OBJ_01 – OBJ_07)
Plik: [frontend/app/data/nodes.ts](frontend/app/data/nodes.ts)

Punkty zweryfikowane wzrokowo wobec:
- **OpenStreetMap** (https://www.openstreetmap.org) — geometria, adresy, nazwy ulic
- **Geoportal.gov.pl** — sprawdzenie lokalizacji infrastruktury (GPZ, węzeł kolejowy, most DK77)
- **Publiczne rejestry / strony operatorów**:
  - Huta Stalowa Wola S.A. — ul. Kwiatkowskiego 1 (https://hsw.pl)
  - PGE Energia Ciepła EC Stalowa Wola — ul. Energetyków 13 (https://pgeenergiaciepla.pl)
  - MZK Stalowa Wola — ujęcie brzegowe na Sanie (https://mzk.stalowawola.pl)
  - PKP PLK — stacja Stalowa Wola Rozwadów
  - GDDKiA — most na Sanie w ciągu DK77

### 1.2 Koryto rzeki San
Plik: [frontend/app/data/river.ts](frontend/app/data/river.ts)
- 8 waypointów odczytanych ręcznie z **OpenStreetMap** w okolicy Stalowej Woli
- Używane do renderowania linii rzeki na Cesium oraz do nawigacji Shahed (path=RIVER)

### 1.3 Centrum miasta
- `CENTER_LAT = 50.5826`, `CENTER_LON = 22.0530` — Urząd Miasta Stalowa Wola, ul. Wolności

---

## 2. Podkłady mapowe (tile providers)

Plik: [frontend/app/hooks/useCesiumViewer.ts](frontend/app/hooks/useCesiumViewer.ts#L1949-L1965)

| Tryb | Dostawca | URL |
|---|---|---|
| Standard (light) | **CartoDB Positron** | `basemaps.cartocdn.com/rastertiles/light_all` |
| Standard (dark) | **CartoDB Dark Matter** | `basemaps.cartocdn.com/rastertiles/dark_all` |
| Satellite | **Esri World Imagery** | `services.arcgisonline.com/.../World_Imagery` |
| Topo | **Esri World Topo Map** | `services.arcgisonline.com/.../World_Topo_Map` |
| 3D budynki (opc.) | **Google Photorealistic 3D Tiles** przez Cesium ion (`NEXT_PUBLIC_CESIUM_ION_TOKEN`) |
| Fallback 3D budynki | **OSM Buildings** (Cesium ion asset) |

Attribution dla każdego dostawcy renderowany jest automatycznie przez Cesium w prawym
dolnym rogu canvasu.

---

## 3. Sprzęt — systemy obronne

Plik: [frontend/app/data/weapons.ts](frontend/app/data/weapons.ts)

Wszystkie parametry pochodzą z otwartych materiałów producentów/MON i Wikipedii
(orientacyjne, dla celów demo):

| System | Źródło danych |
|---|---|
| **PSR-A PILICA** (VSHORAD, 23 mm + Grom/Piorun) | PIT-RADWAR / MON — publikacje o programie PILICA |
| **MIM-104 PATRIOT PAC-3** (zasięg ~40 km, pułap do 24 km) | Raytheon / U.S. Army fact sheet; Wikipedia |
| **WRE JAMMER** (mobilna stacja zakłócająca pasma GPS/RF) | Materiały WB Group / PCO — Jastrząb, SkyCtrl |
| **RADAR MAŁOGABARYTOWY** (radar dopplerowski LSS) | PIT-RADWAR — Bystra, SOŁA (klasa małogabarytowa) |

---

## 4. Zagrożenia

Plik: [frontend/app/data/threats.ts](frontend/app/data/threats.ts)

| Typ | Źródło opisu |
|---|---|
| **DRONE** (komercyjny/rozpoznawczy, ~120 m AGL) | Dane ogólne dot. UAV klasy I (NATO) |
| **SHAHED-136** (amunicja krążąca, ~250 m AGL, prędkość ~180 km/h) | Open-source intel (CSIS, RUSI, Defense Express); doniesienia z wojny w Ukrainie |
| **MISSILE** (rakieta manewrująca, ~600 m AGL) | Generyczne parametry klasy Kalibr / Iskander-K — Wikipedia, FAS.org |

---

## 5. Modele 3D (`frontend/public/3d_models/`)

| Plik | Obiekt | Źródło |
|---|---|---|
| `pilica.glb` | PSR-A Pilica | **DOPISZ ŹRÓDŁO** (Sketchfab? własny?) |
| `patriot.glb` | MIM-104 Patriot PAC-3 | **DOPISZ ŹRÓDŁO** |
| `fpv_drone.glb` | Dron FPV | **DOPISZ ŹRÓDŁO** |
| `iranian_shahed-136_military_drone.glb` | Shahed-136 | **DOPISZ ŹRÓDŁO** (po nazwie pliku — prawdopodobnie Sketchfab) |

> Modele należy uzupełnić o licencje (CC-BY, CC0 itp.) i linki do autorów przed publikacją.

---

## 6. Biblioteki i frameworki

| Technologia | Wersja | Licencja | Strona |
|---|---|---|---|
| Next.js | 16.2.6 | MIT | https://nextjs.org |
| React | 19.2.4 | MIT | https://react.dev |
| TypeScript | ^5 | Apache-2.0 | https://www.typescriptlang.org |
| Tailwind CSS | ^4 | MIT | https://tailwindcss.com |
| CesiumJS | 1.118 (CDN) | Apache-2.0 | https://cesium.com/platform/cesiumjs |
| @xyflow/react | 12.10.2 | MIT | https://reactflow.dev |
| @react-three/fiber | 9.6.1 | MIT | https://r3f.docs.pmnd.rs |
| @react-three/drei | 10.7.7 | MIT | https://drei.docs.pmnd.rs |
| three | ^0.184.0 | MIT | https://threejs.org |
| lucide-react | ^1.16.0 | ISC | https://lucide.dev |
| Vercel AI SDK (`ai`) | ^6.0 | Apache-2.0 | https://sdk.vercel.ai |
| `@ai-sdk/openai` | ^3.0 | Apache-2.0 | https://sdk.vercel.ai/providers/ai-sdk-providers/openai |
| `zod` | ^4.4 | MIT | https://zod.dev |

---

## 7. Fonty (Google Fonts)

| Font | Użycie | Licencja |
|---|---|---|
| **Inter** | UI (sentence-case, body) | SIL Open Font License 1.1 |
| **JetBrains Mono** | Dane numeryczne, GPS, timestamps | SIL Open Font License 1.1 |

Załadowane z CDN w [frontend/app/layout.tsx](frontend/app/layout.tsx).

---

## 8. Sztuczna inteligencja — moduł STRATEG AI

Plik: [frontend/app/api/strateg/](frontend/app/api/strateg/)

- Model: **OpenAI GPT-4o** (vision) — możliwy override przez `STRATEG_MODEL`
- Dostawca: OpenAI Platform (https://platform.openai.com)
- Klucz w `OPENAI_API_KEY` (server-side, `.env.local`)
- Streaming structured outputs przez Vercel AI SDK (`streamObject`, `streamText`)

Modele AI nie korzystają z żadnych dodatkowych zewnętrznych baz danych — kontekst sytuacyjny
pochodzi w całości z (a) screenshota Cesium oraz (b) snapshotu stanu symulacji.

---

## 9. Doktryna / inspiracje koncepcyjne

- **Doktryna obrony cywilnej RP** — założenia OC i Zarządzania Kryzysowego (publikacje RCB)
- **NATO STANAG 4670** — klasyfikacja UAV (klasa I/II/III)
- **Raporty CSIS / RUSI** — taktyka ataków saturacyjnych Shahed wzdłuż dolin rzecznych
- **Doświadczenia ukraińskie 2022–2025** — przeloty Shahed korytami rzek (Dniepr, Doniec) jako inspiracja dla `pathType: RIVER`

---

## 10. Co NIE pochodzi z zewnętrznych źródeł

- Struktura zależności kaskadowych między obiektami (OBJ_02 → OBJ_01/OBJ_03 itd.) — **autorska**,
  oparta o ogólne zasady inżynierii systemów krytycznych
- Wartości czasu (12 h drenaż, 6 s wygaszanie turbiny, 5 s relokacji demo) — **parametry demo**
- Scenariusze ataku SCEN_01 – SCEN_04 — **autorskie**, dobrane pod prezentację
- System designu (tokeny, prymitywy, layout) — **autorski**, inspirowany Linear / Notion / Knowledge-app

---

_Dokument do zaktualizowania, jeśli dodasz nowe dane / modele / dostawców. Sekcje z **DOPISZ ŹRÓDŁO** wymagają uzupełnienia przed publicznym pokazem._
