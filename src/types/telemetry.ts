export type Language = 'ar' | 'en' | 'fr';

export type ModuleId = 'gis' | 'hydrology' | 'wildfire' | 'analytics' | 'architecture';

export type AnomalyType = 'wildfire_risk' | 'desertification_hotspot' | 'water_stress';

export type SpectralIndexMode = 'NDVI' | 'NDWI' | 'LST';

export type ReportCategory = 'smoke_alert' | 'illegal_logging' | 'water_leak' | 'sand_encroachment';

export type VerificationStatus = 'pending_inspection' | 'under_inspection' | 'verified' | 'resolved';

export type CropType = 'olive' | 'date_palm' | 'durum_wheat' | 'citrus' | 'steppe_forage';

export interface WilayaMetric {
  id: number;
  wilaya_code: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  ecosystem: 'mediterranean' | 'high_plateaus' | 'saharan';
  lat: number;
  lng: number;
  ndvi_history: Record<number, number>; // year -> NDVI (0..1)
  ndwi_current: number;
  lst_celsius: number;
  precipitation_anomaly_pct: number;
  soil_moisture_pct: number;
  forest_cover_pct: number;
  desertification_front_km: number;
}

export interface TelemetryStation {
  id: number;
  station_code: string;
  name_ar: string;
  name_en: string;
  station_type: 'meteorological' | 'wildfire_sentinel' | 'hydro_soil';
  wilaya_code: string;
  lat: number;
  lng: number;
  is_active: boolean;
  temperature: number;
  humidity: number;
  wind_speed: number;
  fuel_dryness: number;
  soil_moisture: number;
  ndvi_index: number;
  last_ping: string;
}

export interface SpatialAnomaly {
  id: number;
  anomaly_type: AnomalyType;
  severity_level: 1 | 2 | 3 | 4 | 5;
  wilaya_name_ar: string;
  wilaya_name_en: string;
  description_ar: string;
  description_en: string;
  lat: number;
  lng: number;
  status: 'active' | 'under_inspection' | 'resolved';
  detected_at: string;
  year_detected: number;
}

export interface WaterReservoir {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  wilaya_ar: string;
  wilaya_en: string;
  lat: number;
  lng: number;
  capacity_mcm: number;
  current_fill_pct: number;
  inflow_m3s: number;
  outflow_m3s: number;
  groundwater_depletion_m_yr: number;
  precipitation_anomaly_pct: number;
}

export interface FieldReport {
  id: number;
  encrypted_hash: string;
  category: ReportCategory;
  details: string;
  lat: number;
  lng: number;
  wilaya_label?: string;
  is_anonymous: boolean;
  photo_attached?: boolean;
  photo_name?: string;
  verification_status: VerificationStatus;
  created_at: string;
  synced_from_offline?: boolean;
}

export interface OfflineQueuedReport {
  local_id: string;
  category: ReportCategory;
  details: string;
  lat: number;
  lng: number;
  is_anonymous: boolean;
  photo_attached?: boolean;
  photo_name?: string;
  queued_at: string;
}

export interface DispatchAlert {
  id: string;
  station_code: string;
  fwi_score: number;
  severity: 'extreme' | 'high' | 'moderate';
  message_ar: string;
  message_en: string;
  triggered_at: string;
  webhook_target: string;
}

export interface FwiInput {
  temperature: number;
  humidity: number;
  wind_speed: number;
  fuel_dryness: number;
}

export interface FwiResult {
  fwi_score: number;
  risk_code: 'extreme' | 'high' | 'moderate' | 'low';
  risk_level_ar: string;
  risk_level_en: string;
  risk_level_fr: string;
  action_ar: string;
  action_en: string;
  alert_triggered: boolean;
}

export interface ClimateSeriesPoint {
  label: string;
  dateIndex: number;
  tempAnomalyC: number;
  meanNdvi: number;
  reservoirFillPct: number;
  fwiMean: number;
}

export interface GeoJsonCorridors {
  greenDamBelt: Array<[number, number]>;
  sandEncroachmentVectors: Array<{
    name_ar: string;
    name_en: string;
    from: [number, number];
    to: [number, number];
    velocity_m_yr: number;
  }>;
}

export interface StationReadingPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

export type StationHistoryMap = Record<string, StationReadingPoint[]>;

