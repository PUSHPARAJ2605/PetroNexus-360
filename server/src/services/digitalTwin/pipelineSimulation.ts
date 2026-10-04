export interface PipelineSimulationInput {
  lineTag: string;           // 'SP-01' | 'SP-02' | 'OP-01' | 'OP-02'
  inletPressureBar: number;  // bar
  inletTemperatureC: number; // °C
  flowRate: number;          // t/hr or m3/hr
  lengthMeters: number;      // meters
  diameterInches: number;    // inches
  fluidType: 'STEAM' | 'CRUDE';
  ambientTemperatureC?: number;
  windSpeedKmH?: number;
  anomalySimulated?: boolean;
}

export interface PipelineSimulationResult {
  outletPressureBar: number;
  pressureDropBar: number;
  outletTemperatureC: number;
  temperatureLossC: number;
  heatLossPercentage: number;
  pipeHoopStressPct: number;
  flowVelocityMS: number;
  anomalyDetected: boolean;
  leakRisk: 'LOW' | 'MODERATE' | 'HIGH';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  diagnosticMessage: string;
}

/**
 * Simulates thermal pipeline hydraulics, friction loss, heat dissipation, and hoop stress.
 */
export function simulatePipelineOperation(input: PipelineSimulationInput): PipelineSimulationResult {
  const {
    lineTag,
    inletPressureBar,
    inletTemperatureC,
    flowRate,
    lengthMeters,
    diameterInches,
    fluidType,
    ambientTemperatureC = 34,
    windSpeedKmH = 20,
    anomalySimulated = false,
  } = input;

  // Cross sectional area
  const diameterM = diameterInches * 0.0254;
  const areaM2 = Math.PI * Math.pow(diameterM / 2, 2);

  // Velocity
  const density = fluidType === 'STEAM' ? 45.0 : 960.0; // kg/m3 approx
  const massFlowKgS = (flowRate * 1000) / 3600;
  const flowVelocityMS = parseFloat(Math.min(35.0, massFlowKgS / (density * areaM2)).toFixed(2));

  // Friction pressure drop (Darcy-Weisbach simplified)
  let frictionFactor = fluidType === 'STEAM' ? 0.018 : 0.035;
  if (anomalySimulated || lineTag === 'SP-02') {
    // If anomaly simulated, simulate flow restriction or leakage pressure drop
    frictionFactor *= 2.8;
  }

  const baseDp = ((frictionFactor * lengthMeters) / diameterM) * (density * Math.pow(flowVelocityMS, 2)) / (2 * 100000);
  const pressureDropBar = parseFloat(Math.max(0.8, baseDp + (anomalySimulated ? 4.5 : 0)).toFixed(2));
  const outletPressureBar = parseFloat(Math.max(5.0, inletPressureBar - pressureDropBar).toFixed(2));

  // Heat loss calculation
  const deltaT = inletTemperatureC - ambientTemperatureC;
  const windFactor = 1.0 + Math.max(0, (windSpeedKmH - 10) * 0.03);
  let heatLossRate = (deltaT / 250) * 4.2 * windFactor * (lengthMeters / 500);

  if (anomalySimulated || lineTag === 'SP-02') {
    heatLossRate *= 1.45; // insulation breakdown
  }
  const heatLossPercentage = parseFloat(Math.min(18.0, Math.max(2.5, heatLossRate)).toFixed(2));

  const temperatureLossC = parseFloat(((heatLossPercentage / 100) * deltaT * 0.35).toFixed(1));
  const outletTemperatureC = parseFloat((inletTemperatureC - temperatureLossC).toFixed(1));

  // Barlow hoop stress calculation S = P * D / (2 * t)
  // Expressed as % of SMYS (Specified Minimum Yield Strength: 240 MPa for Grade B)
  const wallThicknessMm = diameterInches >= 8 ? 8.2 : 6.4;
  const hoopStressMPa = (inletPressureBar * 0.1 * (diameterInches * 25.4)) / (2 * wallThicknessMm);
  const smysMPa = 240.0;
  const pipeHoopStressPct = parseFloat(Math.min(100, (hoopStressMPa / smysMPa) * 100).toFixed(1));

  let leakRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
  let anomalyDetected = false;
  let diagnosticMessage = 'Pipeline hydraulic balance and heat retention are within nominal design specifications.';

  if (pressureDropBar > 5.5 || heatLossPercentage > 8.0 || anomalySimulated || lineTag === 'SP-02') {
    anomalyDetected = true;
    leakRisk = pressureDropBar > 8.0 ? 'HIGH' : 'MODERATE';
    status = pressureDropBar > 8.0 ? 'CRITICAL' : 'WARNING';
    diagnosticMessage = `Elevated pressure differential (ΔP = ${pressureDropBar} bar) and heat loss (${heatLossPercentage}%). Potential flow constriction or localized insulation breakdown along section.`;
  }

  return {
    outletPressureBar,
    pressureDropBar,
    outletTemperatureC,
    temperatureLossC,
    heatLossPercentage,
    pipeHoopStressPct,
    flowVelocityMS,
    anomalyDetected,
    leakRisk,
    status,
    diagnosticMessage,
  };
}
