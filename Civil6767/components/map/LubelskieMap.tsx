'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  FeatureGroup as LeafletFeatureGroup,
  LatLngBoundsExpression
} from 'leaflet';
import L from 'leaflet';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  WMSTileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet';

import {
  CAMERA_CLUSTER_ZOOM_THRESHOLD,
  CAMERA_FEEDS,
  EMERGENCY_CALLS,
  LUBELSKIE_CENTER,
  LUBELSKIE_INITIAL_ZOOM
} from '@/lib/constants';
import { useMLHospitalPrediction } from '@/lib/useFloodData';
import {
  bucketForProbability,
  bucketMeta
} from '@/components/detail/HospitalFloodRiskSection';
import type {
  CameraFeed,
  EmergencyCall,
  LayerToggles,
  TerritoryFeature,
  TerritoryFeatureCollection,
  TerritoryKind,
  ApiHospital,
  FloodPredictionResponse,
  FloodRiskHospital,
  MockFloodRoutingResponse
} from '@/lib/types';

const MARKER_PANE = 'markerPane650';
const RIVER_PANE = 'riverPane';

/** Creates custom Leaflet panes so layers render in the right order. */
function CreatePanes({ onReady }: { onReady?: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane(MARKER_PANE)) {
      const pane = map.createPane(MARKER_PANE);
      pane.style.zIndex = '650';
    }
    if (!map.getPane(RIVER_PANE)) {
      const pane = map.createPane(RIVER_PANE);
      pane.style.zIndex = '395'; // above base tiles, below overlays
      pane.classList.add('riverPane');
    }
    onReady?.();
  }, [map, onReady]);
  return null;
}

type Props = {
  powiaty: TerritoryFeatureCollection | null;
  gminy: TerritoryFeatureCollection | null;
  level: TerritoryKind;
  selectedPowiatId: string | null;
  selectedGminaId: string | null;
  onSelectPowiat: (id: string | null) => void;
  onSelectGmina: (id: string | null) => void;
  layerToggles: LayerToggles;
  onSelectCamera: (camera: CameraFeed) => void;
  hospitals?: ApiHospital[];
  onSelectHospital?: (hospital: ApiHospital) => void;
  onDeselectHospital?: () => void;
  selectedHospital?: ApiHospital | null;
  floodPrediction?: FloodPredictionResponse | null;
  mockFloodRouting?: MockFloodRoutingResponse | null;
  mockFloodSelectedOptionId?: string | null;
  onSelectEmergency?: (call: EmergencyCall) => void;
};

const BASE_STYLE = {
  color: '#2d6c00',
  weight: 1.2,
  opacity: 0.75,
  fillColor: '#72bf44',
  fillOpacity: 0.06
};

const HOVER_STYLE = {
  color: '#2d6c00',
  weight: 2.2,
  opacity: 1,
  fillColor: '#72bf44',
  fillOpacity: 0.18
};

const SELECTED_STYLE = {
  color: '#bb0013',
  weight: 2.6,
  opacity: 1,
  fillColor: '#ed1c24',
  fillOpacity: 0.18
};

