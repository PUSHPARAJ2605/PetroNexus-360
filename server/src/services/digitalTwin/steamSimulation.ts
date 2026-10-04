import { calculateWeatherImpact, WeatherConditions } from './weatherImpact';

export interface SteamSimulationInput {
  steamPressure: number;       // bar (e.g. 70 - 110)
  steamTemperature: number;    // °C (e.g. 260 - 320)
  steamFlowRate: number;       // t/hr (e.g. 1.5 - 6.0)
  injectionDurationDays: number;// days (e.g. 5 - 30)
  pipeLengthMeters?: number;   // meters (e.g. 450)
  weather?: WeatherConditions;
}

export interface SteamSimulationResult {
  steamConsumptionTonnes: number;
  energyRequirementMWh: number;
  steamQualityAtWellheadPct: number;
  wellheadPressureBar: number;
  wellheadTemperatureC: number;
  totalHeatLossPct: number;
  surfaceHeatLossPct: number;
  specificEnthalpyKJkg: number;
}

/**
 * Simulates steam transport from Once-Through Steam Generator (OTSG) to Wellhead.
 * Calculates thermodynamic enthalpy, quality degradation, and cumulative energy consumption.
 */
export function simulateSteamTransport(input: SteamSimulationInput): SteamSimulationResult {
  const {
    steamPressure,
    steamTemperature,
    steamFlowRate,
    injectionDurationDays,
    pipeLengthMeters = 450,
    weather = { ambientTemperature: 32, humidity: 40, windSpeed: 20 },
  } = input;

  const hours = injectionDurationDays * 24;
  const steamConsumptionTonnes = parseFloat((steamFlowRate * hours).toFixed(1));

  // Saturated steam enthalpy calculation approximation (kJ/kg)
  // At ~80-100 bar, latent heat ~ 1400 kJ/kg + sensible heat ~ 1300 kJ/kg = ~2750 kJ/kg
  const baseEnthalpy = 2100 + (steamTemperature * 2.1) + (steamPressure * 1.8);
  const specificEnthalpyKJkg = parseFloat(baseEnthalpy.toFixed(1));

  // Energy requirement in MWh = (Tonnes * 1000 kg * enthalpy in kJ / 3.6e6 kJ/MWh)
  const energyRequirementMWh = parseFloat(((steamConsumptionTonnes * 1000 * baseEnthalpy) / 3600000).toFixed(1));

  // Calculate weather-induced surface heat loss
  const weatherImpact = calculateWeatherImpact(weather);
  const surfaceHeatLossPct = weatherImpact.surfaceHeatLossPct;

  // Pipeline length friction loss: ~0.4 bar per 100m at normal velocity
  const frictionLossBar = (pipeLengthMeters / 100) * (0.35 + (steamFlowRate / 5) * 0.15);
  const wellheadPressureBar = parseFloat(Math.max(20, steamPressure - frictionLossBar).toFixed(2));

  // Line temperature drop: ~3.5°C per 100m depending on heat loss
  const tempDrop = (pipeLengthMeters / 100) * (2.8 * (surfaceHeatLossPct / 5));
  const wellheadTemperatureC = parseFloat(Math.max(150, steamTemperature - tempDrop).toFixed(1));

  // Steam quality starts ~80-85% at generator and degrades along the line
  const qualityDrop = (surfaceHeatLossPct * 0.9) + (pipeLengthMeters / 500) * 1.5;
  const steamQualityAtWellheadPct = parseFloat(Math.max(60, 84 - qualityDrop).toFixed(1));

  const totalHeatLossPct = parseFloat((surfaceHeatLossPct + (qualityDrop * 0.5)).toFixed(2));

  return {
    steamConsumptionTonnes,
    energyRequirementMWh,
    steamQualityAtWellheadPct,
    wellheadPressureBar,
    wellheadTemperatureC,
    totalHeatLossPct,
    surfaceHeatLossPct,
    specificEnthalpyKJkg,
  };
}
