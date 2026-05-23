# SPECYFIKACJA TECHNICZNA I WYTYCZNE REALIZACJI: PROJEKT "STEEL SENTINEL"

Jesteś ekspertem w dziedzinie programowania systemów informacji przestrzennej (GIS), obronności (DefenseTech) oraz architektury Next.js. Tworzymy zaawansowaną aplikację hackathonową: interaktywny system analityczno-obronny typu Digital Twin / COP (Common Operational Picture) dla miasta Stalowa Wola. Zadanie skupia się na ochronie infrastruktury krytycznej przed nowoczesnymi zagrożeniami napowietrznymi (drony, amunicja krążąca, rakiety).

Twój cel to wygenerowanie kodu, struktur danych oraz logiki biznesowej, które pozwolą zrealizować system spełniający poniższe wymagania.

---

## 1. ARCHITEKTURA SYSTEMU (TECH STACK)
Aplikacja musi działać płynnie, dynamicznie i posiadać nowoczesny, wojskowo-analityczny interfejs (Cyberpunk/Military Dark Dashboard).

* **Frontend & Silnik 3D:** Next.js 14+ (App Router), React, Tailwind CSS, Shadcn UI.
* **Wizualizacja Przestrzenna (Kluczowa):** Cesium.js (lub Mapbox GL JS) zintegrowany z Reactem. Musi obsługiwać trójwymiarowe ukształtowanie terenu (Terrain) oraz nakładanie sfer/kopuł w przestrzeni 3D.
* **Wizualizacja Zależności sieciowych:** React Flow lub Cytoscape.js do prezentacji grafu infrastruktury.
* **Backend & Baza Danych (Hackathon MVP):** Laravel + SQLite. Błyskawiczny setup API i plikowa relacyjna baza danych dla stanu obiektów, logów ataku i konfiguracji. Skomplikowane operacje przestrzenne przenosimy na front (np. z użyciem Turf.js) dla odciążenia backendu.

---

## 2. REJESTR INFRASTRUKTURY KRYTYCZNEJ (DATASET WEJŚCIOWY)
Zaimplementuj i operuj na poniższych realnych obiektach w Stalowej Woli (współrzędne GPS):

1.  **Huta Stalowa Wola S.A. (OBJ_01):** [50.5482, 22.0495] – strategiczny przemysł obronny (Krab, Borsuk). Cel krytyczny.
2.  **Elektrownia Stalowa Wola (OBJ_02):** [50.5574, 22.0621] – blok gazowo-parowy, źródło energii i ciepła.
3.  **Ujęcie Wody i Stacja Uzdatniania MZK (OBJ_03):** [50.5841, 22.0315] – zaopatrzenie w wodę mieszkańców i przemysłu.
4.  **GPZ "Maziarnia" (OBJ_04):** [50.5395, 22.0682] – stacja transformatorowa wysokiego napięcia.
5.  **Węzeł Kolejowy Stalowa Wola Rozwadów (OBJ_05):** [50.5878, 22.0465] – węzeł logistyki wojskowej i towarowej.
6.  **Most im. gen. T. Bora-Komorowskiego (OBJ_06):** [50.5744, 22.0678] – kluczowa przeprawa przez San.
7.  **Centrum Zarządzania Kryzysowego / Urząd Miasta (OBJ_07):** [50.5701, 22.0524] – węzeł decyzyjny obrony cywilnej.

---

## 3. LOGIKA GRAFU I ANALIZA AWARII KASKADOWYCH
Zaimplementuj algorytm analizy sieciowej (np. skierowany graf zależności), który reaguje na uszkodzenia obiektów (status: `OPERATIONAL`, `DAMAGED`, `DESTROYED`):

* `OBJ_02` (Elektrownia) -> zasila -> `OBJ_01` (Huta HSW) [Krytyczne: spadek produkcji do 15%, generatory awaryjne na 24h].
* `OBJ_02` (Elektrownia) -> zasila -> `OBJ_03` (Ujęcie Wody) [Wysokie: pompy stają, zapas wody w zbiornikach na 12h].
* `OBJ_03` (Ujęcie Wody) -> dostarcza wodę chłodzącą -> `OBJ_02` (Elektrownia) [**Pętla zwrotna**: brak chłodzenia wymusza wygaszenie elektrowni w ciągu 2h].
* `OBJ_04` (GPZ Maziarnia) -> dystrybuuje prąd -> `OBJ_07` (Centrum Kryzysowe) [Paraliż systemów łączności miejskiej].

---

## 4. FUNKCJONALNOŚCI I MODUŁY APLIKACJI

### Moduł A: Interaktywna Mapa 3D (Cesium.js)
* Renderowanie punktów infrastruktury krytycznej z ikonami i etykietami.
* **Arsenał Obronny (Panel boczny):** Możliwość dynamicznego "rozstawiania" przez użytkownika systemów detekcji i walki na mapie:
    1.  *PSR-A PILICA (System kinetyczny):* Zasięg = sfera o promieniu 5000m (kolor czerwony). Logika: niszczy drony i rakiety.
    2.  *WRE Jammer (Walka elektroniczna):* Zasięg = sfera o promieniu 2000m (kolor niebieski). Logika: neutralizuje drony komercyjne poprzez zagłuszanie GPS/RF.
    3.  *Radar małogabarytowy:* Zasięg = sfera o promieniu 3500m (kolor zielony). Służy do wczesnego wykrywania.

### Moduł B: Symulator Scenariuszy Ataku
* Zaimplementuj animację wektorów ataku (ruchome obiekty/kropki na mapie) poruszające się po trajektoriach od wschodniej granicy w stronę obiektów.
* **Typy zagrożeń do obsłużenia w kodzie:**
    * *Dron komercyjny/rozpoznawczy:* Niski pułap, niska prędkość. Podatny na WRE i Pilicę.
    * *Amunicja krążąca (Shahed):* Średni pułap, leci wzdłuż rzeki San (ukrycie terenowe). Podatna na Pilicę, odporna na podstawowe WRE.
    * *Rakieta manewrująca:* Wysoka prędkość. Tylko Pilica jest w stanie ją zneutralizować w swoim zasięgu.

### Moduł C: Panel Alertów i Reagowania (Playbooks)
* W przypadku udanego ataku (brak obrony w strefie), obiekt zmienia status na `DESTROYED`.
* Aplikacja automatycznie odpala procedury kryzysowe: generuje instrukcje dla służb, uruchamia alarmy kaskadowe dla połączonych obiektów i symuluje powiadomienia ostrzegawcze dla ludności (SMS/Syreny).

---

## 5. WYMAGANIA BUSINESS / USP (Unique Selling Proposition)
Podczas generowania interfejsu i opisów, kładź nacisk na:
* **Skalowalność:** Narzędzie zaprojektowane dla Stalowej Woli jako szablon "Digital Twin" możliwy do wdrożenia w dowolnym średnim mieście posiadającym przemysł zbrojeniowy/ciężki.
* **Model B2G/B2B:** System dedykowany dla Wydziałów Zarządzania Kryzysowego (samorządy) oraz dla zarządów spółek operujących infrastrukturą krytyczną.