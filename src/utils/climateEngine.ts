import type {
  ClimateSeriesPoint,
  CropType,
  FwiInput,
  FwiResult,
  ReportCategory,
} from '../types/telemetry';

/**
 * Computes real-time Fire Weather Index (FWI) using meteorological and fuel dryness inputs.
 * Formula aligned with backend specification:
 * base_score = (temp * 1.6) - (humidity * 0.75) + (wind_speed * 1.3) + (fuel_dryness * 2.2)
 * normalized to 0..100 over 160.0 scale.
 */
export function calculateFireWeatherIndex(input: FwiInput): FwiResult {
  const { temperature, humidity, wind_speed, fuel_dryness } = input;
  const clampedHumidity = Math.max(0, Math.min(100, humidity));
  const clampedWind = Math.max(0, wind_speed);
  const clampedDryness = Math.max(0, fuel_dryness);

  const baseScore =
    temperature * 1.6 - clampedHumidity * 0.75 + clampedWind * 1.3 + clampedDryness * 2.2;
  const rawNormalized = (baseScore / 160.0) * 100.0;
  const fwi_score = Math.round(Math.max(0, Math.min(100, rawNormalized)) * 100) / 100;

  if (fwi_score >= 80) {
    return {
      fwi_score,
      risk_code: 'extreme',
      risk_level_ar: 'حرجة جداً (إنذار أحمر)',
      risk_level_en: 'Extreme Risk (Red Alert)',
      risk_level_fr: 'Risque Extrême (Alerte Rouge)',
      action_ar: 'إرسال إنذار فوري لفرق التدخل السريع والحماية المدنية مع إحداثيات البؤرة',
      action_en: 'Dispatch rapid intervention units immediately with geofenced coordinates',
      alert_triggered: true,
    };
  }

  if (fwi_score >= 60) {
    return {
      fwi_score,
      risk_code: 'high',
      risk_level_ar: 'مرتفعة (حالة تأهب)',
      risk_level_en: 'High Risk (Elevated Alert)',
      risk_level_fr: 'Risque Élevé (Alerte)',
      action_ar: 'وضع الوحدات الميدانية وأبراج المراقبة في حالة تأهب قصوى',
      action_en: 'Place forestry rangers and observation towers on standby alert',
      alert_triggered: true,
    };
  }

  if (fwi_score >= 35) {
    return {
      fwi_score,
      risk_code: 'moderate',
      risk_level_ar: 'متوسطة (مراقبة مستمرة)',
      risk_level_en: 'Moderate Risk (Routine Watch)',
      risk_level_fr: 'Risque Modéré',
      action_ar: 'مراقبة روتينية عبر المستشعرات والأقمار الصناعية',
      action_en: 'Continue automated satellite and IoT station monitoring',
      alert_triggered: false,
    };
  }

  return {
    fwi_score,
    risk_code: 'low',
    risk_level_ar: 'منخفضة (ضمن المستويات الطبيعية)',
    risk_level_en: 'Low Risk (Nominal)',
    risk_level_fr: 'Risque Faible (Nominal)',
    action_ar: 'استقرار بيئي — لا يتطلب تدخل ميداني',
    action_en: 'Nominal conditions — no intervention required',
    alert_triggered: false,
  };
}

export interface DroughtFloodInput {
  precipitation_anomaly_pct: number; // e.g., -42% to +65%
  soil_moisture_pct: number; // 0..100
  lst_celsius: number; // Land surface temperature
  reservoir_fill_pct: number; // 0..100
}

export interface DroughtFloodResult {
  drought_risk_score: number;
  flash_flood_risk_score: number;
  drought_tier: 'critical' | 'elevated' | 'nominal';
  flood_tier: 'warning' | 'watch' | 'low';
}

