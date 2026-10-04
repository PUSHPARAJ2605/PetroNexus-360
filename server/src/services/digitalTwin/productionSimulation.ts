export interface ProductionSimulationInput {
  reservoirPressure: number;   // bar
  reservoirTemperature: number;// °C
  wellheadPressure: number;    // bar
  valveOpeningPct: number;     // % (e.g. 10 - 100)
  pumpSpeedSpm?: number;       // SPM (e.g. 4 - 10)
  oilMobilityMultiplier?: number;
}

export interface ProductionSimulationResult {
  expectedOilRateBpd: number;
  expectedGrossFluidBpd: number;
  drawdownPressureBar: number;
  estimatedWaterCutPct: number;
  tankDailyInflowM3: number;
  pipelinePressureBar: number;
  fluidViscosityCp: number;
}

/**
 * Simulates heavy oil post-steam production release and wellbore fluid lifting.
 */
export function simulateProductionResponse(input: ProductionSimulationInput): ProductionSimulationResult {
  const {
    reservoirPressure,
    reservoirTemperature,
    wellheadPressure,
    valveOpeningPct,
    pumpSpeedSpm = 7.0,
    oilMobilityMultiplier = 4.5,
  } = input;

  // Pressure drawdown across perforation zone (Reservoir Pressure - Wellbore backpressure)
  const effectiveBackpressure = wellheadPressure + (100 - valveOpeningPct) * 0.15;
  const drawdownPressureBar = parseFloat(Math.max(2.0, reservoirPressure - effectiveBackpressure).toFixed(1));

  // Fluid viscosity at production temperature
  const fluidViscosityCp = parseFloat(Math.max(20.0, 8000.0 / Math.pow(Math.max(1.0, reservoirTemperature / 50.0), 3.8)).toFixed(1));

  // Inflow Performance Relationship (IPR) for heavy oil
  // Rate Q = ProductivityIndex * Drawdown * Mobility * ValveOpening
  const basePI = 2.4; // BPD / bar
  const valveFactor = Math.min(1.0, Math.max(0.1, valveOpeningPct / 100));
  const pumpFactor = Math.min(1.4, Math.max(0.6, pumpSpeedSpm / 7.0));

  const grossFluidRate = basePI * drawdownPressureBar * (oilMobilityMultiplier * 0.8) * valveFactor * pumpFactor;
  const expectedGrossFluidBpd = parseFloat(Math.max(40.0, grossFluidRate * 1.5).toFixed(1));

  // Water cut estimation (condensed steam returns first during thermal flowback)
  const initialWaterCut = Math.max(25.0, Math.min(65.0, 55.0 - (reservoirTemperature - 120) * 0.2));
  const estimatedWaterCutPct = parseFloat(initialWaterCut.toFixed(1));

  // Net oil production rate in barrels per day (BPD)
  const expectedOilRateBpd = parseFloat((expectedGrossFluidBpd * (1.0 - (estimatedWaterCutPct / 100))).toFixed(1));

  // Tank daily inflow in cubic meters (1 barrel ~ 0.159 m3)
  const tankDailyInflowM3 = parseFloat((expectedOilRateBpd * 0.159).toFixed(1));

  // Pipeline gathering pressure resulting from fluid movement
  const pipelinePressureBar = parseFloat(Math.max(12.0, (wellheadPressure * 0.75) + (expectedGrossFluidBpd / 100) * 1.2).toFixed(1));

  return {
    expectedOilRateBpd,
    expectedGrossFluidBpd,
    drawdownPressureBar,
    estimatedWaterCutPct,
    tankDailyInflowM3,
    pipelinePressureBar,
    fluidViscosityCp,
  };
}
