// ── Voice control ──

export type VoiceAction = {
  action:
    | 'switch_tab'
    | 'open_panel'
    | 'close_panel'
    | 'search_territory'
    | 'toggle_layer'
    | 'info';
  tab?: 'map' | 'hospitals';
  panel?: PanelId;
  territory_name?: string;
  territory_type?: 'powiat' | 'gmina';
  layer?: keyof LayerToggles;
  layer_enabled?: boolean;
  confirmation_text: string;
};

export type CameraAlert = 'good' | 'meh' | 'bad';

export type CameraFeed = {
  id: string;
  label: string;
  playerId: string;
  pageUrl: string;
  lat: number;
  lon: number;
  alertLevel: CameraAlert;
  alertText: string;
};

export type TerritoryKind = 'powiat' | 'gmina';

export type TerritoryProperties = {
  id: string;
  name: string;
  fullName: string;
  teryt: string | null;
  kind: TerritoryKind;
  adminType?: string;
};

export type TerritoryFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  TerritoryProperties
>;

export type TerritoryFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  TerritoryProperties
>;

export type PanelId = 'map' | 'live' | 'layers' | 'risk' | 'files' | 'social';

// ── Emergency 112 calls ──

export type EmergencyPriority = 'critical' | 'high' | 'medium' | 'low';
export type EmergencyCategory =
  | 'medical'
  | 'fire'
  | 'accident'
  | 'flood'
  | 'infrastructure'
  | 'other';

export type EmergencyCall = {
  id: string;
  timestamp: string;
  priority: EmergencyPriority;
  category: EmergencyCategory;
  title: string;
  description: string;
  location: string;
  lat: number;
  lon: number;
  callerName: string;
  callerPhone: string;
  status: 'new' | 'dispatched' | 'in-progress' | 'resolved';
  assignedUnit?: string;
  notes?: string;
};

export type LayerToggles = {
  hospitals: boolean;
  floodZones: boolean;
  cameras: boolean;
  emergencyCalls: boolean;
  powiatBoundaries: boolean;
  gminaBoundaries: boolean;
};

export type RiverStatus = {
  name: string;
  level: string;
  status: 'critical' | 'warning' | 'stable';
};

// ── Flood prediction ──

export type FloodRiskStation = {
  station_id: string;
  station_name: string;
  river: string;
  latitude: number;
  longitude: number;
  latest_water_level_cm: number;
  median_water_level_cm: number | null;
  trend_cm_per_hour: number;
  risk_score: number;
  risk_level: string;
};

export type FloodRiskHospital = {
  id: number;
  hospital_name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_free_beds: number;
  total_beds: number;
  nearest_risk_station_id: string;
  nearest_risk_station_name: string;
  distance_km: number;
  station_risk_level: string;
  station_risk_score: number;
};

export type FloodPredictionResponse = {
  source: string;
  prediction_generated_at: string;
  history_points_per_station: number;
  risk_stations_count: number;
  risk_stations: FloodRiskStation[];
  at_risk_hospitals_count: number;
  at_risk_hospitals: FloodRiskHospital[];
};

// ── ML prediction (per-hospital) ──

export type MLPredictionNearestStation = {
  station_id: string;
  station_name: string;
  river: string;
  distance_km: number;
  station_water_level_cm: number;
  station_flow_m3s: number;
};

export type MLHospitalPrediction = {
  predicted_at: string;
  hospital: {
    hospital_id: number;
    hospital_name: string;
    address: string;
    latitude: number;
    longitude: number;
    total_beds: number;
    free_beds: number;
  };
  flood_warning_risk_probability: number;
  predicted_warning_risk: number;
  nearest_station: MLPredictionNearestStation;
  features: Record<string, number>;
  model_path: string;
};

// ── ML prediction (global / regional) ──

export type MLGlobalPrediction = {
  predicted_at: string;
  flood_warning_risk_probability: number;
  predicted_warning_risk: number;
  features: Record<string, number>;
  model_path: string;
};

export type ApiHospitalDepartment = {
  department_id: number;
  department_name: string;
  free_beds: number;
  total_beds: number | null;
  source_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type ApiHospital = {
  id: number;
  hospital_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  departments: ApiHospitalDepartment[];
  has_sor?: boolean;
  generator_fuel_hours?: number | null;
  staff_count?: number | null;
  doctors_on_duty?: number | null;
};

export type ApiHospitalListResponse = {
  hospitals: ApiHospital[];
};

export type ApiDepartmentSummary = {
  id: number;
  name: string;
  report_url: string;
  created_at: string;
  updated_at: string;
};

export type ApiStats = {
  hospitals: number;
  departments: number;
  hospital_departments: number;
  hospitals_missing_coordinates: number;
  last_refresh_at: string;
  last_successful_ingestion_at: string;
};

// ── Flood overview (IMGW) ──

export type FloodOverviewStation = {
  station_id: string;
  station_name: string;
  river: string;
  voivodeship: string;
  latitude: number;
  longitude: number;
  water_level_cm: number;
  measured_at: string;
};

export type FloodOverviewResponse = {
  source: string;
  hydro_warnings_count: number;
  hydro_warnings: Record<string, unknown>[];
  meteo_flood_like_warnings_count: number;
  meteo_flood_like_warnings: Record<string, unknown>[];
  lubelskie_station_count: number;
  lubelskie_top_stations: FloodOverviewStation[];
};

// ── Mock flood routing options ──

export type MockFloodAllocation = {
  source_department_name: string;
  target_department_name: string;
  patients: number;
};

export type MockFloodTarget = {
  hospital_id: number;
  hospital_name: string;
  address: string;
  distance_km: number;
  free_beds_before: number;
  free_beds_after: number;
  allocated_patients: number;
  capacity_score: number;
  distance_score: number;
  department_match_score: number;
  allocations: MockFloodAllocation[];
};

export type MockFloodOption = {
  option_id: string;
  option_name: string;
  strategy: string;
  total_patients_to_transfer: number;
  assigned_patients: number;
  unassigned_patients: number;
  expected_transfer_minutes: number;
  score_overall: number;
  score_capacity: number;
  score_distance: number;
  score_department_match: number;
  score_execution_complexity: number;
  targets: MockFloodTarget[];
};

export type MockFloodRoutingResponse = {
  scenario_id: string;
  generated_at: string;
  flood_alert_level: string;
  impacted_hospital_id: number;
  impacted_hospital_name: string;
  impacted_hospital_address: string;
  impacted_water_level_cm: number;
  impacted_departments: string[];
  options: MockFloodOption[];
};