export default function LubelskieMap({
  powiaty,
  gminy,
  level,
  selectedPowiatId,
  selectedGminaId,
  onSelectPowiat,
  onSelectGmina,
  layerToggles,
  onSelectCamera,
  hospitals,
  onSelectHospital,
  onDeselectHospital,
  selectedHospital,
  floodPrediction,
  mockFloodRouting,
  mockFloodSelectedOptionId,
  onSelectEmergency
}: Props) {
  const powiatLayerRef = useRef<LeafletFeatureGroup | null>(null);
  const gminaLayerRef = useRef<LeafletFeatureGroup | null>(null);
  const [panesReady, setPanesReady] = useState(false);

  const showPowiaty =
    layerToggles.powiatBoundaries && level === 'powiat' && !!powiaty;
  const showGminy =
    layerToggles.gminaBoundaries && level === 'gmina' && !!gminy;

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={LUBELSKIE_CENTER}
        zoom={LUBELSKIE_INITIAL_ZOOM}
        minZoom={7}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full bg-[#f8f9fa]"
      >
        <CreatePanes onReady={() => setPanesReady(true)} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        {/* Wody Polskie hydrography – emphasises real river geometry */}
        {panesReady && (
          <WMSTileLayer
            url="https://wody.isok.gov.pl/wss/INSPIRE/INSPIRE_HY_PHYSICAL_WATERS_WMS"
            layers="HY.PhysicalWaters.Watercourses"
            format="image/png"
            transparent
            opacity={0.85}
            pane={RIVER_PANE}
            attribution="Dane: Wody Polskie (ISOK)"
          />
        )}

        <FitToFeatures
          powiaty={powiaty}
          gminy={gminy}
          selectedPowiatId={selectedPowiatId}
          selectedGminaId={selectedGminaId}
        />

        <FlyToHospital hospital={selectedHospital ?? null} />

        {showPowiaty && (
          <GeoJSON
            key={`powiaty-${selectedPowiatId ?? 'none'}`}
            data={powiaty as unknown as GeoJSON.FeatureCollection}
            ref={ref => {
              powiatLayerRef.current = ref as unknown as LeafletFeatureGroup;
            }}
            style={feature => {
              const props = (feature as TerritoryFeature).properties;
              return props.id === selectedPowiatId
                ? SELECTED_STYLE
                : BASE_STYLE;
            }}
            onEachFeature={(feature, layer) => {
              const props = (feature as TerritoryFeature).properties;
              layer.bindTooltip(props.name, {
                className: 'powiat-label',
                direction: 'center',
                sticky: false,
                permanent: false
              });
              layer.on({
                mouseover: e => {
                  if (props.id !== selectedPowiatId) {
                    (e.target as any).setStyle(HOVER_STYLE);
                  }
                },
                mouseout: e => {
                  if (props.id !== selectedPowiatId) {
                    (e.target as any).setStyle(BASE_STYLE);
                  }
                },
                click: () => onSelectPowiat(props.id)
              });
            }}
          />
        )}

        {showGminy && (
          <GeoJSON
            key={`gminy-${selectedGminaId ?? 'none'}`}
            data={gminy as unknown as GeoJSON.FeatureCollection}
            ref={ref => {
              gminaLayerRef.current = ref as unknown as LeafletFeatureGroup;
            }}
            style={feature => {
              const props = (feature as TerritoryFeature).properties;
              return props.id === selectedGminaId ? SELECTED_STYLE : BASE_STYLE;
            }}
            onEachFeature={(feature, layer) => {
              const props = (feature as TerritoryFeature).properties;
              layer.bindTooltip(props.name, {
                className: 'gmina-label',
                direction: 'center',
                sticky: false,
                permanent: false
              });
              layer.on({
                mouseover: e => {
                  if (props.id !== selectedGminaId) {
                    (e.target as any).setStyle(HOVER_STYLE);
                  }
                },
                mouseout: e => {
                  if (props.id !== selectedGminaId) {
                    (e.target as any).setStyle(BASE_STYLE);
                  }
                },
                click: () => onSelectGmina(props.id)
              });
            }}
          />
        )}

        {layerToggles.cameras && (
          <CameraLayer onSelectCamera={onSelectCamera} />
        )}

        {layerToggles.emergencyCalls && (
          <EmergencyCallLayer onSelectEmergency={onSelectEmergency} />
        )}

        {layerToggles.hospitals && hospitals && hospitals.length > 0 && (
          <HospitalLayer
            hospitals={hospitals}
            onSelectHospital={onSelectHospital}
            onDeselectHospital={onDeselectHospital}
            atRiskHospitals={floodPrediction?.at_risk_hospitals}
          />
        )}

        {mockFloodRouting && hospitals && (
          <MockFloodMarker
            data={mockFloodRouting}
            hospitals={hospitals}
            selectedOptionId={mockFloodSelectedOptionId ?? null}
          />
        )}

        {layerToggles.floodZones &&
          floodPrediction &&
          floodPrediction.risk_stations?.length > 0 && (
            <RiskStationLayer stations={floodPrediction.risk_stations} />
          )}

        {layerToggles.floodZones && (
          <WMSTileLayer
            url="https://wody.isok.gov.pl/wss/INSPIRE/INSPIRE_NZ_HY_MZPMRP_WMS"
            layers="MZP_RZEKI_P100"
            format="image/png"
            transparent
            opacity={0.45}
            attribution="Dane: Wody Polskie (ISOK)"
          />
        )}
      </MapContainer>
    </div>
  );
}

/* ── Big red alert marker for mock flood impacted hospital ── */

const MOCK_FLOOD_ICON_HTML = `
<div style="position:relative;width:52px;height:52px;">
  <span style="position:absolute;inset:0;border-radius:50%;background:rgba(187,0,19,0.18);animation:mock-pulse 1.5s ease-in-out infinite;"></span>
  <span style="position:absolute;inset:6px;border-radius:50%;background:rgba(187,0,19,0.3);animation:mock-pulse 1.5s ease-in-out 0.3s infinite;"></span>
  <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
    <span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#bb0013;border:3px solid #fff;box-shadow:0 0 20px rgba(187,0,19,0.6),0 4px 12px rgba(0,0,0,0.3);">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path d="M12 2L12 14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="12" cy="19" r="2" fill="#fff"/>
      </svg>
    </span>
  </span>
</div>
`;

/** Resolved target with map coordinates looked up from the hospital list. */
type ResolvedTarget = {
  hospital_id: number;
  hospital_name: string;
  lat: number;
  lon: number;
  allocated_patients: number;
  distance_km: number;
  free_beds_before: number;
  free_beds_after: number;
};

