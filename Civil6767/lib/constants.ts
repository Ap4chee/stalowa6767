import type { CameraFeed, EmergencyCall, PanelId, RiverStatus } from './types';

export const LUBELSKIE_CENTER: [number, number] = [51.2465, 22.5684];
export const LUBELSKIE_INITIAL_ZOOM = 8;
export const CAMERA_CLUSTER_ZOOM_THRESHOLD = 9;

export const CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'lublin-brama-krakowska',
    label: 'Brama Krakowska',
    playerId: '2877',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-brame-krakowska/',
    lat: 51.2489,
    lon: 22.5673,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  },
  {
    id: 'lublin-plac-litewski',
    label: 'Plac Litewski',
    playerId: '2870',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-plac-litewski/',
    lat: 51.2469,
    lon: 22.5538,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  },
  {
    id: 'lublin-brama-krolewska',
    label: 'Brama Krakowska (ul. Królewska)',
    playerId: '2876',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-brame-krakowska-ul-krolewska/',
    lat: 51.2477,
    lon: 22.5688,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  },
  {
    id: 'lublin-park-ludowy',
    label: 'Park Ludowy',
    playerId: '2871',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-park-ludowy/',
    lat: 51.2352,
    lon: 22.5866,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  },
  {
    id: 'lublin-krakowskie-przedmiescie',
    label: 'Krakowskie Przedmieście',
    playerId: '6788',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-krakowskie-przedmiescie/',
    lat: 51.2482,
    lon: 22.5579,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  },
  {
    id: 'lublin-arena',
    label: 'Arena Lublin',
    playerId: '2872',
    pageUrl:
      'https://lublin.eu/lublin/o-miescie/lublin-na-zywo/widok-na-arene-lublin/',
    lat: 51.2314,
    lon: 22.5279,
    alertLevel: 'good',
    alertText: 'Bez zagrożeń'
  }
];

export const SIDEBAR_ITEMS: Array<{
  id: PanelId;
  label: string;
  icon: string;
}> = [
  { id: 'map', label: 'Mapa', icon: 'map' },
  { id: 'live', label: 'Na żywo', icon: 'emergency' },
  { id: 'layers', label: 'Warstwy', icon: 'layers' },
  { id: 'risk', label: 'Ryzyko', icon: 'analytics' },
  { id: 'files', label: 'Dane', icon: 'description' },
  { id: 'social', label: 'Social', icon: 'hub' }
];

export const RIVER_TICKER: RiverStatus[] = [
  { name: 'Bug', level: '4.2m', status: 'critical' },
  { name: 'Wieprz', level: '2.1m', status: 'stable' },
  { name: 'Wisła', level: '3.5m', status: 'warning' },
  { name: 'San', level: '1.8m', status: 'stable' },
  { name: 'Tyśmienica', level: '2.4m', status: 'warning' },
  { name: 'Huczwa', level: '1.1m', status: 'stable' }
];

