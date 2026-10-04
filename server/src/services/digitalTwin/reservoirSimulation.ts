export interface ReservoirSimulationInput {
  bottomholePressure: number;   // bar
  bottomholeTemperature: number;// °C
  steamFlowRate: number;        // t/hr
  injectionDurationDays: number;// days
  soakDurationDays: number;     // days
  reservoirInitialTemp?: number;// °C (default 52°C)
  reservoirInitialPress?: number;// bar (default 45 bar)
  reservoirDepthMeters?: number;// meters (default 1150m)
}

export interface ReservoirSimulationResult {
  predictedReservoirTemp: number;     // °C
  predictedReservoirPressure: number; // bar
  heatPenetrationIndex: number;       // 0-100 score
  thermalRadiusMeters: number;        // meters
  heavyOilViscosityCp: number;        // cP (original ~12,000 cP)
  oilMobilityMultiplier: number;      // e.g. 1.0 -> 8.5x
  fractureMarginBar: number;          // margin below fracture limit (e.g. 94 bar)
}

/**
 * Simulates heavy oil reservoir thermal response, heat penetration zone, and viscosity reduction.
 */
export function simulateReservoirResponse(input: ReservoirSimulationInput): ReservoirSimulationResult {
  const {
    bottomholePressure,
    bottomholeTemperature,
    steamFlowRate,
    injectionDurationDays,
    soakDurationDays,
    reservoirInitialTemp = 52.0,
    reservoirInitialPress = 45.0,
  } = input;

  // Cumulative thermal energy delivered
  const totalSteamTonnes = steamFlowRate * injectionDurationDays * 24;

  // Thermal radius based on Marx-Langenheim simplified thermal diffusion
  // Radius ~ sqrt(totalSteam / rockHeatCapacityFactor)
  const baseRadius = Math.sqrt(totalSteamTonnes * 1.85);
  const thermalRadiusMeters = parseFloat(Math.min(75.0, Math.max(12.0, baseRadius)).toFixed(1));

  // Heat penetration index 0-100 (scaled against target 60m radius)
  const heatPenetrationIndex = parseFloat(Math.min(100.0, (thermalRadiusMeters / 60.0) * 100).toFixed(1));

  // Reservoir temperature elevation in near-wellbore zone
  // Peak steam temperature diffuses into reservoir rock and formation water
  const soakDamping = Math.max(0.75, 1.0 - (soakDurationDays * 0.02)); // temperature equilibrates during soak
  const tempRise = (bottomholeTemperature - reservoirInitialTemp) * (0.62 + (injectionDurationDays / 40) * 0.15) * soakDamping;
  const predictedReservoirTemp = parseFloat((reservoirInitialTemp + tempRise).toFixed(1));

  // Reservoir pressure response during steam injection
  // Steam expands the pore volume; partially bleeds off into distal matrix during soak
  const pressRise = (bottomholePressure - reservoirInitialPress) * (0.45 + (steamFlowRate / 10) * 0.2);
  const soakPressureBleed = Math.max(0.65, 1.0 - (soakDurationDays * 0.035));
  const predictedReservoirPressure = parseFloat((reservoirInitialPress + (pressRise * soakPressureBleed)).toFixed(1));

  // Heavy Oil Viscosity (Arrhenius relation: mu(T) = mu0 * exp(b / T))
  // At 52°C, Baghewala heavy crude is ~12,000 cP.
  // At 150°C, viscosity drops to ~45 cP. At 200°C, ~18 cP.
  const tempRatio = Math.max(1.0, predictedReservoirTemp / 52.0);
  const heavyOilViscosityCp = parseFloat(Math.max(12.0, 12000.0 / Math.pow(tempRatio, 4.2)).toFixed(1));

  // Oil mobility multiplier (inversely proportional to viscosity)
  const baselineViscosity = 12000.0;
  const oilMobilityMultiplier = parseFloat(Math.min(25.0, (baselineViscosity / heavyOilViscosityCp) * 0.025).toFixed(2));

  // Hydraulic fracture pressure ceiling (formation breakdown ~94 bar at 1150m)
  const fractureCeilingBar = 94.0;
  const fractureMarginBar = parseFloat((fractureCeilingBar - predictedReservoirPressure).toFixed(1));

  return {
    predictedReservoirTemp,
    predictedReservoirPressure,
    heatPenetrationIndex,
    thermalRadiusMeters,
    heavyOilViscosityCp,
    oilMobilityMultiplier,
    fractureMarginBar,
  };
}