type RouteGeometry = {
  target_id: number;
  coords: [number, number][];
  duration_min: number;
};

const ROUTE_COLORS = ['#15803d', '#0369a1', '#7c3aed'];

const TARGET_ICON_HTML = (patients: number, color: string) => `
<div style="position:relative;width:40px;height:40px;">
  <span style="position:absolute;inset:0;border-radius:50%;background:${color}22;animation:mock-pulse 2s ease-in-out infinite;"></span>
  <span style="position:absolute;inset:6px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px ${color}55;">
    <span style="color:#fff;font-size:11px;font-weight:900;line-height:1;">${patients}</span>
  </span>
</div>
`;

function MockFloodMarker({
  data,
  hospitals,
  selectedOptionId
}: {
  data: MockFloodRoutingResponse;
  hospitals: ApiHospital[];
  selectedOptionId: string | null;
}) {
  const map = useMap();
  const impacted = hospitals.find(h => h.id === data.impacted_hospital_id);
  const [routes, setRoutes] = useState<RouteGeometry[]>([]);

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'mock-flood-marker',
        html: MOCK_FLOOD_ICON_HTML,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        popupAnchor: [0, -26]
      }),
    []
  );

  const activeOption = useMemo(() => {
    if (selectedOptionId) {
      const found = data.options.find(o => o.option_id === selectedOptionId);
      if (found) return found;
    }
    return data.options.length > 0
      ? [...data.options].sort((a, b) => b.score_overall - a.score_overall)[0]
      : null;
  }, [data.options, selectedOptionId]);

  // Resolve target coordinates from hospital list
  const resolvedTargets = useMemo<ResolvedTarget[]>(() => {
    if (!activeOption) return [];
    return activeOption.targets
      .map(t => {
        const h = hospitals.find(hosp => hosp.id === t.hospital_id);
        if (!h || h.latitude == null || h.longitude == null) return null;
        return {
          hospital_id: t.hospital_id,
          hospital_name: t.hospital_name,
          lat: h.latitude,
          lon: h.longitude,
          allocated_patients: t.allocated_patients,
          distance_km: t.distance_km,
          free_beds_before: t.free_beds_before,
          free_beds_after: t.free_beds_after
        };
      })
      .filter((t): t is ResolvedTarget => t != null);
  }, [activeOption, hospitals]);

  // Fetch OSRM road routes
  useEffect(() => {
    if (!impacted || impacted.latitude == null || impacted.longitude == null)
      return;
    if (resolvedTargets.length === 0) return;
    let cancelled = false;

    const origin = `${impacted.longitude},${impacted.latitude}`;

    Promise.all(
      resolvedTargets.map(async target => {
        try {
          const dest = `${target.lon},${target.lat}`;
          const url = `https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=full&geometries=geojson`;
          const r = await fetch(url);
          if (!r.ok) return null;
          const json = await r.json();
          const route = json.routes?.[0];
          if (!route?.geometry?.coordinates) return null;
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] // GeoJSON [lon,lat] → Leaflet [lat,lon]
          );
          return {
            target_id: target.hospital_id,
            coords,
            duration_min: Math.round(route.duration / 60)
          } as RouteGeometry;
        } catch {
          return null;
        }
      })
    ).then(results => {
      if (!cancelled) {
        setRoutes(results.filter((r): r is RouteGeometry => r != null));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [impacted, resolvedTargets]);

  // Fly to show all points
  useEffect(() => {
    if (!impacted || impacted.latitude == null || impacted.longitude == null)
      return;
    if (resolvedTargets.length === 0) {
      map.flyTo([impacted.latitude, impacted.longitude], 12, { duration: 1 });
      return;
    }
    const allLats = [impacted.latitude, ...resolvedTargets.map(t => t.lat)];
    const allLons = [impacted.longitude!, ...resolvedTargets.map(t => t.lon)];
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...allLats), Math.min(...allLons)],
      [Math.max(...allLats), Math.max(...allLons)]
    ];
    map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2 });
  }, [map, impacted, resolvedTargets]);

  if (!impacted || impacted.latitude == null || impacted.longitude == null)
    return null;

  return (
    <>
      {/* Road routes — drawn underneath markers */}
      {routes.map((route, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const target = resolvedTargets.find(
          t => t.hospital_id === route.target_id
        );
        return (
          <React.Fragment key={route.target_id}>
            {/* Route shadow for contrast */}
            <Polyline
              positions={route.coords}
              pathOptions={{
                color: '#000',
                weight: 7,
                opacity: 0.15,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
            {/* Route line */}
            <Polyline
              positions={route.coords}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '12 6'
              }}
            >
              <Tooltip sticky opacity={1} className="route-tooltip">
                <span style={{ fontWeight: 700, fontSize: 11 }}>
                  {target?.hospital_name ?? 'Szpital docelowy'}
                </span>
                <br />
                <span style={{ fontSize: 10 }}>
                  ~{route.duration_min} min jazdy
                  {target
                    ? ` \u2022 ${target.allocated_patients} pacjentow`
                    : ''}
                </span>
              </Tooltip>
            </Polyline>
          </React.Fragment>
        );
      })}

      {/* Target hospital markers */}
      {resolvedTargets.map((target, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const route = routes.find(r => r.target_id === target.hospital_id);
        const targetIcon = L.divIcon({
          className: 'mock-flood-marker',
          html: TARGET_ICON_HTML(target.allocated_patients, color),
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });
        return (
          <Marker
            key={target.hospital_id}
            position={[target.lat, target.lon]}
            icon={targetIcon}
            pane={MARKER_PANE}
            zIndexOffset={900}
            bubblingMouseEvents={false}
          >
            <Tooltip
              direction="top"
              offset={[0, -22]}
              opacity={1}
              className="map-hospital-label"
            >
              {target.hospital_name}
            </Tooltip>
            <Popup maxWidth={280}>
              <div style={{ fontFamily: 'inherit' }}>
                <div
                  style={{
                    background: color,
                    color: '#fff',
                    padding: '8px 12px',
                    margin: '-12px -14px 0',
                    borderRadius: '3px 3px 0 0',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Szpital docelowy
                </div>
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}
                  >
                    {target.hospital_name}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      background: `${color}15`,
                      borderRadius: 6,
                      padding: '6px 4px'
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 900, color }}>
                      {target.allocated_patients}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase'
                      }}
                    >
                      pacjentow
                    </div>
                  </div>
                  <div
                    style={{
                      background: `${color}15`,
                      borderRadius: 6,
                      padding: '6px 4px'
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 900, color }}>
                      {route
                        ? `${route.duration_min}`
                        : `${target.distance_km.toFixed(0)}`}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase'
                      }}
                    >
                      {route ? 'min jazdy' : 'km'}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: '#444',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    Wolne lozka: <strong>{target.free_beds_before}</strong>
                  </span>
                  <span>
                    Po transferze: <strong>{target.free_beds_after}</strong>
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Impacted hospital — big red alert marker */}
      <Marker
        position={[impacted.latitude, impacted.longitude]}
        icon={icon}
        pane={MARKER_PANE}
        zIndexOffset={1000}
        bubblingMouseEvents={false}
      >
        <Popup className="mock-flood-popup" maxWidth={360} minWidth={320}>
          <div style={{ fontFamily: 'inherit' }}>
            {/* Red alert banner */}
            <div
              style={{
                background: '#bb0013',
                color: '#fff',
                padding: '10px 14px',
                margin: '-12px -14px 0',
                borderRadius: '3px 3px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M12 2L12 14"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="19" r="2" fill="#fff" />
              </svg>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  Zagrozenie powodziowe
                </div>
                <div style={{ fontSize: 11, opacity: 0.9, marginTop: 1 }}>
                  Wymagana ewakuacja pacjentow
                </div>
              </div>
            </div>

            {/* Hospital name */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: 1.3
                }}
              >
                {data.impacted_hospital_name}
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                {data.impacted_hospital_address}
              </div>
            </div>

            {/* Key numbers — big and scannable */}
            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 6,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  background: '#fde8ea',
                  borderRadius: 6,
                  padding: '8px 4px'
                }}
              >
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: '#bb0013' }}
                >
                  {data.impacted_water_level_cm}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#bb0013',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  cm wody
                </div>
              </div>
              <div
                style={{
                  background: '#fef3c7',
                  borderRadius: 6,
                  padding: '8px 4px'
                }}
              >
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: '#b45309' }}
                >
                  {data.impacted_departments.length}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#b45309',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  oddzialow
                </div>
              </div>
              <div
                style={{
                  background: '#fde8ea',
                  borderRadius: 6,
                  padding: '8px 4px'
                }}
              >
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: '#bb0013' }}
                >
                  {data.flood_alert_level}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#bb0013',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  alert
                </div>
              </div>
            </div>

            {/* Affected departments */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4
                }}
              >
                Oddzialy do ewakuacji
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {data.impacted_departments.map(d => (
                  <span
                    key={d}
                    style={{
                      background: '#fde8ea',
                      color: '#bb0013',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 3
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Best routing option summary */}
            {activeOption && (
              <div
                style={{
                  marginTop: 10,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 6,
                  padding: '8px 10px'
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#15803d',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4
                  }}
                >
                  Rekomendacja AI — wybrany wariant
                </div>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}
                >
                  {activeOption.option_name}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                  {activeOption.assigned_patients}/
                  {activeOption.total_patients_to_transfer} pacjentow
                  {' \u2022 '}~{activeOption.expected_transfer_minutes} min
                  {' \u2022 '}wynik: {activeOption.score_overall}/100
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    marginTop: 6
                  }}
                >
                  {activeOption.targets.map((t, ti) => {
                    const routeInfo = routes.find(
                      r => r.target_id === t.hospital_id
                    );
                    return (
                      <span
                        key={t.hospital_id}
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: 9,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 3,
                          borderLeft: `3px solid ${ROUTE_COLORS[ti % ROUTE_COLORS.length]}`
                        }}
                      >
                        {t.hospital_name} ({t.allocated_patients} pac.
                        {routeInfo
                          ? ` \u2022 ~${routeInfo.duration_min} min`
                          : ` \u2022 ${t.distance_km.toFixed(1)} km`}
                        )
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI disclaimer */}
            <div
              style={{
                marginTop: 8,
                padding: '6px 8px',
                background: '#f5f5f5',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 5
              }}
            >
              <svg
                viewBox="0 0 20 20"
                width="14"
                height="14"
                fill="#888"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 7h2v2H9V7zm0 4h2v4H9v-4z" />
              </svg>
              <span style={{ fontSize: 9, color: '#666', lineHeight: 1.4 }}>
                Opcje przekierowania wygenerowane przez AI. Sluza jako wsparcie
                decyzyjne — nie nalezy kierowac sie nimi w 100%. Ostateczna
                decyzja nalezy do sztabu kryzysowego.
              </span>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function HospitalLayer({
  hospitals,
  onSelectHospital,
  onDeselectHospital,
  atRiskHospitals
}: {
  hospitals: ApiHospital[];
  onSelectHospital?: (hospital: ApiHospital) => void;
  onDeselectHospital?: () => void;
  atRiskHospitals?: FloodRiskHospital[];
}) {
  const geoHospitals = hospitals.filter(
    h => h.latitude != null && h.longitude != null
  );

  // Track intentional selections so popupclose doesn't immediately undo them
  const justSelectedRef = useRef(false);

  const handleSelect = (hospital: ApiHospital) => {
    justSelectedRef.current = true;
    onSelectHospital?.(hospital);
    // Reset after a tick so future popupclose events work normally
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 100);
  };

  const handlePopupClose = () => {
    if (justSelectedRef.current) return; // skip – user just opened details
    onDeselectHospital?.();
  };

  const riskMap = useMemo(() => {
    const map = new Map<number, FloodRiskHospital>();
    if (atRiskHospitals) {
      for (const h of atRiskHospitals) map.set(h.id, h);
    }
    return map;
  }, [atRiskHospitals]);

  return (
    <>
      {geoHospitals.map(hospital => {
        const totalFree = hospital.departments.reduce(
          (s, d) => s + d.free_beds,
          0
        );
        const totalBeds = hospital.departments.reduce(
          (s, d) => s + (d.total_beds ?? 0),
          0
        );
        const ratio = totalBeds > 0 ? totalFree / totalBeds : 1;

        const riskInfo = riskMap.get(hospital.id);
        const isAtRisk = !!riskInfo;
        const isHighRisk = riskInfo?.station_risk_level === 'high';
        const isMedRisk = riskInfo?.station_risk_level === 'medium';

        // Color by flood risk first, then bed availability
        const fillColor = isHighRisk
          ? '#bb0013'
          : isMedRisk
            ? '#d97706'
            : ratio < 0.1
              ? '#bb0013'
              : ratio < 0.3
                ? '#d97706'
                : '#2d6c00';

        const borderColor = isHighRisk
          ? '#ff0000'
          : isMedRisk
            ? '#f59e0b'
            : fillColor;

        return (
          <React.Fragment key={hospital.id}>
            {/* Pulsing outer ring for at-risk hospitals */}
            {isAtRisk && (
              <CircleMarker
                center={[hospital.latitude!, hospital.longitude!]}
                radius={14}
                pane={MARKER_PANE}
                bubblingMouseEvents={false}
                pathOptions={{
                  color: borderColor,
                  weight: 2,
                  fillColor: borderColor,
                  fillOpacity: 0.15,
                  dashArray: isHighRisk ? '4 4' : '6 3'
                }}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[hospital.latitude!, hospital.longitude!]}
              radius={isAtRisk ? 9 : 8}
              pane={MARKER_PANE}
              bubblingMouseEvents={false}
              pathOptions={{
                color: borderColor,
                weight: isAtRisk ? 3 : 2,
                fillColor,
                fillOpacity: 0.85
              }}
              eventHandlers={{
                click: () => handleSelect(hospital),
                popupclose: handlePopupClose
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                className={
                  isAtRisk ? 'map-hospital-risk-label' : 'map-hospital-label'
                }
              >
                {isAtRisk && (isHighRisk ? '⚠ ' : '⚡ ')}
                {hospital.hospital_name}
              </Tooltip>
              <Popup className="map-hospital-popup">
                <HospitalPopupContent
                  hospital={hospital}
                  totalFree={totalFree}
                  totalBeds={totalBeds}
                  onOpenDetails={() => handleSelect(hospital)}
                />
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
}

/** Inline color map matching bucketMeta (for use in inline-styled popup). */
const BUCKET_COLORS: Record<
  string,
  { color: string; bg: string; icon: string }
> = {
  critical: { color: '#bb0013', bg: '#fde8ea', icon: '⚠' },
  elevated: { color: '#b45309', bg: '#fef3c7', icon: '⚡' },
  watch: { color: '#0369a1', bg: '#e0f2fe', icon: '◉' },
  safe: { color: '#2d6c00', bg: '#e8f5e0', icon: '✓' }
};

function HospitalPopupContent({
  hospital,
  totalFree,
  totalBeds,
  onOpenDetails
}: {
  hospital: ApiHospital;
  totalFree: number;
  totalBeds: number;
  onOpenDetails: () => void;
}) {
  const { data: mlPrediction, loading: mlLoading } = useMLHospitalPrediction(
    hospital.id
  );

  const ratio = totalBeds > 0 ? totalFree / totalBeds : 1;
  const bedLabel =
    ratio < 0.1 ? 'KRYTYCZNY' : ratio < 0.3 ? 'OGRANICZONY' : 'DOSTĘPNY';
  const bedColor =
    ratio < 0.1 ? '#bb0013' : ratio < 0.3 ? '#d97706' : '#2d6c00';

  // ML-based flood risk
  const bucket = mlPrediction
    ? bucketForProbability(mlPrediction.flood_warning_risk_probability)
    : 'safe';
  const meta = bucketMeta(bucket);
  const colors = BUCKET_COLORS[bucket] ?? BUCKET_COLORS.safe;

  return (
    <div style={{ minWidth: 220, fontFamily: 'inherit' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: 1.25
        }}
      >
        {hospital.hospital_name}
      </div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
        {hospital.address}
      </div>

      <div
        style={{
          marginTop: 8,
          padding: '6px 8px',
          background: mlLoading ? '#f5f5f5' : colors.bg,
          border: `1px solid ${mlLoading ? '#ccc' : colors.color}33`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        {mlLoading ? (
          <>
            <span style={{ fontSize: 14, color: '#888' }}>⏳</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                Analizowanie danych ML…
              </div>
            </div>
          </>
        ) : (
          <>
            <span style={{ color: colors.color, fontSize: 14 }}>
              {colors.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.color,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                Predykcja ML: {meta.label}
                {mlPrediction &&
                  typeof mlPrediction.flood_warning_risk_probability ===
                    'number' && (
                    <span style={{ fontWeight: 600, textTransform: 'none' }}>
                      {' '}
                      (
                      {(
                        mlPrediction.flood_warning_risk_probability * 100
                      ).toFixed(1)}
                      %)
                    </span>
                  )}
              </div>
              {mlPrediction?.nearest_station ? (
                <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>
                  {mlPrediction.nearest_station.station_name}
                  {typeof mlPrediction.nearest_station.distance_km ===
                    'number' && (
                    <>
                      {' · '}
                      {mlPrediction.nearest_station.distance_km.toFixed(1)} km
                    </>
                  )}
                </div>
              ) : !mlPrediction ? (
                <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>
                  Brak danych z modelu ML
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11
        }}
      >
        <span style={{ color: '#444' }}>
          Wolne łóżka: <strong>{totalFree}</strong> / {totalBeds}
        </span>
        <span
          style={{
            color: bedColor,
            fontWeight: 700,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          {bedLabel}
        </span>
      </div>
    </div>
  );
}

function RiskStationLayer({
  stations
}: {
  stations: FloodPredictionResponse['risk_stations'];
}) {
  return (
    <>
      {stations
        .filter(s => s.latitude != null && s.longitude != null)
        .map(station => {
          const isHigh = station.risk_level === 'high';
          const isMed = station.risk_level === 'medium';
          const color = isHigh ? '#bb0013' : isMed ? '#d97706' : '#0ea5e9';
          const icon = L.divIcon({
            className: 'river-station-icon',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -12],
            tooltipAnchor: [0, -12],
            html: `<div class="river-station" style="--rs-color:${color};">
              <span class="river-station__pulse"></span>
              <span class="river-station__body">
                <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                  <path fill="#ffffff" d="M2 4c2-2 4-2 6 0s4 2 6 0v2c-2 2-4 2-6 0s-4-2-6 0V4zm0 5c2-2 4-2 6 0s4 2 6 0v2c-2 2-4 2-6 0s-4-2-6 0V9z"/>
                </svg>
              </span>
            </div>`
          });
          return (
            <Marker
              key={station.station_id}
              position={[station.latitude, station.longitude]}
              icon={icon}
              pane={MARKER_PANE}
              bubblingMouseEvents={false}
            >
              <Tooltip
                direction="top"
                offset={[0, -6]}
                opacity={1}
                className="map-station-label"
              >
                {station.river} – {station.station_name}
              </Tooltip>
              <Popup>
                <strong>{station.station_name}</strong> ({station.river})
                <br />
                Poziom wody: {station.latest_water_level_cm} cm
                {typeof station.trend_cm_per_hour === 'number' &&
                  station.trend_cm_per_hour !== 0 && (
                    <>
                      <br />
                      Trend: {station.trend_cm_per_hour > 0 ? '+' : ''}
                      {station.trend_cm_per_hour.toFixed(1)} cm/h
                    </>
                  )}
                <br />
                <span
                  style={{
                    color,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }}
                >
                  Ryzyko:{' '}
                  {station.risk_level === 'high'
                    ? 'wysokie'
                    : station.risk_level === 'medium'
                      ? 'umiarkowane'
                      : 'niskie'}
                </span>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
}

const CAMERA_MARKER_HTML = `
<div class="cam-marker">
  <span class="cam-marker__pulse"></span>
  <span class="cam-marker__body">
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="#ffffff" d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  </span>
</div>
`;

const CAMERA_CLUSTER_HTML = (count: number) => `
<div class="cam-cluster">
  <span class="cam-cluster__pulse"></span>
  <span class="cam-cluster__body">
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path fill="#ffffff" d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
    <span class="cam-cluster__count">${count}</span>
  </span>
</div>
`;

function CameraLayer({
  onSelectCamera
}: {
  onSelectCamera: (camera: CameraFeed) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom())
  });

  const clustered = zoom < CAMERA_CLUSTER_ZOOM_THRESHOLD;

  const clusterCenter = useMemo<[number, number]>(() => {
    const lat =
      CAMERA_FEEDS.reduce((sum, c) => sum + c.lat, 0) / CAMERA_FEEDS.length;
    const lon =
      CAMERA_FEEDS.reduce((sum, c) => sum + c.lon, 0) / CAMERA_FEEDS.length;
    return [lat, lon];
  }, []);

  const cameraIcon = useMemo(
    () =>
      L.divIcon({
        className: 'cam-marker-wrap',
        html: CAMERA_MARKER_HTML,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        tooltipAnchor: [0, -16]
      }),
    []
  );

  const clusterIcon = useMemo(
    () =>
      L.divIcon({
        className: 'cam-cluster-wrap',
        html: CAMERA_CLUSTER_HTML(CAMERA_FEEDS.length),
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -21]
      }),
    []
  );

  if (clustered) {
    return (
      <Marker
        position={clusterCenter}
        icon={clusterIcon}
        pane={MARKER_PANE}
        bubblingMouseEvents={false}
        eventHandlers={{
          click: () =>
            map.flyTo(clusterCenter, CAMERA_CLUSTER_ZOOM_THRESHOLD + 1)
        }}
      />
    );
  }

  return (
    <>
      {CAMERA_FEEDS.map(camera => (
        <Marker
          key={camera.id}
          position={[camera.lat, camera.lon]}
          icon={cameraIcon}
          pane={MARKER_PANE}
          bubblingMouseEvents={false}
          eventHandlers={{
            click: () => onSelectCamera(camera)
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -18]}
            opacity={1}
            className="map-camera-label"
          >
            {camera.label}
          </Tooltip>
          <Popup>
            <strong>{camera.label}</strong>
            <br />
            Alert: {camera.alertText}
            <br />
            <button
              type="button"
              className="mt-1 font-semibold text-primary-dark underline"
              onClick={() => onSelectCamera(camera)}
            >
              Otwórz feed
            </button>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function FlyToHospital({ hospital }: { hospital: ApiHospital | null }) {
  const map = useMap();
  const prevRef = useRef<ApiHospital | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = hospital;

    if (hospital && hospital.latitude != null && hospital.longitude != null) {
      map.flyTo([hospital.latitude, hospital.longitude], 14, { duration: 0.8 });
    } else if (!hospital && prev) {
      // Hospital deselected — zoom back out
      map.flyTo(LUBELSKIE_CENTER, LUBELSKIE_INITIAL_ZOOM, { duration: 0.8 });
    }
  }, [map, hospital]);

  return null;
}

function FitToFeatures({
  powiaty,
  gminy,
  selectedPowiatId,
  selectedGminaId
}: {
  powiaty: TerritoryFeatureCollection | null;
  gminy: TerritoryFeatureCollection | null;
  selectedPowiatId: string | null;
  selectedGminaId: string | null;
}) {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!powiaty || initialized.current) return;
    const bounds = featureCollectionBounds(powiaty);
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
      initialized.current = true;
    }
  }, [map, powiaty]);

  useEffect(() => {
    if (!selectedPowiatId || !powiaty) return;
    const feature = powiaty.features.find(
      f => f.properties.id === selectedPowiatId
    );
    if (!feature) return;
    const bounds = featureBounds(feature);
    if (bounds) map.flyToBounds(bounds, { padding: [80, 80], duration: 0.6 });
  }, [map, powiaty, selectedPowiatId]);

  useEffect(() => {
    if (!selectedGminaId || !gminy) return;
    const feature = gminy.features.find(
      f => f.properties.id === selectedGminaId
    );
    if (!feature) return;
    const bounds = featureBounds(feature);
    if (bounds) map.flyToBounds(bounds, { padding: [100, 100], duration: 0.6 });
  }, [map, gminy, selectedGminaId]);

  return null;
}

function featureCollectionBounds(
  fc: TerritoryFeatureCollection
): LatLngBoundsExpression | null {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  for (const feature of fc.features) {
    const b = featureBounds(feature);
    if (!b) continue;
    const [sw, ne] = b as [[number, number], [number, number]];
    minLat = Math.min(minLat, sw[0]);
    minLon = Math.min(minLon, sw[1]);
    maxLat = Math.max(maxLat, ne[0]);
    maxLon = Math.max(maxLon, ne[1]);
  }
  if (!Number.isFinite(minLat)) return null;
  return [
    [minLat, minLon],
    [maxLat, maxLon]
  ];
}

function featureBounds(
  feature: TerritoryFeature
): LatLngBoundsExpression | null {
  const coords = collectCoords(feature.geometry);
  if (coords.length === 0) return null;
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  for (const [lon, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return [
    [minLat, minLon],
    [maxLat, maxLon]
  ];
}

function collectCoords(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
): Array<[number, number]> {
  if (geom.type === 'Polygon') {
    return geom.coordinates.flat() as Array<[number, number]>;
  }
  return geom.coordinates.flat(2) as Array<[number, number]>;
}

/* ── Emergency 112 call markers ── */

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#bb0013',
  high: '#e65100',
  medium: '#f59e0b',
  low: '#6b7280'
};

const CATEGORY_ICONS: Record<string, string> = {
  medical: '🏥',
  fire: '🔥',
  accident: '🚗',
  flood: '🌊',
  infrastructure: '🏗️',
  other: '⚠️'
};

function emergencyMarkerHtml(priority: string, category: string) {
  const color = PRIORITY_COLORS[priority] ?? '#6b7280';
  const icon = CATEGORY_ICONS[category] ?? '⚠️';
  return `
<div style="position:relative;width:36px;height:36px;">
  <span style="position:absolute;inset:0;border-radius:50%;background:${color}30;animation:mock-pulse 2s ease-in-out infinite;"></span>
  <span style="position:absolute;inset:4px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 10px ${color}60;">
    <span style="font-size:14px;line-height:1;">${icon}</span>
  </span>
</div>`;
}

function EmergencyCallLayer({
  onSelectEmergency
}: {
  onSelectEmergency?: (call: EmergencyCall) => void;
}) {
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const call of EMERGENCY_CALLS) {
      const key = `${call.priority}-${call.category}`;
      if (!map.has(key)) {
        map.set(
          key,
          L.divIcon({
            className: 'emergency-marker-wrap',
            html: emergencyMarkerHtml(call.priority, call.category),
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
          })
        );
      }
    }
    return map;
  }, []);

  return (
    <>
      {EMERGENCY_CALLS.map(call => {
        const key = `${call.priority}-${call.category}`;
        const icon = icons.get(key)!;
        const color = PRIORITY_COLORS[call.priority] ?? '#6b7280';
        return (
          <Marker
            key={call.id}
            position={[call.lat, call.lon]}
            icon={icon}
            pane={MARKER_PANE}
            bubblingMouseEvents={false}
            eventHandlers={{
              click: () => onSelectEmergency?.(call)
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -20]}
              opacity={1}
              className="map-camera-label"
            >
              112 · {call.title}
            </Tooltip>
            <Popup maxWidth={280}>
              <div style={{ fontFamily: 'inherit' }}>
                <div
                  style={{
                    background: color,
                    color: '#fff',
                    padding: '6px 12px',
                    margin: '-12px -14px 0',
                    borderRadius: '3px 3px 0 0',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>112</span>
                  <span style={{ opacity: 0.7 }}>·</span>
                  <span>
                    {call.priority === 'critical'
                      ? 'KRYTYCZNE'
                      : call.priority === 'high'
                        ? 'WYSOKIE'
                        : call.priority === 'medium'
                          ? 'ŚREDNIE'
                          : 'NISKIE'}
                  </span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700 }}>
                  {call.title}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: '#555' }}>
                  {call.location}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
                  {call.description.slice(0, 120)}...
                </div>
                {call.assignedUnit && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#888' }}>
                    Jednostka: <strong>{call.assignedUnit}</strong>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
