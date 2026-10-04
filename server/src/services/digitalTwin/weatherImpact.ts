export interface WeatherConditions {
  ambientTemperature: number; // °C
  humidity: number;           // %
  windSpeed: number;          // km/h
  rainfall?: number;          // mm
}

export interface WeatherImpactResult {
  surfaceHeatLossPct: number;
  convectiveLossFactor: number;
  impactLevel: 'LOW' | 'MODERATE' | 'HIGH';
  weatherSummary: string;
  recommendedAdjustment: string;
}

/**
 * Calculates surface pipeline convective & radiative heat loss influenced by ambient meteorological data.
 * Prototype engineering-inspired calculation.
 */
export function calculateWeatherImpact(weather: WeatherConditions, pipeInsulationFactor = 0.94): WeatherImpactResult {
  const { ambientTemperature, windSpeed, rainfall = 0 } = weather;

  // Baseline heat loss with standard aerogel/rockwool insulation
  let heatLoss = 3.8;

  // Temperature differential effect (OTSG steam ~280°C vs ambient)
  const deltaT = 280 - ambientTemperature;
  heatLoss += (deltaT / 250) * 1.4;

  // Convective cooling from wind speed (forced convection)
  const convectiveFactor = Math.max(1.0, 1.0 + (windSpeed - 10) * 0.04);
  if (windSpeed > 12) {
    heatLoss += (windSpeed - 12) * 0.12;
  }

  // Precipitation factor
  if (rainfall > 0) {
    heatLoss += Math.min(2.5, rainfall * 0.4);
  }

  // Insulation effectiveness modifier
  heatLoss = heatLoss * (1.0 - (pipeInsulationFactor - 0.9) * 2.0);
  const surfaceHeatLossPct = parseFloat(Math.max(2.5, Math.min(18.0, heatLoss)).toFixed(2));

  let impactLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (surfaceHeatLossPct > 7.5 || windSpeed > 30) {
    impactLevel = 'HIGH';
  } else if (surfaceHeatLossPct > 5.0 || windSpeed > 18) {
    impactLevel = 'MODERATE';
  }

  let weatherSummary = `Ambient ${ambientTemperature}°C with ${windSpeed} km/h wind generates ~${surfaceHeatLossPct}% surface thermal dissipation.`;
  let recommendedAdjustment = 'Standard injection schedule acceptable. Normal monitoring required.';

  if (impactLevel === 'HIGH') {
    recommendedAdjustment = 'High convective thermal loss detected. Recommend increasing steam mass flow rate by 8-12% or pre-heating trace lines to maintain bottomhole target enthalpy.';
  } else if (impactLevel === 'MODERATE') {
    recommendedAdjustment = 'Moderate surface heat dissipation. Maintain continuous line temperature surveillance on SP-01 and SP-02 headers.';
  }

  return {
    surfaceHeatLossPct,
    convectiveLossFactor: parseFloat(convectiveFactor.toFixed(2)),
    impactLevel,
    weatherSummary,
    recommendedAdjustment,
  };
}
