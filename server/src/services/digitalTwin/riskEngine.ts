import { simulateSteamTransport, SteamSimulationInput, SteamSimulationResult } from './steamSimulation';
import { simulateReservoirResponse, ReservoirSimulationResult } from './reservoirSimulation';
import { simulateProductionResponse, ProductionSimulationResult } from './productionSimulation';
import { simulatePipelineOperation, PipelineSimulationResult } from './pipelineSimulation';
import { calculateWeatherImpact, WeatherConditions } from './weatherImpact';

export interface FullSimulationInput {
  operationType: 'STEAM_INJECTION' | 'PRODUCTION_RELEASE' | 'SOAK_CYCLE' | 'SRP_OPERATION';
  wellTag?: string;
  steamPressure?: number;       // bar
  steamTemperature?: number;    // °C
  steamFlowRate?: number;       // t/hr
  injectionDurationDays?: number;// days
  soakDurationDays?: number;     // days
  reservoirPressure?: number;   // bar
  wellheadPressure?: number;    // bar
  valveOpeningPct?: number;     // %
  pumpSpeedSpm?: number;        // SPM
  ambientTemperature?: number;  // °C
  humidity?: number;           // %
  windSpeed?: number;          // km/h
}

export interface FullSimulationOutput {
  status: 'SAFE' | 'REVIEW' | 'UNSAFE'; // GREEN, YELLOW, RED
  riskScore: number;                   // 0 - 100
  wellIntegrityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  recommendations: string[];
  steamMetrics?: SteamSimulationResult;
  reservoirMetrics?: ReservoirSimulationResult;
  productionMetrics?: ProductionSimulationResult;
  pipelineMetrics?: PipelineSimulationResult;
  summary: {
    predictedReservoirTemp: number;
    predictedReservoirPressure: number;
    heatPenetrationIndex: number;
    estimatedHeatLoss: number;
    steamConsumption: number;
    estimatedOilMobility: number;
    expectedProduction: number;
    energyRequirement: number;
    pipelineStress: number;
  };
}

/**
 * Unified Digital Twin Simulation & Safety Risk Assessment Engine.
 * Evaluates inputs against reservoir fracture margins, pipe hoop stresses, thermal losses, and lift dynamics.
 */
