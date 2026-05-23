import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'HydrOS | Powódź',
  description:
    'System zarządzania kryzysem medycznym w warunkach powodzi — monitoring szpitali, predykcja zagrożeń, planowanie ewakuacji.'
};

export default function LandingPage() {
  return (
    <>
      <style>{`
        .hero-gradient {
          background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%);
        }
      `}</style>

      {/* Nagłówek */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-10 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <span className="text-xl font-bold tracking-tight text-gray-900 font-[Space_Grotesk] uppercase">
          Hydr<span className="text-[#72BF44]">OS</span>
        </span>
        <nav className="hidden lg:flex gap-10 items-center">
          <a
            className="text-sm font-medium hover:text-[#72BF44] transition-colors"
            href="#o-projekcie"
          >
            O projekcie
          </a>
          <a
            className="text-sm font-medium hover:text-[#72BF44] transition-colors"
            href="#systemy"
          >
            Systemy
          </a>
          <a
            className="text-sm font-medium hover:text-[#72BF44] transition-colors"
            href="#architektura"
          >
            Architektura
          </a>
          <a
            className="text-sm font-medium hover:text-[#72BF44] transition-colors"
            href="#dane"
          >
            Źródła danych
          </a>
        </nav>
        <Link
          href="/dashboard"
          className="bg-gray-900 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#72BF44] transition-all duration-300"
        >
          Otwórz Dashboard ↗
        </Link>
      </header>

      <main>
        {/* Sekcja hero */}
        <section className="relative pt-24 px-6 md:px-10 mb-20">
          <div className="relative w-full h-[700px] overflow-hidden rounded-3xl group">
            <img
              alt="Powódź w mieście — widok z lotu ptaka"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://images.pexels.com/photos/6471927/pexels-photo-6471927.jpeg?auto=compress&cs=tinysrgb&w=1920&fit=crop"
            />
            <div className="hero-gradient absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-5xl md:text-7xl font-bold text-white font-[Space_Grotesk] max-w-4xl leading-[1.1] mb-6">
                HydrOS
              </h1>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl font-light mb-10">
                System zarządzania zasobami szpitalnymi w warunkach powodzi —
                integracja danych IMGW, szpitali i modeli ML w czasie
                rzeczywistym.
              </p>
              <Link
                href="/dashboard"
                className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#72BF44] hover:text-white transition-all transform hover:-translate-y-1"
              >
                Otwórz Dashboard
              </Link>
            </div>
            <div className="absolute bottom-10 left-10 flex gap-4 items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#72BF44] border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-white"></div>
              </div>
              <span className="text-white/70 text-xs font-[Space_Grotesk] uppercase tracking-wider">
                HydrOS — Powódź
              </span>
            </div>
          </div>
        </section>

        {/* O projekcie */}
        <section
          id="o-projekcie"
          className="max-w-7xl mx-auto px-10 mb-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-end"
        >
          <div>
            <span className="inline-block bg-gray-50 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 border border-gray-200">
              O projekcie — HydrOS
            </span>
            <p className="text-4xl md:text-5xl font-medium font-[Space_Grotesk] leading-tight">
              Zarządzanie zasobami szpitalnymi w&nbsp;czasie powodzi —
              identyfikacja zagrożeń, ocena zasobów, planowanie ewakuacji.
            </p>
          </div>
          <div className="flex flex-col gap-6 text-gray-500 text-lg font-light max-w-md">
            <p>
              System automatycznie scrapuje dane o szpitalach (łóżka, oddziały,
              SOR) i łączy je z danymi hydrologicznymi IMGW, strefami zalewowymi
              ISOK oraz predykcjami modelu ML — tworząc pełny obraz sytuacji
              kryzysowej w regionie.
            </p>
          </div>
        </section>

        {/* Sekcja: scraper jako wyróżnik */}
        <section className="max-w-7xl mx-auto px-10 mb-32">
          <div className="bg-[#0f172a] rounded-3xl p-12 md:p-16 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block bg-[#72BF44]/20 text-[#72BF44] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  Automatyczne pozyskiwanie danych
                </span>
                <h2 className="text-4xl md:text-5xl font-bold font-[Space_Grotesk] mb-6 leading-tight">
                  Scraper danych szpitalnych
                </h2>
                <p className="text-white/60 font-light leading-relaxed mb-8 text-lg">
                  System automatycznie pobiera i parsuje dane z publicznych
                  portali szpitalnych — liczba łóżek wolnych i zajętych,
                  oddziały specjalistyczne, dostępność SOR, generatory awaryjne.
                  Dane aktualizowane cyklicznie bez ingerencji operatora.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-3xl font-bold font-[Space_Grotesk] text-[#72BF44]">
                      Auto
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">
                      Cykliczne pobieranie
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-[Space_Grotesk] text-[#72BF44]">
                      Łóżka
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">
                      Oddziały, SOR, zasoby
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-[Space_Grotesk] text-[#72BF44]">
                      ML
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">
                      Predykcja ryzyka powodziowego
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-[Space_Grotesk] text-[#72BF44]">
                      IMGW
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">
                      Stany wód na żywo
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[#72BF44]">
                      cloud_download
                    </span>
                    <span className="font-bold text-sm">
                      Scraping portali szpitalnych
                    </span>
                  </div>
                  <p className="text-white/50 text-sm font-light">
                    Automatyczne pobieranie danych o łóżkach, oddziałach i
                    zasobach z publicznych źródeł. Parsowanie HTML i
                    normalizacja danych.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[#72BF44]">
                      water
                    </span>
                    <span className="font-bold text-sm">Integracja IMGW</span>
                  </div>
                  <p className="text-white/50 text-sm font-light">
                    Dane hydrologiczne i meteorologiczne w czasie rzeczywistym —
                    stany wód, ostrzeżenia, prognozy ze stacji pomiarowych.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[#72BF44]">
                      psychology
                    </span>
                    <span className="font-bold text-sm">
                      Model predykcyjny ML
                    </span>
                  </div>
                  <p className="text-white/50 text-sm font-light">
                    Predykcja ryzyka powodziowego per szpital na podstawie
                    danych IMGW, lokalizacji i stref zalewowych ISOK.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Systemy */}
        <section id="systemy" className="max-w-7xl mx-auto px-10 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mapa GIS */}
            <div className="bg-[#0f172a] rounded-3xl p-10 flex flex-col justify-between h-[450px] text-white group hover:shadow-2xl transition-all duration-500">
              <div>
                <span className="material-symbols-outlined text-4xl mb-8 text-[#72BF44]">
                  public
                </span>
                <h3 className="text-2xl font-bold font-[Space_Grotesk] mb-4">
                  Interaktywna mapa GIS
                </h3>
                <p className="text-white/60 font-light leading-relaxed">
                  Mapa z podziałem na powiaty i gminy, wielowarstwowe nakładki:
                  szpitale, strefy zalewowe ISOK, stacje IMGW, kamery
                  monitoringu.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-6 bg-[#72BF44] rounded-full flex items-center px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#72BF44]">
                  Na żywo
                </span>
              </div>
            </div>

            {/* Predykcja ML */}
            <div className="relative rounded-3xl overflow-hidden h-[450px] group">
              <img
                alt="Widok z drona na powódź"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src="https://images.pexels.com/photos/8770487/pexels-photo-8770487.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-10">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                  <p className="text-white font-bold text-center">
                    Predykcja ML ryzyka powodziowego
                  </p>
                </div>
              </div>
            </div>

            {/* Źródła danych */}
            <div className="bg-gray-50 rounded-3xl p-10 flex flex-col justify-between border border-gray-200">
              <div>
                <h3 className="text-7xl font-bold font-[Space_Grotesk] mb-2 text-gray-900">
                  6+
                </h3>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-6">
                  Źródeł danych na żywo
                </p>
                <p className="text-gray-400 font-light mb-8">
                  IMGW, ISOK, RZGW, Wody Polskie, scraper szpitalny, model ML —
                  ciągły monitoring regionu.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Hydrologia (IMGW)</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Scraper szpitalny</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Social media (AI)</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#72BF44]"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liczby */}
        <section className="max-w-7xl mx-auto px-10 mb-40">
          <div className="border-t border-gray-200 pt-16 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="space-y-2">
              <p className="text-4xl font-bold font-[Space_Grotesk]">24/7</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Monitoring IMGW
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-[Space_Grotesk]">ML</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Predykcja ryzyka
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-[Space_Grotesk]">Głos</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Asystent głosowy
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold font-[Space_Grotesk] text-[#ED1C24]">
                AI
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                Klasyfikacja zagrożeń
              </p>
            </div>
          </div>
        </section>

        {/* Architektura */}
        <section id="architektura" className="bg-gray-50 py-32 px-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-16">
              <div className="lg:w-1/3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#72BF44] mb-6 block">
                  Infrastruktura
                </span>
                <h2 className="text-5xl font-bold font-[Space_Grotesk] mb-8 leading-tight">
                  Architektura i&nbsp;stos technologiczny
                </h2>
                <p className="text-gray-500 leading-relaxed font-light mb-10">
                  System zbudowany do przetwarzania danych geoprzestrzennych w
                  czasie rzeczywistym z integracją wielu zewnętrznych źródeł — w
                  tym własnego scrapera danych szpitalnych.
                </p>
              </div>
              <div className="lg:w-1/2 w-full grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-2 h-8 bg-[#72BF44] rounded-full"></div>
                    <h4 className="font-bold uppercase tracking-widest text-xs">
                      Frontend
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Framework</span>
                      <span className="font-bold">Next.js 16</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Mapa</span>
                      <span className="font-bold">Leaflet</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Style</span>
                      <span className="font-bold">Tailwind CSS 4</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Język</span>
                      <span className="font-bold">TypeScript</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-2 h-8 bg-[#ED1C24] rounded-full"></div>
                    <h4 className="font-bold uppercase tracking-widest text-xs">
                      Backend
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">API</span>
                      <span className="font-bold">FastAPI</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Scraper</span>
                      <span className="font-bold">Dane szpitalne</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Dane na żywo</span>
                      <span className="font-bold">IMGW, ISOK, GUGiK</span>
                    </li>
                    <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                      <span className="text-gray-500">Routing</span>
                      <span className="font-bold">Ewakuacja pacjentów</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Źródła danych */}
        <section id="dane" className="max-w-7xl mx-auto px-10 py-32">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#72BF44] mb-6 block">
            Integracje
          </span>
          <h2 className="text-5xl font-bold font-[Space_Grotesk] mb-16 leading-tight">
            Źródła danych
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'IMGW',
                type: 'Live API',
                desc: 'Stany wód, ostrzeżenia hydrologiczne i meteorologiczne w czasie rzeczywistym'
              },
              {
                name: 'ISOK / RZGW',
                type: 'WMS',
                desc: 'Strefy zalewowe — woda 100-letnia, mapy zagrożenia powodziowego'
              },
              {
                name: 'Wody Polskie',
                type: 'WMS',
                desc: 'Warstwa rzek i cieków wodnych'
              },
              {
                name: 'Scraper szpitalny',
                type: 'Web scraping',
                desc: 'Automatyczne pobieranie danych: łóżka, oddziały, SOR, generatory awaryjne',
                highlight: true
              },
              {
                name: 'Model ML',
                type: 'Predykcja',
                desc: 'Ryzyko powodziowe per szpital na podstawie danych IMGW i lokalizacji'
              },
              {
                name: 'Scenariusze ewakuacji',
                type: 'Symulacja',
                desc: 'Routing pacjentów, scoring wariantów, alokacja do szpitali docelowych'
              }
            ].map(source => (
              <div
                key={source.name}
                className={`rounded-2xl p-8 border hover:shadow-lg transition-shadow ${
                  source.highlight
                    ? 'bg-[#72BF44]/5 border-[#72BF44]/30 ring-1 ring-[#72BF44]/20'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-2 h-2 rounded-full ${source.highlight ? 'bg-[#72BF44] ring-2 ring-[#72BF44]/30' : 'bg-[#72BF44]'}`}
                  ></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {source.type}
                  </span>
                </div>
                <h4 className="text-xl font-bold font-[Space_Grotesk] mb-2">
                  {source.name}
                </h4>
                <p className="text-gray-500 font-light text-sm">
                  {source.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Stopka */}
      <footer className="bg-white py-20 px-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-[Space_Grotesk] uppercase">
              Hydr<span className="text-[#72BF44]">OS</span>
            </h2>
            <p className="text-xs text-gray-500 font-[Space_Grotesk] uppercase tracking-widest opacity-60">
              System zarządzania kryzysem medycznym w warunkach powodzi.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            <a
              className="text-xs font-bold uppercase tracking-widest hover:text-[#72BF44] transition-colors"
              href="https://civil42.pl/hackathon"
              target="_blank"
              rel="noopener noreferrer"
            >
              Civil42
            </a>
            <Link
              className="text-xs font-bold uppercase tracking-widest hover:text-[#72BF44] transition-colors"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
