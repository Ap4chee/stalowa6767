'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useCallback } from 'react';

import { BottomTicker } from '@/components/layout/BottomTicker';
import { SideNavBar } from '@/components/layout/SideNavBar';
import { TopNavBar } from '@/components/layout/TopNavBar';
import type { TopTab } from '@/components/layout/TopNavBar';

import { CameraDetailPanel } from '@/components/detail/CameraDetailPanel';
import { EmergencyCallDetailPanel } from '@/components/detail/EmergencyCallDetailPanel';
import { EmergencyCallListPanel } from '@/components/detail/EmergencyCallListPanel';
import { FloodHospitalsPanel } from '@/components/detail/FloodHospitalsPanel';
import { FloodOverviewCard } from '@/components/detail/FloodOverviewCard';
import { HospitalDetailPanel } from '@/components/detail/HospitalDetailPanel';
import { HospitalListPanel } from '@/components/detail/HospitalListPanel';
import { MockFloodScenarioPanel } from '@/components/detail/MockFloodScenarioPanel';
import { RightPanelDrawer } from '@/components/detail/RightPanelDrawer';

import { MapLegend } from '@/components/map/MapLegend';
import { CrisisHeaderCard } from '@/components/panels/CrisisHeaderCard';
import { LayersPanel } from '@/components/panels/LayersPanel';
import { SocialFeedPanel } from '@/components/panels/SocialFeedPanel';
import { LivePanel } from '@/components/panels/LivePanel';
import { RiskPanel } from '@/components/panels/RiskPanel';
import { TerritorialFilterPanel } from '@/components/panels/TerritorialFilterPanel';
import { OnboardingOverlay } from '@/components/layout/OnboardingOverlay';

import { useTerritories } from '@/lib/useTerritories';
import { useHospitals, useHospitalStats } from '@/lib/useHospitals';
import {
  useFloodPrediction,
  useFloodOverview,
  useMLGlobalPrediction,
  useMLAllHospitalPredictions,
  useMockFloodRouting
} from '@/lib/useFloodData';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { usePersistedState } from '@/lib/usePersistedState';
import type {
  ApiHospital,
  CameraFeed,
  EmergencyCall,
  LayerToggles,
  PanelId,
  TerritoryKind,
  VoiceAction
} from '@/lib/types';

const LubelskieMap = dynamic(() => import('@/components/map/LubelskieMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-variant">
      <span className="font-headline text-xs uppercase tracking-widest text-on-surface-variant">
        Ładowanie mapy...
      </span>
    </div>
  )
});

const DEFAULT_LAYERS: LayerToggles = {
  hospitals: true,
  floodZones: true,
  cameras: true,
  emergencyCalls: true,
  powiatBoundaries: true,
  gminaBoundaries: true
};