export function calculateDroughtAndFloodRisk(input: DroughtFloodInput): DroughtFloodResult {
  const deficitComponent = Math.max(0, -input.precipitation_anomaly_pct) * 0.85;
  const moistureComponent = Math.max(0, 45 - input.soil_moisture_pct) * 0.9;
  const heatComponent = Math.max(0, input.lst_celsius - 28) * 1.1;
  const reservoirComponent = Math.max(0, 60 - input.reservoir_fill_pct) * 0.45;

  const drought_risk_score = Math.round(
    Math.max(0, Math.min(100, deficitComponent + moistureComponent + heatComponent + reservoirComponent))
  );

  // Flash floods occur in semi-arid basins when high positive precipitation anomaly hits dry crusted soil
  const excessRain = Math.max(0, input.precipitation_anomaly_pct - 10) * 1.25;
  const soilCrustFactor = input.soil_moisture_pct < 20 ? 18 : 6;
  const flash_flood_risk_score = Math.round(
    Math.max(0, Math.min(100, excessRain + (input.precipitation_anomaly_pct > 25 ? soilCrustFactor : 0)))
  );

  const drought_tier =
    drought_risk_score >= 70 ? 'critical' : drought_risk_score >= 45 ? 'elevated' : 'nominal';
  const flood_tier =
    flash_flood_risk_score >= 65 ? 'warning' : flash_flood_risk_score >= 35 ? 'watch' : 'low';

  return {
    drought_risk_score,
    flash_flood_risk_score,
    drought_tier,
    flood_tier,
  };
}

const CROP_KC_MAP: Record<CropType, { kc: number; label_ar: string; label_en: string; optimal_moisture: number }> = {
  olive: { kc: 0.65, label_ar: 'الزيتون', label_en: 'Olive Groves', optimal_moisture: 28 },
  date_palm: { kc: 0.9, label_ar: 'النخيل الصحراوي', label_en: 'Date Palm', optimal_moisture: 32 },
  durum_wheat: { kc: 1.05, label_ar: 'القمح الصلب', label_en: 'Durum Wheat', optimal_moisture: 36 },
  citrus: { kc: 0.75, label_ar: 'الحمضيات', label_en: 'Citrus Orchards', optimal_moisture: 34 },
  steppe_forage: { kc: 0.45, label_ar: 'المراعي السهبية', label_en: 'Steppe Forage', optimal_moisture: 22 },
};

export interface IrrigationAdvisoryInput {
  crop_type: CropType;
  et0_mm_day: number;
  soil_moisture_pct: number;
  area_hectares: number;
}

export interface IrrigationAdvisoryResult {
  crop_kc: number;
  etc_mm_day: number;
  recommended_m3_day: number;
  drip_savings_m3_day: number;
  schedule_code: 'immediate_drip' | 'scheduled_night' | 'hold_irrigation';
}

export function calculateCropIrrigationAdvisory(
  input: IrrigationAdvisoryInput
): IrrigationAdvisoryResult {
  const spec = CROP_KC_MAP[input.crop_type];
  const etc_mm_day = Math.round(spec.kc * Math.max(0.5, input.et0_mm_day) * 100) / 100;
  // 1 mm/day over 1 hectare = 10 m3/day
  const deficitMultiplier =
    input.soil_moisture_pct < spec.optimal_moisture - 8
      ? 1.15
      : input.soil_moisture_pct > spec.optimal_moisture + 8
        ? 0.35
        : 0.85;

  const grossFloodM3 = etc_mm_day * 10 * Math.max(1, input.area_hectares) * deficitMultiplier;
  // Precision drip reduces evaporation loss by ~38% compared to open-channel flood irrigation
  const recommended_m3_day = Math.round(grossFloodM3 * 0.62 * 10) / 10;
  const drip_savings_m3_day = Math.round((grossFloodM3 - recommended_m3_day) * 10) / 10;

  const schedule_code =
    input.soil_moisture_pct < spec.optimal_moisture - 8
      ? 'immediate_drip'
      : input.soil_moisture_pct > spec.optimal_moisture + 8
        ? 'hold_irrigation'
        : 'scheduled_night';

  return {
    crop_kc: spec.kc,
    etc_mm_day,
    recommended_m3_day,
    drip_savings_m3_day,
    schedule_code,
  };
}

export interface PolicySimulationInput {
  reforestation_hectares: number; // 0..500,000 ha
  irrigation_efficiency_pct: number; // 0..60%
  groundwater_quota_pct: number; // 0..40%
}

export interface PolicySimulationResult {
  carbon_sequestration_kt_yr: number;
  water_resilience_gain_pct: number;
  desertification_halted_km2: number;
  projected_ndvi_delta: number;
}