export const EMERGENCY_CALLS: EmergencyCall[] = [
  {
    id: 'e112-001',
    timestamp: '2026-04-12T08:14:00',
    priority: 'critical',
    category: 'flood',
    title: 'Podtopienie budynku mieszkalnego',
    description:
      'Woda wdarła się do piwnicy i parteru budynku wielorodzinnego przy ul. Nadbystrzycka 12. Około 20 osób wymaga ewakuacji, w tym osoby starsze i dzieci.',
    location: 'ul. Nadbystrzycka 12, Lublin',
    lat: 51.2356,
    lon: 22.5489,
    callerName: 'Anna Kowalska',
    callerPhone: '+48 512 XXX XXX',
    status: 'dispatched',
    assignedUnit: 'PSP Lublin - JRG 1',
    notes: 'Wysłano 2 zastępy PSP + łodź ratunkową'
  },
  {
    id: 'e112-002',
    timestamp: '2026-04-12T08:32:00',
    priority: 'critical',
    category: 'medical',
    title: 'Zawał serca – pacjent 67 lat',
    description:
      'Mężczyzna 67 lat, silny ból w klatce piersiowej, duszność, utrata przytomności. Żona zgłasza cukrzycę w wywiadzie.',
    location: 'ul. Głęboka 45, Lublin',
    lat: 51.2498,
    lon: 22.5612,
    callerName: 'Maria Nowak',
    callerPhone: '+48 601 XXX XXX',
    status: 'in-progress',
    assignedUnit: 'ZRM P-01 Lublin',
    notes: 'Karetka S na miejscu, transport do WSS al. Kraśnicka'
  },
  {
    id: 'e112-003',
    timestamp: '2026-04-12T09:05:00',
    priority: 'high',
    category: 'accident',
    title: 'Wypadek drogowy – 3 pojazdy',
    description:
      'Zderzenie czołowe na skrzyżowaniu DK17. 3 samochody osobowe, 5 poszkodowanych, 2 osoby zakleszczone w pojeździe.',
    location: 'DK17 km 142, Piaski',
    lat: 51.1442,
    lon: 22.8456,
    callerName: 'Tomasz Wiśniewski',
    callerPhone: '+48 698 XXX XXX',
    status: 'in-progress',
    assignedUnit: 'PSP Świdnik + ZRM',
    notes: 'LPR wezwany, lądowisko przygotowywane'
  },
  {
    id: 'e112-004',
    timestamp: '2026-04-12T09:18:00',
    priority: 'high',
    category: 'flood',
    title: 'Przelanie wału – Bystrzyca',
    description:
      'Obserwowane przelanie wody przez wał przeciwpowodziowy na odcinku Hajdów-Zadębie. Zalane pola uprawne, woda zbliża się do zabudowań.',
    location: 'Wał Bystrzycy, Hajdów-Zadębie',
    lat: 51.2614,
    lon: 22.6123,
    callerName: 'Sołtys Hajdowa',
    callerPhone: '+48 511 XXX XXX',
    status: 'dispatched',
    assignedUnit: 'KMPSP Lublin + WZMiUW',
    notes: 'Worki z piaskiem w drodze. Zawiadomiono WZMiUW'
  },
  {
    id: 'e112-005',
    timestamp: '2026-04-12T09:45:00',
    priority: 'medium',
    category: 'infrastructure',
    title: 'Uszkodzony most – zamknięcie drogi',
    description:
      'Podmycie filarów mostu na rzece Wieprz w Łęcznej. Most zamknięty dla ruchu, konieczne objazdy.',
    location: 'Most na Wieprzu, Łęczna',
    lat: 51.2967,
    lon: 22.8768,
    callerName: 'Dyżurny GDDKiA',
    callerPhone: '+48 81 XXX XX XX',
    status: 'in-progress',
    assignedUnit: 'GDDKiA + Policja Łęczna'
  },
  {
    id: 'e112-006',
    timestamp: '2026-04-12T10:02:00',
    priority: 'medium',
    category: 'medical',
    title: 'Uraz głowy – dziecko 8 lat',
    description:
      'Dziecko spadło z drzewa na placu zabaw. Rana tłuczona głowy, mdłości, zawroty głowy. Przytomne.',
    location: 'Park Bronowice, Lublin',
    lat: 51.2589,
    lon: 22.5234,
    callerName: 'Ewa Mazur',
    callerPhone: '+48 667 XXX XXX',
    status: 'dispatched',
    assignedUnit: 'ZRM P-04 Lublin'
  },
  {
    id: 'e112-007',
    timestamp: '2026-04-12T10:15:00',
    priority: 'critical',
    category: 'fire',
    title: 'Pożar hali magazynowej',
    description:
      'Pożar w hali magazynowej z materiałami chemicznymi. Gęsty czarny dym, zagrożenie dla okolicznych mieszkańców. Strefa wyłączenia 500m.',
    location: 'ul. Mełgiewska 18, Lublin',
    lat: 51.2678,
    lon: 22.5891,
    callerName: 'Ochrona obiektu',
    callerPhone: '+48 81 XXX XX XX',
    status: 'in-progress',
    assignedUnit: 'PSP Lublin JRG 1,2,3 + SGRCH',
    notes:
      'Alarm II stopnia. Ewakuacja osiedla Bronowice-Wschód. Zamknięta ul. Mełgiewska.'
  },
  {
    id: 'e112-008',
    timestamp: '2026-04-12T10:33:00',
    priority: 'low',
    category: 'other',
    title: 'Drzewo przewrócone na jezdnię',
    description:
      'Duży dąb przewrócił się na jezdnię blokując przejazd w obu kierunkach. Brak poszkodowanych.',
    location: 'ul. Lipowa, Puławy',
    lat: 51.4167,
    lon: 21.9725,
    callerName: 'Patrol Policji',
    callerPhone: '+48 81 XXX XX XX',
    status: 'resolved',
    assignedUnit: 'OSP Puławy + ZDM'
  },
  {
    id: 'e112-009',
    timestamp: '2026-04-12T10:48:00',
    priority: 'high',
    category: 'flood',
    title: 'Ewakuacja DPS – zalany parter',
    description:
      'Dom Pomocy Społecznej przy ul. Abramowickiej – zalany parter, 35 pensjonariuszy wymaga ewakuacji na wyższe kondygnacje lub do innego obiektu.',
    location: 'ul. Abramowicka 62, Lublin',
    lat: 51.2234,
    lon: 22.6045,
    callerName: 'Dyrektor DPS',
    callerPhone: '+48 81 XXX XX XX',
    status: 'in-progress',
    assignedUnit: 'PSP Lublin + ZRM + WOPr',
    notes: 'Koordynacja z MOPS Lublin. Autobus MZK podstawiony.'
  },
  {
    id: 'e112-010',
    timestamp: '2026-04-12T11:05:00',
    priority: 'medium',
    category: 'medical',
    title: 'Zatrucie tlenkiem węgla – 3 osoby',
    description:
      'Trzy osoby z objawami zatrucia CO w budynku jednorodzinnym. Bóle głowy, nudności. Czujnik CO w domu się nie uruchomił.',
    location: 'ul. Sławinkowska 8, Lublin',
    lat: 51.2712,
    lon: 22.5156,
    callerName: 'Jan Kozłowski',
    callerPhone: '+48 502 XXX XXX',
    status: 'dispatched',
    assignedUnit: 'ZRM S-02 Lublin + PSP',
    notes: 'Wentylacja budynku. Pomiar stężenia CO przez PSP.'
  },
  {
    id: 'e112-011',
    timestamp: '2026-04-12T11:22:00',
    priority: 'low',
    category: 'infrastructure',
    title: 'Awaria sieci wodociągowej',
    description:
      'Pęknięcie magistrali wodociągowej DN400. Woda zalewa ul. Kunickiego. Brak dostawy wody dla ok. 2000 mieszkań.',
    location: 'ul. Kunickiego/Witosa, Lublin',
    lat: 51.2189,
    lon: 22.5534,
    callerName: 'Dyżurny MPWiK',
    callerPhone: '+48 81 XXX XX XX',
    status: 'in-progress',
    assignedUnit: 'MPWiK Lublin + SM'
  },
  {
    id: 'e112-012',
    timestamp: '2026-04-12T11:40:00',
    priority: 'high',
    category: 'medical',
    title: 'Poród w domu – komplikacje',
    description:
      'Kobieta 32 lata, 38 tydzień ciąży. Poród domowy z komplikacjami – silne krwawienie. Partner prosi o natychmiastową pomoc.',
    location: 'ul. Zana 19, Lublin',
    lat: 51.2402,
    lon: 22.5367,
    callerName: 'Piotr Jankowski',
    callerPhone: '+48 515 XXX XXX',
    status: 'dispatched',
    assignedUnit: 'ZRM S-01 Lublin',
    notes:
      'Karetka S z zespołem neonatologicznym. Kontakt z oddz. położniczym WSS.'
  }
];