export default function HomePage() {
  const [activeTab, setActiveTab] = usePersistedState<TopTab>(
    'cd:activeTab',
    'map'
  );
  const [activePanel, setActivePanel] = usePersistedState<PanelId | null>(
    'cd:activePanel',
    'map'
  );
  const [territoryLevel, setTerritoryLevel] = useState<TerritoryKind>('powiat');
  const [selectedPowiatId, setSelectedPowiatId] = useState<string | null>(null);
  const [selectedGminaId, setSelectedGminaId] = useState<string | null>(null);
  const [layerToggles, setLayerToggles] = usePersistedState<LayerToggles>(
    'cd:layerToggles',
    DEFAULT_LAYERS
  );
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<ApiHospital | null>(
    null
  );
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyCall | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      !localStorage.getItem('cd:onboarding-done')
    ) {
      setShowOnboarding(true);
    }
  }, []);

  const [mockFloodEnabled, setMockFloodEnabled] = useState(false);
  const [mockFloodSelectedOptionId, setMockFloodSelectedOptionId] = useState<
    string | null
  >(null);
  const toggleMockFlood = useCallback(() => {
    setMockFloodEnabled(prev => {
      const next = !prev;
      if (next) {
        setOpenDrawers(d => new Set([...d, 'mock-flood']));
      } else {
        setOpenDrawers(d => {
          const s = new Set(d);
          s.delete('mock-flood');
          return s;
        });
      }
      return next;
    });
  }, []);
  const [openDrawers, setOpenDrawers] = useState<Set<string>>(
    () => new Set(['flood-hospitals', 'flood-overview', 'emergency-calls'])
  );

  const toggleDrawer = useCallback((id: string) => {
    setOpenDrawers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const territories = useTerritories();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const { stats } = useHospitalStats();
  const { data: floodPrediction } = useFloodPrediction();
  const { data: floodOverview, loading: floodOverviewLoading } =
    useFloodOverview();
  const { data: mlGlobal } = useMLGlobalPrediction();
  const { data: mockFloodRouting, loading: mockFloodLoading } =
    useMockFloodRouting(mockFloodEnabled);

  const hospitalIds = useMemo(() => hospitals.map(h => h.id), [hospitals]);
  const { data: mlAllPredictions, loading: mlAllLoading } =
    useMLAllHospitalPredictions(hospitalIds);

  // ── Keyboard shortcuts ──
  useKeyboardShortcuts({
    onSwitchTab: setActiveTab,
    onTogglePanel: handleSidebarClick,
    onCloseAll: useCallback(() => {
      setActivePanel(null);
      setSelectedCamera(null);
      setSelectedHospital(null);
    }, [])
  });

  // Build search index from territories + hospitals for TopNavBar
  const searchIndex = useMemo(() => {
    const powiatFeatures = territories.powiaty?.features ?? [];
    const gminaFeatures = territories.gminy?.features ?? [];

    const powiatNameByTeryt = new Map<string, string>();
    for (const p of powiatFeatures) {
      const t = p.properties.teryt;
      if (t) powiatNameByTeryt.set(t.slice(0, 4), p.properties.name);
    }

    const items: Array<{
      id: string;
      name: string;
      kind: 'powiat' | 'gmina' | 'hospital';
      parentName?: string;
      address?: string;
      keywords?: string[];
    }> = [];

    // Territories
    for (const p of powiatFeatures) {
      items.push({
        id: p.properties.id,
        name: p.properties.name,
        kind: 'powiat'
      });
    }
    for (const g of gminaFeatures) {
      const t = g.properties.teryt;
      const parent = t ? powiatNameByTeryt.get(t.slice(0, 4)) : undefined;
      items.push({
        id: g.properties.id,
        name: g.properties.name,
        kind: 'gmina',
        parentName: parent
      });
    }

    // Hospitals with keywords from departments, address, and common abbreviations
    for (const h of hospitals) {
      const keywords: string[] = [];
      // Department names as keywords
      for (const d of h.departments) {
        keywords.push(d.department_name);
      }
      // Common abbreviations / synonyms
      if (h.has_sor) keywords.push('SOR', 'izba przyjęć', 'emergency');
      const nameLower = h.hospital_name.toLowerCase();
      if (nameLower.includes('dzieci') || nameLower.includes('pediatr'))
        keywords.push('pediatria', 'dzieci', 'dziecięcy');
      if (nameLower.includes('onkolog'))
        keywords.push('onkologia', 'rak', 'nowotwór');
      if (nameLower.includes('wojew'))
        keywords.push('wojewódzki', 'WSS', 'WSZ');
      if (nameLower.includes('miejski') || nameLower.includes('powiatowy'))
        keywords.push('SP', 'SPZ', 'SPZOZ');
      // Add address parts
      if (h.address) keywords.push(h.address);

      items.push({
        id: String(h.id),
        name: h.hospital_name,
        kind: 'hospital',
        address: h.address,
        keywords
      });
    }

    return items;
  }, [territories.powiaty, territories.gminy, hospitals]);

  const handleSearchSelect = useCallback(
    (result: { id: string; kind: 'powiat' | 'gmina' | 'hospital' }) => {
      if (result.kind === 'hospital') {
        const hospital = hospitals.find(h => String(h.id) === result.id);
        if (hospital) {
          setSelectedHospital(hospital);
          setSelectedCamera(null);
        }
      } else if (result.kind === 'powiat') {
        setTerritoryLevel('powiat');
        setSelectedGminaId(null);
        setSelectedPowiatId(result.id);
      } else {
        setTerritoryLevel('gmina');
        setSelectedPowiatId(null);
        setSelectedGminaId(result.id);
      }
    },
    [hospitals]
  );

  function handleSidebarClick(panel: PanelId) {
    setActivePanel(current => (current === panel ? null : panel));
  }

  function toggleLayer(key: keyof LayerToggles) {
    setLayerToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function closePanel() {
    setActivePanel(null);
  }

  const handleVoiceAction = useCallback(
    (action: VoiceAction) => {
      switch (action.action) {
        case 'switch_tab':
          if (action.tab) setActiveTab(action.tab);
          break;
        case 'open_panel':
          if (action.panel) setActivePanel(action.panel);
          break;
        case 'close_panel':
          setActivePanel(null);
          break;
        case 'search_territory':
          if (action.territory_name) {
            const q = action.territory_name.toLowerCase();
            const match = searchIndex.find(item => {
              const n = item.name.toLowerCase();
              return n.includes(q) || q.includes(n);
            });
            if (match) handleSearchSelect({ id: match.id, kind: match.kind });
          }
          break;
        case 'toggle_layer':
          if (action.layer) {
            const layer = action.layer as keyof LayerToggles;
            setLayerToggles(prev => ({
              ...prev,
              [layer]: action.layer_enabled ?? !prev[layer]
            }));
          }
          break;
        case 'info':
          // No state change – audio confirmation only
          break;
      }
    },
    [searchIndex, handleSearchSelect]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-surface text-on-surface">
      <TopNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchIndex={searchIndex}
        onSelectSearchResult={handleSearchSelect}
        onVoiceAction={handleVoiceAction}
      />
      <SideNavBar activePanel={activePanel} onSelect={handleSidebarClick} />

      {/* Floating left panel stack – shared across all tabs */}
      <div className="pointer-events-none fixed left-[84px] top-20 z-40 flex max-h-[calc(100vh-10rem)] w-80 flex-col gap-4 overflow-y-auto pr-1 no-scrollbar">
        {activeTab === 'map' && (
          <div className="pointer-events-auto">
            <CrisisHeaderCard
              mockFloodEnabled={mockFloodEnabled}
              onToggleMockFlood={toggleMockFlood}
            />
          </div>
        )}

        {activePanel === 'map' && (
          <div className="pointer-events-auto">
            <TerritorialFilterPanel
              powiaty={territories.powiaty}
              gminy={territories.gminy}
              loading={territories.status === 'loading'}
              selectedPowiatId={selectedPowiatId}
              selectedGminaId={selectedGminaId}
              onSelectPowiat={setSelectedPowiatId}
              onSelectGmina={setSelectedGminaId}
              onLevelChange={setTerritoryLevel}
              level={territoryLevel}
              onClose={closePanel}
            />
          </div>
        )}

        {activePanel === 'live' && (
          <div className="pointer-events-auto">
            <LivePanel
              onSelectCamera={camera => setSelectedCamera(camera)}
              onClose={closePanel}
            />
          </div>
        )}

        {activePanel === 'layers' && (
          <div className="pointer-events-auto">
            <LayersPanel
              toggles={layerToggles}
              onToggle={toggleLayer}
              onClose={closePanel}
            />
          </div>
        )}

        {activePanel === 'risk' && (
          <div className="pointer-events-auto">
            <RiskPanel onClose={closePanel} />
          </div>
        )}

        {activePanel === 'social' && (
          <div className="pointer-events-auto">
            <SocialFeedPanel onClose={closePanel} />
          </div>
        )}
      </div>

      {activeTab === 'map' && (
        <>
          {/* Map background */}
          <div className="absolute inset-0 top-16 z-0 bg-grid">
            <LubelskieMap
              powiaty={territories.powiaty}
              gminy={territories.gminy}
              level={territoryLevel}
              selectedPowiatId={selectedPowiatId}
              selectedGminaId={selectedGminaId}
              onSelectPowiat={setSelectedPowiatId}
              onSelectGmina={setSelectedGminaId}
              layerToggles={layerToggles}
              onSelectCamera={camera => {
                setSelectedCamera(camera);
                setSelectedHospital(null);
                setSelectedEmergency(null);
              }}
              hospitals={hospitals}
              onSelectHospital={hospital => {
                setSelectedHospital(hospital);
                setSelectedCamera(null);
                setSelectedEmergency(null);
              }}
              onDeselectHospital={() => setSelectedHospital(null)}
              selectedHospital={selectedHospital}
              floodPrediction={floodPrediction}
              mockFloodRouting={mockFloodEnabled ? mockFloodRouting : null}
              mockFloodSelectedOptionId={mockFloodSelectedOptionId}
              onSelectEmergency={call => {
                setSelectedEmergency(call);
                setSelectedCamera(null);
                setSelectedHospital(null);
              }}
            />
          </div>

          {/* Map legend – outside Leaflet container so clicks work */}
          <MapLegend layerToggles={layerToggles} />

          {/* Right detail column */}
          <main className="pointer-events-none relative z-10 flex h-full justify-end pl-24 pt-20">
            <div className="pointer-events-auto flex max-h-[calc(100vh-6rem)] flex-col gap-2 overflow-y-auto py-4 pr-2 thin-scrollbar">
              {selectedCamera && (
                <RightPanelDrawer
                  id="camera"
                  label="Kamera"
                  icon="videocam"
                  isOpen
                  onToggle={() => setSelectedCamera(null)}
                  accentColor="text-critical"
                >
                  <CameraDetailPanel
                    camera={selectedCamera}
                    onClose={() => setSelectedCamera(null)}
                  />
                </RightPanelDrawer>
              )}
              {selectedHospital && (
                <RightPanelDrawer
                  id="hospital-detail"
                  label="Szpital"
                  icon="local_hospital"
                  isOpen
                  onToggle={() => setSelectedHospital(null)}
                  accentColor="text-primary-dark"
                >
                  <HospitalDetailPanel
                    hospital={selectedHospital}
                    onClose={() => setSelectedHospital(null)}
                  />
                </RightPanelDrawer>
              )}
              {selectedEmergency && (
                <RightPanelDrawer
                  id="emergency-detail"
                  label="Zgłoszenie 112"
                  icon="call"
                  isOpen
                  onToggle={() => setSelectedEmergency(null)}
                  accentColor="text-red-600"
                >
                  <EmergencyCallDetailPanel
                    call={selectedEmergency}
                    onClose={() => setSelectedEmergency(null)}
                  />
                </RightPanelDrawer>
              )}
              {/* Mock flood scenario */}
              {mockFloodEnabled &&
                !selectedCamera &&
                !selectedHospital &&
                !selectedEmergency && (
                  <RightPanelDrawer
                    id="mock-flood"
                    label="Symulacja powodzi"
                    icon="emergency"
                    isOpen={openDrawers.has('mock-flood')}
                    onToggle={toggleDrawer}
                    accentColor="text-critical"
                  >
                    {mockFloodLoading && (
                      <div className="rounded border border-outline bg-white p-6 shadow-sm">
                        <span className="font-headline text-xs text-on-surface-variant animate-pulse">
                          Generowanie scenariusza ewakuacji...
                        </span>
                      </div>
                    )}
                    {!mockFloodLoading && mockFloodRouting && (
                      <MockFloodScenarioPanel
                        data={mockFloodRouting}
                        onClose={() => toggleDrawer('mock-flood')}
                        selectedOptionId={mockFloodSelectedOptionId}
                        onSelectOption={setMockFloodSelectedOptionId}
                      />
                    )}
                    {!mockFloodLoading && !mockFloodRouting && (
                      <div className="rounded border border-outline bg-white p-6 text-center shadow-sm">
                        <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant">
                          cloud_off
                        </span>
                        <p className="font-headline text-xs text-on-surface-variant">
                          Nie udalo sie pobrac danych symulacji. Sprawdz
                          polaczenie z API.
                        </p>
                      </div>
                    )}
                  </RightPanelDrawer>
                )}

              {!selectedCamera && !selectedHospital && !selectedEmergency && (
                <RightPanelDrawer
                  id="flood-hospitals"
                  label="Szpitale – powódź"
                  icon="emergency"
                  isOpen={openDrawers.has('flood-hospitals')}
                  onToggle={toggleDrawer}
                  accentColor="text-critical"
                >
                  <FloodHospitalsPanel
                    onClose={() => toggleDrawer('flood-hospitals')}
                    hospitalCount={stats?.hospitals}
                    departmentCount={stats?.departments}
                    mlPredictions={mlAllPredictions}
                    mlPredictionsLoading={mlAllLoading}
                  />
                </RightPanelDrawer>
              )}
              <RightPanelDrawer
                id="flood-overview"
                label="Zagrożenia powodziowe"
                icon="flood"
                isOpen={openDrawers.has('flood-overview')}
                onToggle={toggleDrawer}
                accentColor="text-amber-600"
              >
                <FloodOverviewCard
                  floodOverview={floodOverview}
                  floodOverviewLoading={floodOverviewLoading}
                  mlGlobal={mlGlobal}
                />
              </RightPanelDrawer>
              <RightPanelDrawer
                id="emergency-calls"
                label="Zgłoszenia 112"
                icon="call"
                isOpen={openDrawers.has('emergency-calls')}
                onToggle={toggleDrawer}
                accentColor="text-red-600"
              >
                <EmergencyCallListPanel
                  onSelectCall={call => {
                    setSelectedEmergency(call);
                    setSelectedCamera(null);
                    setSelectedHospital(null);
                  }}
                />
              </RightPanelDrawer>
            </div>
          </main>

          <BottomTicker />
        </>
      )}

      {activeTab === 'hospitals' && (
        <div className="fixed inset-0 top-16 z-10 flex bg-surface">
          {/* Left sidebar spacer */}
          <div className="w-[72px] shrink-0" />

          {/* Hospital list */}
          <div className="flex w-[480px] shrink-0 flex-col border-r border-outline bg-white">
            <HospitalListPanel
              hospitals={hospitals}
              loading={hospitalsLoading}
              floodPrediction={floodPrediction}
              onSelectHospital={hospital => {
                setSelectedHospital(hospital);
              }}
            />
          </div>

          {/* Map + detail side */}
          <div className="relative flex-1">
            <LubelskieMap
              powiaty={territories.powiaty}
              gminy={territories.gminy}
              level={territoryLevel}
              selectedPowiatId={selectedPowiatId}
              selectedGminaId={selectedGminaId}
              onSelectPowiat={setSelectedPowiatId}
              onSelectGmina={setSelectedGminaId}
              layerToggles={layerToggles}
              onSelectCamera={camera => {
                setSelectedCamera(camera);
                setSelectedHospital(null);
              }}
              hospitals={hospitals}
              onSelectHospital={hospital => {
                setSelectedHospital(hospital);
                setSelectedCamera(null);
              }}
              onDeselectHospital={() => setSelectedHospital(null)}
              selectedHospital={selectedHospital}
              floodPrediction={floodPrediction}
            />

            {/* Detail overlay */}
            {selectedHospital && (
              <div className="pointer-events-auto absolute right-4 top-4 z-20 w-[400px] max-h-[calc(100vh-6rem)] overflow-y-auto thin-scrollbar">
                <HospitalDetailPanel
                  hospital={selectedHospital}
                  onClose={() => setSelectedHospital(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
