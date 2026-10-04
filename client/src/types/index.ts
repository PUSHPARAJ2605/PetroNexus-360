export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'ENGINEER' | 'MAINTENANCE_ENGINEER' | 'SAFETY_OFFICER' | 'VIEWER';
  avatar?: string;
}

export interface LiveTelemetryState {
  timestamp: string;
  fieldHealthScore: number;
  activeAlertCount: number;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    impactLevel: string;
    estimatedHeatLoss: number;
  };
  keyMetrics: {
    oilProductionBpd: number;
    steamRateThr: number;
    steamPressureBar: number;
    steamTemperatureC: number;
    activeWells: string;
    pumpAvailabilityPct: number;
    pipelineHealthPct: number;
    energyConsumptionMWh: number;
  };
  assets: Record<string, {
    status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
    healthScore: number;
    riskLevel: string;
    telemetry: Record<string, number>;
  }>;
  isAnomalyActive: boolean;
  isDemoData: boolean;
}

export interface Asset {
  id: string;
  fieldId: string;
  tag: string;
  name: string;
  type: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  healthScore: number;
  riskLevel: string;
  description?: string;
  metadata?: any;
  sensors?: any[];
  alerts?: any[];
  maintenanceRecords?: any[];
  well?: any;
  pipeline?: any;
  pump?: any;
  steamGenerator?: any;
  storageTank?: any;
  pumpStation?: any;
  liveTelemetry?: Record<string, number>;
}

export interface WellData {
  id: string;
  assetId: string;
  wellId: string;
  name: string;
  type: 'INJECTION' | 'PRODUCTION' | 'BACKUP';
  reservoirZone: string;
  depth: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  pressure: number;
  temperature: number;
  oilRate: number;
  steamRate: number;
  cssCycle: number;
  lastCssDate?: string;
  healthScore: number;
  riskLevel: string;
  activeAlertsCount: number;
}

export interface PumpData {
  id: string;
  pumpId: string;
  name: string;
  type: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  strokeRate: number;
  strokeLength: number;
  motorCurrent: number;
  motorTemp: number;
  vibration: number;
  polishedRodLoad: number;
  efficiency: number;
  runtimeHours: number;
  healthScore: number;
  riskLevel: string;
  activeAlerts?: any[];
  nextMaintenance?: any;
  degradationWarning?: string | null;
}

export interface PipelineData {
  id: string;
  pipelineId: string;
  name: string;
  fromAsset: string;
  toAsset: string;
  length: number;
  diameter: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  inletPressure: number;
  outletPressure: number;
  pressureDrop: number;
  temperature: number;
  flowRate: number;
  heatLossRate: number;
  healthScore: number;
  leakRisk: string;
  activeAlerts?: any[];
  anomalyDetected: boolean;
  anomalyWarning?: string | null;
}

export interface AlertData {
  id: string;
  assetId: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  category: string;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedTo?: string;
  notes?: string;
  timestamp: string;
  resolvedAt?: string;
  asset: {
    tag: string;
    name: string;
    type: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

export interface SimulationResultData {
  status: 'SAFE' | 'REVIEW' | 'UNSAFE';
  riskScore: number;
  wellIntegrityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  recommendations: string[];
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
  steamMetrics?: any;
  reservoirMetrics?: any;
  productionMetrics?: any;
  pipelineMetrics?: any;
}
