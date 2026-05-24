import { CriticalNode } from "../types";

export const CENTER_LAT = 50.5826;
export const CENTER_LON = 22.0530;

// Coordinates reflect real Stalowa Wola geography (verified against OSM / public registers).
// Spread tuned to read cleanly at 4.5 km camera altitude.
// OBJ_01 — HSW S.A. (ul. Kwiatkowskiego 1), large industrial complex south-east of center.
// OBJ_02 — PGE Energia Ciepła EC Stalowa Wola (ul. Energetyków 13), northern industrial zone.
// OBJ_05 — Stacja Stalowa Wola Rozwadów (NW district, węzeł magistrali Lublin–Przemyśl).
// OBJ_06 — Most na Sanie w ciągu DK77, łączący Stalową Wolę z Pysznicą.
export const INITIAL_NODES: CriticalNode[] = [
  {
    id: "OBJ_01",
    name: "Huta Stalowa Wola S.A.",
    lat: 50.5660,
    lon: 22.0720,
    type: "industrial",
    description: "Strategiczny przemysł obronny (producent armatohaubic Krab, BWP Borsuk). Cel krytyczny.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilany z Elektrowni OBJ_02. Spadek produkcji przy braku zasilania."
  },
  {
    id: "OBJ_02",
    name: "Elektrownia Stalowa Wola",
    lat: 50.5870,
    lon: 22.0700,
    type: "power",
    description: "Blok gazowo-parowy, kluczowe źródło energii i ciepła dla miasta i przemysłu.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasila OBJ_01 i OBJ_03. Wymaga chłodzenia wodnego z Ujęcia OBJ_03."
  },
  {
    id: "OBJ_03",
    name: "Stacja Uzdatniania MZK",
    lat: 50.5970,
    lon: 22.0890,
    type: "water",
    description: "Ujęcie brzegowe na Sanie i stacja uzdatniania wody dla ludności oraz woda chłodząca dla elektrowni.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilana z Elektrowni OBJ_02. Dostarcza wodę chłodzącą do bloku Elektrowni."
  },
  {
    id: "OBJ_04",
    name: "GPZ 'Maziarnia'",
    lat: 50.5520,
    lon: 22.0790,
    type: "electrical",
    description: "Główny Punkt Zasilający - stacja transformatorowa wysokiego napięcia sieci przesyłowej.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasila Centrum Zarządzania Kryzysowego OBJ_07."
  },
  {
    id: "OBJ_05",
    name: "Węzeł Kolejowy Rozwadów",
    lat: 50.5870,
    lon: 22.0290,
    type: "logistic",
    description: "Węzeł logistyki wojskowej (NATO Hub) i towarowej obrony strategicznej.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Autonomiczna infrastruktura kolejowa. Kluczowy dla przerzutu wojsk."
  },
  {
    id: "OBJ_06",
    name: "Most gen. Bora-Komorowskiego",
    lat: 50.5780,
    lon: 22.0980,
    type: "transit",
    description: "Kluczowa przeprawa przez rzekę San w ciągu DK77. Główny korytarz logistyczny ze wschodu.",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Przeprawa drogowa. Brak bezpośrednich zależności sieciowych."
  },
  {
    id: "OBJ_07",
    name: "Centrum Zarządzania Kryzysowego",
    lat: 50.5826,
    lon: 22.0530,
    type: "hq",
    description: "Sztab dowodzenia kryzysowego obrony cywilnej i Urząd Miasta (ul. Wolności).",
    health: 100,
    status: "OPERATIONAL",
    backupPower: false,
    notes: "Zasilany z GPZ Maziarnia OBJ_04. Posiada systemy łączności bateryjnej."
  }
];

export const NODE_COLORS: Record<string, string> = {
  industrial: "#0e7490",
  power: "#c2410c",
  water: "#1d4ed8",
  electrical: "#a16207",
  logistic: "#475569",
  transit: "#7c3aed",
  hq: "#047857"
};

import { NodeRelation } from "../types";

export const INITIAL_RELATIONS: NodeRelation[] = [
  { source: "OBJ_03", target: "OBJ_02", label: "CHŁODZIWO" }, // Water Intake -> Power Plant
  { source: "OBJ_05", target: "OBJ_02", label: "PALIWO" },    // Gas Node -> Power Plant
  { source: "OBJ_02", target: "OBJ_03", label: "ZASILANIE" }, // Power Plant -> Water Intake pumps
  { source: "OBJ_02", target: "OBJ_01", label: "ZASILANIE" }, // Power Plant -> HSW Factory
  { source: "OBJ_04", target: "OBJ_07", label: "ZASILANIE" }, // GPZ Substation -> Crisis HQ
  { source: "OBJ_06", target: "OBJ_07", label: "TELCO" }      // San Tower -> Crisis HQ
];
