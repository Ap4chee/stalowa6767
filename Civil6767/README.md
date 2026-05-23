# Centrum Dowodzenia Lubelskie

**Geospatial Decision Dashboard** dla Marszalka Wojewodztwa Lubelskiego — prototyp koncepcyjny stworzony na hackathon [civil42.pl](https://civil42.pl/hackathon).

## Opis projektu

Interaktywna mapa wojewodztwa lubelskiego pelniaca role dashboardu decyzyjnego w sytuacjach kryzysowych. System integruje dane z wielu zrodel i pozwala na podejmowanie decyzji opartych na danych w czasie rzeczywistym.

**Zestaw danych: A — HydrOS w warunkach powodzi**

System koncentruje sie na scenariuszu zarzadzania zasobami szpitalnymi podczas powodzi:

- Identyfikacja szpitali zagrozonych powodzia
- Ocena dostepnosci lozek i zasobow medycznych
- Planowanie ewakuacji pacjentow z algorytmem routingu
- Monitoring stacji hydrologicznych IMGW w czasie rzeczywistym

## Funkcjonalnosci

### Wymagania podstawowe (zrealizowane)

- **Interaktywna mapa GIS** — mapa wojewodztwa lubelskiego z podzialem na powiaty i gminy, plynny zoom, selekcja regionow
- **Wielowarstwowe nakladki danych** — szpitale, strefy zalewowe ISOK, stacje hydrologiczne, kamery monitoringu, granice administracyjne. Kazda warstwa moze byc niezaleznie wlaczana/wylaczana
- **Dynamiczne odswiezanie danych** — dane ze stacji IMGW, predykcje ML, stany wod aktualizowane w czasie rzeczywistym
- **Filtry i selekcja regionu** — filtrowanie po powiatach/gminach, wyszukiwanie szpitali po nazwie, oddziale, adresie
- **Responsywny UI** — zaprojektowany z mysla o duzym monitorze w sali konferencyjnej lub tablecie
- **Case study: Zestaw A** — pelna implementacja scenariusza kryzysu medycznego z widocznymi zaleznosxciami miedzy warstwami

### Funkcje dodatkowe

1. **Integracja danych z publicznych zrodel** — automatyczne pobieranie danych z IMGW, scrapowanie danych szpitalnych
2. **Agenci social media** — symulowany modul monitoringu mediow spolecznosciowych (Twitter, Facebook, Bluesky) z klasyfikacja zagrozen AI i geolokalizacja postow
3. **Wbudowane kalkulatory zasobow** — predykcja ML ryzyka powodziowego per szpital, analiza dostepnosci lozek, scoring opcji ewakuacji
4. **Asystent glosowy** — sterowanie mapa poleceniami glosowymi (zmiana zakladek, filtry, zoom do gminy, odczyt wskaznikow)

## Architektura

### Frontend (wizualizacja/)

- **Next.js 16** z App Router i React 19
- **Leaflet** — rendering mapy z wieloma warstwami GIS
- **Tailwind CSS 4** — responsywny design system
- **TypeScript** — pelna typowalnosc

### Backend (osobne repo/serwis)

- **FastAPI** — REST API dla danych szpitalnych i powodziowych
- **Model ML** — predykcja ryzyka powodziowego na podstawie danych IMGW
- **Integracja IMGW** — dane hydrologiczne i meteorologiczne w czasie rzeczywistym
- **Mock routing** — symulacja scenariusza ewakuacji szpitala z algorytmem routingu pacjentow

### Zrodla danych

| Zrodlo           | Typ       | Dane                                                   |
| ---------------- | --------- | ------------------------------------------------------ |
| IMGW             | Live API  | Stany wod, ostrzezenia hydrologiczne i meteorologiczne |
| ISOK/RZGW        | WMS       | Strefy zalewowe (woda 100-letnia)                      |
| Wody Polskie     | WMS       | Warstwa rzek                                           |
| Portal szpitalny | Scraping  | Liczba lozek, oddzialy, SOR                            |
| Model ML         | Predykcja | Ryzyko powodziowe per szpital                          |
| Mock API         | Demo      | Scenariusze ewakuacji i routing pacjentow              |

## Kluczowe widoki

### Przeglad regionalny (Mapa)

Glowny widok z interaktywna mapa, panelami bocznymi (warstwy, ryzyka, kamery, social media) i szczegolami po prawej stronie (predykcje ML, stany wod, scenariusze ewakuacji).

### Szpitale

Widok listy szpitali z sortowaniem, wyszukiwaniem i szczegolami kazdego szpitala (oddzialy, lozka, SOR, generator, personel, ryzyko powodziowe).

### Symulacja powodzi (Mock)

Przelacznik "Symulacja" w pasku statusu CZK aktywuje demonstracyjny scenariusz powodzi:

- Wskazanie zagrozenego szpitala
- 3 warianty routingu ewakuacji pacjentow
- Scoring kazdego wariantu (pojemnosc, odleglosc, dopasowanie oddzialow, zlozonosc wykonania)
- Szczegolowa alokacja pacjentow do szpitali docelowych
- Duzy czerwony marker na mapie ze szczegolowym popupem kryzysowym
- Disclaimer AI — rekomendacje sa wsparciem decyzyjnym, nie nalezy kierowac sie nimi w 100%

## Uruchomienie

```bash
cd wizualizacja
npm install
npm run dev
```

Wymagane zmienne srodowiskowe:

```
NEXT_PUBLIC_API_URL=<adres backend API>
```

Backend API musi byc dostepny pod skonfigurowanym adresem. Frontend proxy-uje requesty `/api/backend/*` do backendu.

## Struktura projektu

```
wizualizacja/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Glowna strona (caly stan aplikacji)
├── components/
│   ├── layout/             # TopNavBar, SideNavBar, BottomTicker
│   ├── map/                # LubelskieMap (Leaflet), MapLegend
│   ├── panels/             # Panele boczne (warstwy, ryzyka, kamery, social)
│   ├── detail/             # Panele szczegolowe (szpital, powodz, ewakuacja)
│   └── voice/              # Asystent glosowy (push-to-talk)
├── lib/                    # Hooki danych, typy, stale
│   ├── useFloodData.ts     # Hooki: IMGW, ML, mock routing
│   ├── useHospitals.ts     # Hooki: szpitale, statystyki
│   ├── useTerritories.ts   # GeoJSON powiaty/gminy
│   └── types.ts            # Wszystkie typy TypeScript
└── public/geo/             # GeoJSON wojewodztwa
```

## Zespol

Projekt stworzony w ramach hackathonu Civil42 — zadanie specjalne Marszalka Wojewodztwa Lubelskiego.

## Licencja

Pelne przeniesienie majatkowych praw autorskich na Urzad Marszalkowski Wojewodztwa Lubelskiego — zgodnie z warunkami zadania specjalnego.
