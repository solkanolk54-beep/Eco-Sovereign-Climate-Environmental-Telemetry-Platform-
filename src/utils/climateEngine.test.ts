import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFireWeatherIndex,
  calculateDroughtAndFloodRisk,
  calculateCropIrrigationAdvisory,
  simulatePolicyImpact,
  validateFieldReportPayload,
  computeClimateAnalyticsKpis,
} from './climateEngine';

test('calculateFireWeatherIndex classifies extreme red alert when score >= 80', () => {
  const result = calculateFireWeatherIndex({
    temperature: 45,
    humidity: 12,
    wind_speed: 42,
    fuel_dryness: 28,
  });
  assert.equal(result.alert_triggered, true);
  assert.equal(result.risk_code, 'extreme');
  assert.ok(result.fwi_score >= 80);
});

test('calculateFireWeatherIndex classifies low risk in cool humid weather', () => {
  const result = calculateFireWeatherIndex({
    temperature: 18,
    humidity: 72,
    wind_speed: 8,
    fuel_dryness: 5,
  });
  assert.equal(result.alert_triggered, false);
  assert.equal(result.risk_code, 'low');
  assert.ok(result.fwi_score < 35);
});

test('calculateDroughtAndFloodRisk scores severe drought and flash-flood dynamics', () => {
  const drought = calculateDroughtAndFloodRisk({
    precipitation_anomaly_pct: -48,
    soil_moisture_pct: 12,
    lst_celsius: 41,
    reservoir_fill_pct: 24,
  });
  assert.equal(drought.drought_tier, 'critical');
  assert.ok(drought.drought_risk_score >= 70);
  assert.equal(drought.flood_tier, 'low');

  const flashFlood = calculateDroughtAndFloodRisk({
    precipitation_anomaly_pct: 58,
    soil_moisture_pct: 14,
    lst_celsius: 30,
    reservoir_fill_pct: 68,
  });
  assert.equal(flashFlood.flood_tier, 'warning');
  assert.ok(flashFlood.flash_flood_risk_score >= 65);
});

test('calculateCropIrrigationAdvisory computes ETc and drip water savings', () => {
  const adv = calculateCropIrrigationAdvisory({
    crop_type: 'olive',
    et0_mm_day: 6.4,
    soil_moisture_pct: 16,
    area_hectares: 10,
  });
  assert.equal(adv.crop_kc, 0.65);
  assert.equal(adv.etc_mm_day, 4.16);
  assert.equal(adv.schedule_code, 'immediate_drip');
  assert.ok(adv.recommended_m3_day > 0);
  assert.ok(adv.drip_savings_m3_day > 0);
});

test('simulatePolicyImpact scales carbon sequestration and water resilience monotonically', () => {
  const low = simulatePolicyImpact({
    reforestation_hectares: 50000,
    irrigation_efficiency_pct: 10,
    groundwater_quota_pct: 5,
  });
  const high = simulatePolicyImpact({
    reforestation_hectares: 350000,
    irrigation_efficiency_pct: 45,
    groundwater_quota_pct: 30,
  });
  assert.ok(high.carbon_sequestration_kt_yr > low.carbon_sequestration_kt_yr);
  assert.ok(high.water_resilience_gain_pct > low.water_resilience_gain_pct);
  assert.ok(high.projected_ndvi_delta > low.projected_ndvi_delta);
});

test('validateFieldReportPayload rejects short details and out-of-bounds coords', () => {
  const badDetails = validateFieldReportPayload({
    category: 'smoke_alert',
    details: 'abc',
    lat: 36.4,
    lng: 6.2,
  });
  assert.equal(badDetails.valid, false);
  assert.equal(badDetails.error, 'DETAILS_TOO_SHORT');

  const badCoords = validateFieldReportPayload({
    category: 'water_leak',
    details: 'Major pipeline rupture near irrigation canal',
    lat: 120,
    lng: 6.2,
  });
  assert.equal(badCoords.valid, false);
  assert.equal(badCoords.error, 'INVALID_LATITUDE');

  const ok = validateFieldReportPayload({
    category: 'smoke_alert',
    details: 'Dense smoke rising on northern pine ridge',
    lat: 36.45,
    lng: 6.26,
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.isWithinAlgeriaBounds, true);
});

test('computeClimateAnalyticsKpis derives FWI average, NDVI delta, water stress, and warning flag', () => {
  const kpis = computeClimateAnalyticsKpis([
    { label: 'D1', dateIndex: 1, tempAnomalyC: 1.4, meanNdvi: 0.42, reservoirFillPct: 50, fwiMean: 50 },
    { label: 'D2', dateIndex: 2, tempAnomalyC: 2.1, meanNdvi: 0.36, reservoirFillPct: 35, fwiMean: 74 },
  ]);
  assert.equal(kpis.meanFwi, 62);
  assert.equal(kpis.fwiDeltaPct, 48);
  assert.equal(kpis.latestNdvi, 0.36);
  assert.equal(kpis.ndviDelta, -0.06);
  assert.equal(kpis.waterStressPct, 65);
  assert.equal(kpis.waterStressDelta, 15);
  assert.equal(kpis.earlyWarningActive, true);
});

