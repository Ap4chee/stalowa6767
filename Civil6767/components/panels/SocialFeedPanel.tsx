'use client';

import { useEffect, useRef, useState } from 'react';
import { PanelShell } from './PanelShell';

// ── Types ──────────────────────────────────────────────────────────────────

type ThreatLevel = 'critical' | 'warning' | 'info';
type Source = 'twitter' | 'facebook' | 'bluesky';

type SocialPost = {
  id: string;
  source: Source;
  handle: string;
  displayName: string;
  avatar: string;
  text: string;
  location: string;
  timestamp: number; // unix ms
  threat: ThreatLevel;
  keywords: string[];
  likes: number;
  shares: number;
};

// ── Seed data pool ─────────────────────────────────────────────────────────

const POST_POOL: Omit<SocialPost, 'id' | 'timestamp' | 'likes' | 'shares'>[] = [
  {
    source: 'twitter',
    handle: '@marek_lublin',
    displayName: 'Marek Wiśniewski',
    avatar: 'MW',
    text: 'Ulica Nadrzeczna całkowicie pod wodą. Woda weszła do piwnicy, nie można wyjechać samochodem. Proszę o pomoc! #lublin #powódź',
    location: 'Lublin, ul. Nadrzeczna',
    threat: 'critical',
    keywords: ['zalana', 'piwnica', 'pomoc'],
  },
  {
    source: 'facebook',
    handle: 'Lublin Ostrzeżenia',
    displayName: 'Lublin Ostrzeżenia Pogodowe',
    avatar: 'LO',
    text: 'UWAGA: Poziom Bystrzycy przy moście Poniatowskiego wynosi już 382 cm. Ostrzeżenie hydrologiczne II stopnia. Unikajcie terenów zalewowych.',
    location: 'Lublin',
    threat: 'critical',
    keywords: ['Bystrzyca', '382 cm', 'ostrzeżenie II stopnia'],
  },
  {
    source: 'twitter',
    handle: '@anna_k_lublin',
    displayName: 'Anna K.',
    avatar: 'AK',
    text: 'Droga S17 w kierunku Zamościa zablokowana przez wody. Policja kieruje objazdem przez Piaski. #s17 #powódź #lublin',
    location: 'Lublin / Zamość',
    threat: 'warning',
    keywords: ['S17', 'zablokowana', 'objazd'],
  },
  {
    source: 'bluesky',
    handle: '@tomek.lublin.bsky.social',
    displayName: 'Tomek Dąbrowski',
    avatar: 'TD',
    text: 'Widok z okna: parking przy Galerii Olimp pod wodą ok 40 cm. Auta stoją w wodzie po progi. Ktoś to widział?',
    location: 'Lublin, os. Czechów',
    threat: 'warning',
    keywords: ['parking', '40 cm', 'Galeria Olimp'],
  },
  {
    source: 'twitter',
    handle: '@ratusz_lublin',
    displayName: 'Urząd Miasta Lublin',
    avatar: 'UM',
    text: 'Sztab Kryzysowy zebrał się o 06:00. Ewakuacja mieszkańców ul. Nadrzeczna i Zalewowej. Autobusy PKM przy ul. Lipowej. Prosimy o zachowanie spokoju.',
    location: 'Lublin',
    threat: 'critical',
    keywords: ['ewakuacja', 'Sztab Kryzysowy', 'PKM'],
  },
  {
    source: 'facebook',
    handle: 'Mieszkańcy Lublina',
    displayName: 'Mieszkańcy Lublina – Grupa',
    avatar: 'ML',
    text: 'Czy ktoś wie czy szkoła podstawowa nr 14 działa dzisiaj? Słyszałam że okolica jest zagrożona. Mam 2 dzieci i nie wiem co robić.',
    location: 'Lublin, Dziesiąta',
    threat: 'info',
    keywords: ['szkoła', 'zagrożona', 'dzieci'],
  },
  {
    source: 'twitter',
    handle: '@imgw_lublin',
    displayName: 'IMGW Lublin',
    avatar: 'IG',
    text: 'Prognoza hydrologiczna: szczyt fali powodziowej na Bystrzycy prognozowany na godz. 18:00-21:00. Spodziewany poziom 410-430 cm. Akcja monitoringowa trwa.',
    location: 'Lublin',
    threat: 'critical',
    keywords: ['szczyt fali', '430 cm', 'prognoza'],
  },
  {
    source: 'bluesky',
    handle: '@kamil.nowak.bsky.social',
    displayName: 'Kamil Nowak',
    avatar: 'KN',
    text: 'Straż pożarna właśnie przejechała ul. Krakowskim Przedmieściem z łodziami. Serio łodziami po ulicy. Niesamowite i przerażające jednocześnie.',
    location: 'Lublin centrum',
    threat: 'warning',
    keywords: ['straż pożarna', 'łodzie', 'Krakowskie Przedmieście'],
  },
  {
    source: 'facebook',
    handle: 'Powiat Świdnik',
    displayName: 'Starostwo Powiatowe Świdnik',
    avatar: 'PS',
    text: 'Zamknięcie drogi powiatowej 2304L w m. Krępiec. Woda na jezdni ok. 60 cm. Zastępczy objazd przez Trawniki. Przepraszamy za utrudnienia.',
    location: 'Powiat Świdnik',
    threat: 'warning',
    keywords: ['Krępiec', '60 cm', 'objazd Trawniki'],
  },
  {
    source: 'twitter',
    handle: '@pogotowie_lublin',
    displayName: 'Pogotowie Ratunkowe Lublin',
    avatar: 'PR',
    text: 'Apelujemy: nie wchodźcie do zalanej wody! Może zawierać ścieki i prąd z uszkodzonych instalacji. Wzywajcie pomoc pod 112.',
    location: 'Lublin',
    threat: 'info',
    keywords: ['112', 'ścieki', 'prąd', 'bezpieczeństwo'],
  },
  {
    source: 'twitter',
    handle: '@patryk_wierz',
    displayName: 'Patryk Wierzbicki',
    avatar: 'PW',
    text: 'Bystrzyca wylewa przy Parku Ludowym. Ławki w połowie pod wodą, alejki niedostępne. Służby już na miejscu zamykają teren.',
    location: 'Lublin, Park Ludowy',
    threat: 'warning',
    keywords: ['Park Ludowy', 'wylewa', 'ławki'],
  },
  {
    source: 'bluesky',
    handle: '@justyna.lub.bsky.social',
    displayName: 'Justyna Lubelska',
    avatar: 'JL',
    text: 'Sklep Lidl na Poligonowej działa normalnie – wjazd od Diamentowej nie zalany. Na wszelki wypadek zrobiłam zapasy na 3 dni.',
    location: 'Lublin, Poligonowa',
    threat: 'info',
    keywords: ['Lidl', 'Poligonowa', 'zapasy'],
  },
  {
    source: 'facebook',
    handle: 'Samorząd Świdnik',
    displayName: 'Gmina Świdnik Oficjalnie',
    avatar: 'GS',
    text: 'Centrum Zarządzania Kryzysowego Świdnik informuje: stan alarmowy na rzece Giełczew utrzymuje się. Mieszkańcy doliny proszeni o gotowość do ewakuacji.',
    location: 'Świdnik',
    threat: 'critical',
    keywords: ['Giełczew', 'stan alarmowy', 'ewakuacja'],
  },
  {
    source: 'twitter',
    handle: '@p_kowalczyk_lub',
    displayName: 'Piotr Kowalczyk',
    avatar: 'PK',
    text: 'Dziękuję strażakom z JRG2 Lublin za sprawną ewakuację babci z parteru przy Wieniawie. Prawdziwi bohaterowie roboty #OSP #lublin',
    location: 'Lublin, Wieniawa',
    threat: 'info',
    keywords: ['JRG2', 'ewakuacja', 'Wieniawa'],
  },
  {
    source: 'bluesky',
    handle: '@marcin.lbl.bsky.social',
    displayName: 'Marcin Łubniewski',
    avatar: 'MŁ',
    text: 'Poziom Wieprza w Kocku: 318 cm i rośnie ok. 8 cm/h. Jeśli tempo się utrzyma przekroczenie stanu alarmowego za ~5h. Obserwuję.',
    location: 'Kock, pow. lubartowski',
    threat: 'warning',
    keywords: ['Wieprz', '318 cm', 'stan alarmowy', 'Kock'],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<Source, string> = {
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
  bluesky: 'Bluesky',
};

const SOURCE_COLOR: Record<Source, string> = {
  twitter: 'bg-black text-white',
  facebook: 'bg-[#1877F2] text-white',
  bluesky: 'bg-[#0085FF] text-white',
};

const SOURCE_ICON: Record<Source, string> = {
  twitter: 'X',
  facebook: 'f',
  bluesky: '🦋',
};

const THREAT_STYLE: Record<ThreatLevel, string> = {
  critical: 'border-l-critical bg-critical/5',
  warning: 'border-l-amber-500 bg-amber-50',
  info: 'border-l-primary bg-surface-variant/30',
};

const THREAT_BADGE: Record<ThreatLevel, { label: string; cls: string }> = {
  critical: { label: 'KRYTYCZNE', cls: 'bg-critical/10 text-critical border-critical/20' },
  warning: { label: 'OSTRZEŻENIE', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  info: { label: 'INFO', cls: 'bg-primary/10 text-primary-dark border-primary/20' },
};

function fmtRelative(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return `${diffSec}s temu`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min temu`;
  return `${Math.floor(diffSec / 3600)}h temu`;
}

function makePost(
  base: Omit<SocialPost, 'id' | 'timestamp' | 'likes' | 'shares'>,
  offsetMs = 0
): SocialPost {
  return {
    ...base,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now() - offsetMs,
    likes: Math.floor(Math.random() * 280) + 3,
    shares: Math.floor(Math.random() * 90) + 1,
  };
}

function buildInitialPosts(): SocialPost[] {
  // Shuffle pool deterministically enough for display
  const shuffled = [...POST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8).map((base, i) =>
    makePost(base, i * 95_000 + Math.random() * 30_000)
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded text-[8px] font-black ${SOURCE_COLOR[source]}`}
      title={SOURCE_LABEL[source]}
    >
      {SOURCE_ICON[source]}
    </span>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const badge = THREAT_BADGE[post.threat];
  return (
    <article
      className={`rounded border-l-2 p-2.5 transition-all duration-500 ${THREAT_STYLE[post.threat]}`}
    >
      {/* Header row */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* Avatar */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-dark/10 font-headline text-[8px] font-bold text-primary-dark">
            {post.avatar}
          </div>
          <div className="min-w-0">
            <span className="block truncate font-headline text-[10px] font-bold text-on-surface">
              {post.displayName}
            </span>
            <div className="flex items-center gap-1">
              <SourceBadge source={post.source} />
              <span className="font-mono text-[9px] text-on-surface-variant">
                {post.handle}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-1 py-0.5 font-headline text-[8px] font-bold uppercase ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Text */}
      <p className="mb-1.5 font-mono text-[10px] leading-[1.45] text-on-surface">
        {post.text}
      </p>

      {/* Keywords row */}
      <div className="mb-1.5 flex flex-wrap gap-1">
        {post.keywords.map(kw => (
          <span
            key={kw}
            className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[8px] font-semibold text-primary-dark"
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[10px]">location_on</span>
          <span className="font-mono text-[9px]">{post.location}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] text-on-surface-variant">
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">favorite</span>
            {post.likes}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[10px]">share</span>
            {post.shares}
          </span>
          <span>{fmtRelative(post.timestamp)}</span>
        </div>
      </div>
    </article>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

type Props = { onClose: () => void };

const FILTERS: Array<{ value: ThreatLevel | 'all'; label: string }> = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'critical', label: 'Krytyczne' },
  { value: 'warning', label: 'Ostrzeżenia' },
  { value: 'info', label: 'Info' },
];

export function SocialFeedPanel({ onClose }: Props) {
  const [posts, setPosts] = useState<SocialPost[]>(() => buildInitialPosts());
  const [filter, setFilter] = useState<ThreatLevel | 'all'>('all');
  const [scrapedCount, setScrapedCount] = useState(posts.length);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(new Date());
  const poolIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate new posts arriving
  useEffect(() => {
    function scheduleNext() {
      const delay = 6000 + Math.random() * 8000; // 6-14s
      timerRef.current = setTimeout(() => {
        const idx = poolIndexRef.current % POST_POOL.length;
        poolIndexRef.current += 1;
        const newPost = makePost(POST_POOL[idx]);

        setScanning(true);
        setTimeout(() => {
          setPosts(prev => [newPost, ...prev].slice(0, 20));
          setScrapedCount(c => c + 1);
          setLastScan(new Date());
          setScanning(false);
          scheduleNext();
        }, 900);
      }, delay);
    }
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const visible = filter === 'all' ? posts : posts.filter(p => p.threat === filter);

  const critCount = posts.filter(p => p.threat === 'critical').length;

  return (
    <PanelShell
      title="Monitoring Social Media"
      onClose={onClose}
      meta={
        <div className="flex items-center gap-2">
          {scanning ? (
            <span className="flex items-center gap-1 font-mono text-[9px] text-amber-600">
              <span className="material-symbols-outlined animate-spin text-[10px]">
                progress_activity
              </span>
              skanowanie…
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[9px] text-primary-dark">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-dark" />
              LIVE
            </span>
          )}
          <span className="font-mono text-[9px] text-on-surface-variant">
            {scrapedCount} postów
          </span>
        </div>
      }
    >
      {/* Stats row */}
      <div className="mb-3 flex gap-2">
        <div className="flex flex-1 flex-col items-center rounded border border-critical/20 bg-critical/5 p-1.5">
          <span className="font-headline text-base font-black text-critical">{critCount}</span>
          <span className="font-mono text-[8px] uppercase text-critical/70">krytyczne</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded border border-amber-500/20 bg-amber-50 p-1.5">
          <span className="font-headline text-base font-black text-amber-700">
            {posts.filter(p => p.threat === 'warning').length}
          </span>
          <span className="font-mono text-[8px] uppercase text-amber-600">ostrzeżenia</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded border border-primary/20 bg-primary/5 p-1.5">
          <span className="font-headline text-base font-black text-primary-dark">
            {posts.filter(p => p.threat === 'info').length}
          </span>
          <span className="font-mono text-[8px] uppercase text-primary-dark/70">info</span>
        </div>
      </div>

      {/* AI classifier banner */}
      <div className="mb-3 flex items-center gap-2 rounded border border-outline bg-surface-variant/40 px-2 py-1.5">
        <span className="material-symbols-outlined text-sm text-primary-dark">
          smart_toy
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-headline text-[9px] font-bold uppercase text-primary-dark">
            Klasyfikacja AI (NLP)
          </p>
          <p className="font-mono text-[8px] text-on-surface-variant">
            Model: crisis-bert-pl · Ostatni skan:{' '}
            {lastScan.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-1 py-0.5 font-headline text-[8px] font-bold uppercase text-primary-dark">
          AKTYWNY
        </span>
      </div>

      {/* Filter tabs */}
      <div className="mb-2 flex gap-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`flex-1 rounded py-1 font-headline text-[8px] font-bold uppercase transition-colors ${
              filter === f.value
                ? 'bg-primary-dark text-white'
                : 'border border-outline text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Source filter pills */}
      <div className="mb-3 flex gap-1">
        {(['twitter', 'facebook', 'bluesky'] as Source[]).map(src => (
          <span
            key={src}
            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[8px] ${SOURCE_COLOR[src]}`}
          >
            <span className="font-black">{SOURCE_ICON[src]}</span>
            {SOURCE_LABEL[src]}
          </span>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <p className="py-4 text-center font-mono text-[10px] text-on-surface-variant">
            Brak postów w tej kategorii
          </p>
        ) : (
          visible.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-outline pt-2 text-center">
        <p className="font-mono text-[8px] text-on-surface-variant">
          Dane zbierane z X (Twitter) · Facebook · Bluesky · geofencing: woj. lubelskie · 50 km
        </p>
      </div>
    </PanelShell>
  );
}