export function simulatePolicyImpact(input: PolicySimulationInput): PolicySimulationResult {
  const ha = Math.max(0, Math.min(500000, input.reforestation_hectares));
  const irr = Math.max(0, Math.min(60, input.irrigation_efficiency_pct));
  const gw = Math.max(0, Math.min(40, input.groundwater_quota_pct));

  // Semi-arid Mediterranean/Saharan Aleppo pine & Acacia corridors sequester ~4.2 tCO2/ha/yr
  const carbon_sequestration_kt_yr = Math.round(((ha * 4.2) / 1000) * 10) / 10;
  const water_resilience_gain_pct = Math.round((irr * 0.58 + gw * 0.65 + (ha / 500000) * 8) * 10) / 10;
  const desertification_halted_km2 = Math.round((ha / 100) * 1.35 + irr * 18);
  const projected_ndvi_delta = Math.round(((ha / 500000) * 0.095 + (irr / 60) * 0.035) * 1000) / 1000;

  return {
    carbon_sequestration_kt_yr,
    water_resilience_gain_pct,
    desertification_halted_km2,
    projected_ndvi_delta,
  };
}

export interface FieldReportValidationInput {
  category: string;
  details: string;
  lat: number;
  lng: number;
}

const VALID_CATEGORIES: ReportCategory[] = [
  'smoke_alert',
  'illegal_logging',
  'water_leak',
  'sand_encroachment',
];

export function validateFieldReportPayload(input: FieldReportValidationInput): {
  valid: boolean;
  error?: string;
  isWithinAlgeriaBounds: boolean;
} {
  if (!VALID_CATEGORIES.includes(input.category as ReportCategory)) {
    return { valid: false, error: 'INVALID_CATEGORY', isWithinAlgeriaBounds: false };
  }
  if (!input.details || input.details.trim().length < 5) {
    return { valid: false, error: 'DETAILS_TOO_SHORT', isWithinAlgeriaBounds: false };
  }
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
    return { valid: false, error: 'INVALID_LATITUDE', isWithinAlgeriaBounds: false };
  }
  if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
    return { valid: false, error: 'INVALID_LONGITUDE', isWithinAlgeriaBounds: false };
  }

  // Algeria bounding box approx: lat 18.9..37.2, lng -8.7..12.0
  const isWithinAlgeriaBounds =
    input.lat >= 18.9 && input.lat <= 37.2 && input.lng >= -8.7 && input.lng <= 12.0;

  return { valid: true, isWithinAlgeriaBounds };
}

export interface ClimateAnalyticsKpiSummary {
  meanFwi: number;
  fwiDeltaPct: number;
  latestNdvi: number;
  ndviDelta: number;
  waterStressPct: number;
  waterStressDelta: number;
  earlyWarningActive: boolean;
}

export function computeClimateAnalyticsKpis(
  points: ClimateSeriesPoint[]
): ClimateAnalyticsKpiSummary {
  if (points.length === 0) {
    return {
      meanFwi: 0,
      fwiDeltaPct: 0,
      latestNdvi: 0,
      ndviDelta: 0,
      waterStressPct: 0,
      waterStressDelta: 0,
      earlyWarningActive: false,
    };
  }

  const first = points[0];
  const latest = points[points.length - 1];
  const meanFwi =
    Math.round((points.reduce((acc, p) => acc + p.fwiMean, 0) / points.length) * 10) / 10;
  const fwiDeltaPct =
    first.fwiMean > 0
      ? Math.round(((latest.fwiMean - first.fwiMean) / first.fwiMean) * 100)
      : 0;

  const latestNdvi = Math.round(latest.meanNdvi * 100) / 100;
  const ndviDelta = Math.round((latest.meanNdvi - first.meanNdvi) * 1000) / 1000;

  const firstStress = Math.round(100 - first.reservoirFillPct);
  const waterStressPct = Math.round(100 - latest.reservoirFillPct);
  const waterStressDelta = waterStressPct - firstStress;

  return {
    meanFwi,
    fwiDeltaPct,
    latestNdvi,
    ndviDelta,
    waterStressPct,
    waterStressDelta,
    earlyWarningActive: meanFwi >= 60 || waterStressPct >= 55,
  };
}