export function runDigitalTwinSimulation(input: FullSimulationInput): FullSimulationOutput {
  const {
    operationType = 'STEAM_INJECTION',
    wellTag = 'IW-01',
    steamPressure = 85.0,
    steamTemperature = 285.0,
    steamFlowRate = 3.0,
    injectionDurationDays = 14.0,
    soakDurationDays = 7.0,
    reservoirPressure = 45.0,
    wellheadPressure = 35.0,
    valveOpeningPct = 65.0,
    pumpSpeedSpm = 7.2,
    ambientTemperature = 34.0,
    humidity = 38.0,
    windSpeed = 21.0,
  } = input;

  const weather: WeatherConditions = {
    ambientTemperature,
    humidity,
    windSpeed,
  };

  const weatherImpact = calculateWeatherImpact(weather);

  // 1. Steam transport simulation
  const steamMetrics = simulateSteamTransport({
    steamPressure,
    steamTemperature,
    steamFlowRate,
    injectionDurationDays,
    weather,
  });

  // 2. Reservoir response simulation
  const reservoirMetrics = simulateReservoirResponse({
    bottomholePressure: steamMetrics.wellheadPressureBar * 0.96,
    bottomholeTemperature: steamMetrics.wellheadTemperatureC,
    steamFlowRate,
    injectionDurationDays,
    soakDurationDays,
    reservoirInitialPress: reservoirPressure,
  });

  // 3. Production release simulation
  const productionMetrics = simulateProductionResponse({
    reservoirPressure: reservoirMetrics.predictedReservoirPressure,
    reservoirTemperature: reservoirMetrics.predictedReservoirTemp,
    wellheadPressure,
    valveOpeningPct,
    pumpSpeedSpm,
    oilMobilityMultiplier: reservoirMetrics.oilMobilityMultiplier,
  });

  // 4. Pipeline stress & hydraulic simulation
  const pipelineMetrics = simulatePipelineOperation({
    lineTag: wellTag.includes('02') ? 'SP-02' : 'SP-01',
    inletPressureBar: steamPressure,
    inletTemperatureC: steamTemperature,
    flowRate: steamFlowRate,
    lengthMeters: 450,
    diameterInches: 6,
    fluidType: 'STEAM',
    ambientTemperatureC: ambientTemperature,
    windSpeedKmH: windSpeed,
    anomalySimulated: wellTag.includes('02'),
  });

  // 5. Multi-criteria Risk Assessment
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 12.0; // baseline safe score

  // Check 1: Formation breakdown / hydraulic fracture risk
  // Reservoir fracture limit at 1150m depth is ~94 bar
  if (reservoirMetrics.predictedReservoirPressure >= 92.0) {
    riskScore += 45;
    reasons.push(
      `CRITICAL: Predicted reservoir pressure (${reservoirMetrics.predictedReservoirPressure} bar) exceeds safe fracture propagation threshold (92.0 bar). Formation caprock breakthrough risk.`
    );
    recommendations.push(
      'Immediately decrease steam injection pressure below 88 bar or throttle steam flow rate.'
    );
  } else if (reservoirMetrics.predictedReservoirPressure >= 85.0) {
    riskScore += 22;
    reasons.push(
      `WARNING: Predicted reservoir pressure (${reservoirMetrics.predictedReservoirPressure} bar) approaching maximum allowable operating ceiling (margin: ${reservoirMetrics.fractureMarginBar} bar).`
    );
    recommendations.push(
      'Consider lowering injection pressure by 3–5 bar or extending soak duration to facilitate natural pore pressure dissipation.'
    );
  } else {
    reasons.push(
      `Reservoir pressure response (${reservoirMetrics.predictedReservoirPressure} bar) is within safe formation containment limits (safe margin: ${reservoirMetrics.fractureMarginBar} bar).`
    );
  }

  // Check 2: Steam pressure limits & Pipeline hoop stress
  if (steamPressure >= 95.0) {
    riskScore += 35;
    reasons.push(
      `CRITICAL: Surface steam pressure (${steamPressure} bar) exceeds 95 bar class rating for standard ANSI 600 surface manifolds.`
    );
    recommendations.push(
      'Ensure steam generator discharge relief setpoint is not surpassed. Do not operate above 90 bar.'
    );
  } else if (steamPressure >= 89.0) {
    riskScore += 18;
    reasons.push(
      `Steam pressure (${steamPressure} bar) is elevated; pipeline stress reaches ${pipelineMetrics.pipeHoopStressPct}% of SMYS.`
    );
    recommendations.push(
      'Monitor pipeline SP-01/SP-02 expansion joints and confirm anchor block integrity.'
    );
  }

  // Check 3: Weather & Convective Heat Loss
  if (steamMetrics.totalHeatLossPct > 7.5 || windSpeed > 28.0) {
    riskScore += 15;
    reasons.push(
      `Elevated surface heat dissipation (${steamMetrics.totalHeatLossPct}%) driven by high ambient wind speed (${windSpeed} km/h).`
    );
    recommendations.push(
      'Evaluate scheduling major injection cycles during calmer night windows or verifying aerogel jacket cladding.'
    );
  }

  // Check 4: Pipeline anomaly correlation
  if (pipelineMetrics.anomalyDetected) {
    riskScore += 20;
    reasons.push(
      `Pipeline anomaly detected: ${pipelineMetrics.diagnosticMessage}`
    );
    recommendations.push(
      'Validate line pressure transmitter calibration and conduct ultrasonic thickness verification.'
    );
  }

  // Check 5: Energy & Steam consumption sanity
  if (steamMetrics.energyRequirementMWh > 1200) {
    riskScore += 10;
    reasons.push(
      `High energy requirement (${steamMetrics.energyRequirementMWh} MWh). Specific Steam-to-Oil Ratio may exceed economic threshold.`
    );
    recommendations.push(
      'Evaluate staged injection cycles (e.g. 10 days rather than extended duration) to optimize cumulative SOR.'
    );
  }

  // Determine Overall Status
  let status: 'SAFE' | 'REVIEW' | 'UNSAFE' = 'SAFE';
  let wellIntegrityRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (riskScore >= 60 || reservoirMetrics.predictedReservoirPressure >= 92.0 || steamPressure >= 95.0) {
    status = 'UNSAFE';
    wellIntegrityRisk = 'HIGH';
    recommendations.unshift('DO NOT PROCEED with physical operation under current parameters.');
  } else if (riskScore >= 35 || reservoirMetrics.predictedReservoirPressure >= 85.0 || steamPressure >= 88.0 || steamMetrics.totalHeatLossPct > 7.0) {
    status = 'REVIEW';
    wellIntegrityRisk = 'MEDIUM';
    recommendations.unshift('REVIEW & MODIFY PARAMETERS before submitting scenario for operator authorization.');
  } else {
    status = 'SAFE';
    wellIntegrityRisk = 'LOW';
    recommendations.unshift('Parameters are within standard operational envelope. Acceptable for operator scenario submission.');
  }

  return {
    status,
    riskScore: Math.min(100, riskScore),
    wellIntegrityRisk,
    reasons,
    recommendations,
    steamMetrics,
    reservoirMetrics,
    productionMetrics,
    pipelineMetrics,
    summary: {
      predictedReservoirTemp: reservoirMetrics.predictedReservoirTemp,
      predictedReservoirPressure: reservoirMetrics.predictedReservoirPressure,
      heatPenetrationIndex: reservoirMetrics.heatPenetrationIndex,
      estimatedHeatLoss: steamMetrics.totalHeatLossPct,
      steamConsumption: steamMetrics.steamConsumptionTonnes,
      estimatedOilMobility: reservoirMetrics.oilMobilityMultiplier,
      expectedProduction: productionMetrics.expectedOilRateBpd,
      energyRequirement: steamMetrics.energyRequirementMWh,
      pipelineStress: pipelineMetrics.pipeHoopStressPct,
    },
  };
}
