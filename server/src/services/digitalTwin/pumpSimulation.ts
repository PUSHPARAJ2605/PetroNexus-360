export interface PumpSimulationInput {
  strokeRateSpm: number;     // SPM (e.g. 4.0 - 12.0)
  strokeLengthInches?: number;// inches (default 144)
  fluidViscosityCp?: number;  // cP
  fluidDensityKgM3?: number;  // kg/m3 (heavy oil ~ 970 kg/m3)
  pumpDepthMeters?: number;   // meters (1100m)
  pumpWearFactor?: number;    // 1.0 = pristine, 1.3 = degraded
}

export interface PumpSimulationResult {
  peakPolishedRodLoadLbs: number;
  minimumPolishedRodLoadLbs: number;
  rodStressPercentage: number;
  motorCurrentAmps: number;
  motorTemperatureC: number;
  gearboxVibrationMmS: number;
  pumpEfficiencyPct: number;
  mechanicalRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  statusIndicator: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

/**
 * Simulates Sucker Rod Pump (SRP) beam kinematics, rod string loads, motor thermals, and vibration.
 */
export function simulateSrpOperation(input: PumpSimulationInput): PumpSimulationResult {
  const {
    strokeRateSpm,
    strokeLengthInches = 144,
    fluidViscosityCp = 180,
    pumpDepthMeters = 1100,
    pumpWearFactor = 1.0,
  } = input;

  // Fluid column weight + rod string weight (~14,000 lbs static)
  const staticRodWeight = 11500;
  const fluidColumnWeight = 6200 * (1.0 + Math.log10(Math.max(10, fluidViscosityCp)) * 0.12);

  // Dynamic inertial acceleration factor (Mills formula acceleration = N^2 * S / 70500)
  const accelFactor = (Math.pow(strokeRateSpm, 2) * strokeLengthInches) / 70500;
  const peakPolishedRodLoadLbs = parseFloat(
    ((staticRodWeight * (1 + accelFactor) + fluidColumnWeight) * pumpWearFactor).toFixed(0)
  );
  const minimumPolishedRodLoadLbs = parseFloat(
    (staticRodWeight * (1 - accelFactor * 0.8) - 1500).toFixed(0)
  );

  // Rod string rating: Grade D sucker rod tensile limit ~ 28,000 lbs
  const rodStressPercentage = parseFloat(Math.min(100, (peakPolishedRodLoadLbs / 28000) * 100).toFixed(1));

  // Motor electrical current (Amperes)
  const baseCurrent = 16.0;
  const currentDraw = baseCurrent + (strokeRateSpm * 1.5) + (peakPolishedRodLoadLbs / 3000) * pumpWearFactor;
  const motorCurrentAmps = parseFloat(currentDraw.toFixed(1));

  // Motor temperature (°C)
  const ambientMotorTemp = 36.0;
  const heatRise = (motorCurrentAmps / 28.0) * 38.0 * (strokeRateSpm / 7.0);
  const motorTemperatureC = parseFloat((ambientMotorTemp + heatRise).toFixed(1));

  // Gearbox & wrist-pin vibration (mm/s ISO 10816 standards)
  let vibration = 1.6 + (strokeRateSpm / 8.0) * 0.8;
  if (pumpWearFactor > 1.15) {
    vibration += (pumpWearFactor - 1.0) * 12.0;
  }
  const gearboxVibrationMmS = parseFloat(vibration.toFixed(2));

  // Volumetric efficiency %
  const slippage = (fluidViscosityCp < 50 ? 8 : 4) + (strokeRateSpm > 9 ? 6 : 2);
  const pumpEfficiencyPct = parseFloat(Math.max(45, (94 - slippage) / pumpWearFactor).toFixed(1));

  let mechanicalRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let statusIndicator: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

  if (gearboxVibrationMmS >= 7.0 || motorTemperatureC >= 85 || rodStressPercentage >= 88) {
    mechanicalRisk = 'CRITICAL';
    statusIndicator = 'CRITICAL';
  } else if (gearboxVibrationMmS >= 4.5 || motorTemperatureC >= 75 || rodStressPercentage >= 75) {
    mechanicalRisk = 'MODERATE';
    statusIndicator = 'WARNING';
  }

  return {
    peakPolishedRodLoadLbs,
    minimumPolishedRodLoadLbs,
    rodStressPercentage,
    motorCurrentAmps,
    motorTemperatureC,
    gearboxVibrationMmS,
    pumpEfficiencyPct,
    mechanicalRisk,
    statusIndicator,
  };
}
