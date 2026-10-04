import { PrismaClient, AssetStatus, Severity, AlertStatus } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

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
    status: string;
    healthScore: number;
    riskLevel: string;
    telemetry: Record<string, number>;
  }>;
  isAnomalyActive: boolean;
  isDemoData: boolean;
}

export class SensorSimulator {
  private io: SocketIOServer | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private anomalyStep = 0;
  private isAnomalyActive = false;
  private assetAnomalies: Record<string, boolean> = {
    'SP-02': false,
    'SRP-03': false,
    'IW-02': false,
    'PW-03': false,
  };
  private tickCount = 0;

  // Cached state for ultra-fast instant broadcast
  private currentState: LiveTelemetryState = {
    timestamp: new Date().toISOString(),
    fieldHealthScore: 95.4,
    activeAlertCount: 0,
    weather: {
      temperature: 34.2,
      humidity: 38.0,
      windSpeed: 21.5,
      rainfall: 0.0,
      impactLevel: 'MODERATE',
      estimatedHeatLoss: 6.8,
    },
    keyMetrics: {
      oilProductionBpd: 1248.0,
      steamRateThr: 5.0,
      steamPressureBar: 88.0,
      steamTemperatureC: 289.0,
      activeWells: '8/10',
      pumpAvailabilityPct: 94.0,
      pipelineHealthPct: 88.0,
      energyConsumptionMWh: 78.4,
    },
    assets: {
      'SG-01': {
        status: 'NORMAL',
        healthScore: 94.5,
        riskLevel: 'LOW',
        telemetry: { pressure: 88.0, temperature: 289.0, flow: 5.0, steamQuality: 82.0, efficiency: 88.5 }
      },
      'SP-01': {
        status: 'NORMAL',
        healthScore: 92.0,
        riskLevel: 'LOW',
        telemetry: { inletPressure: 88.0, outletPressure: 86.1, temperature: 273.0, flow: 2.9, heatLoss: 6.2 }
      },
      'SP-02': {
        status: 'NORMAL',
        healthScore: 93.0,
        riskLevel: 'LOW',
        telemetry: { inletPressure: 88.0, outletPressure: 86.4, temperature: 271.0, flow: 2.5, heatLoss: 4.2 }
      },
      'IW-01': {
        status: 'NORMAL',
        healthScore: 95.0,
        riskLevel: 'LOW',
        telemetry: { wellheadPressure: 84.0, bottomholeTemp: 268.0, steamRate: 2.9, cssCycle: 4 }
      },
      'IW-02': {
        status: 'NORMAL',
        healthScore: 89.0,
        riskLevel: 'LOW',
        telemetry: { wellheadPressure: 79.5, bottomholeTemp: 255.0, steamRate: 2.1, cssCycle: 3 }
      },
      'PW-01': {
        status: 'NORMAL',
        healthScore: 93.0,
        riskLevel: 'LOW',
        telemetry: { wellheadPressure: 38.5, temperature: 142.0, oilRate: 440.0, cssCycle: 4 }
      },
      'PW-02': {
        status: 'NORMAL',
        healthScore: 91.0,
        riskLevel: 'LOW',
        telemetry: { wellheadPressure: 35.0, temperature: 136.0, oilRate: 390.0, cssCycle: 3 }
      },
      'PW-03': {
        status: 'NORMAL',
        healthScore: 88.0,
        riskLevel: 'LOW',
        telemetry: { wellheadPressure: 41.0, temperature: 148.0, oilRate: 418.0, cssCycle: 5 }
      },
      'SRP-01': {
        status: 'NORMAL',
        healthScore: 92.0,
        riskLevel: 'LOW',
        telemetry: { strokeRate: 7.2, motorCurrent: 24.5, motorTemp: 62.0, vibration: 2.1, loadLbs: 18200 }
      },
      'SRP-02': {
        status: 'NORMAL',
        healthScore: 88.0,
        riskLevel: 'LOW',
        telemetry: { strokeRate: 6.8, motorCurrent: 23.8, motorTemp: 64.0, vibration: 2.4, loadLbs: 17800 }
      },
      'SRP-03': {
        status: 'NORMAL',
        healthScore: 91.0,
        riskLevel: 'LOW',
        telemetry: { strokeRate: 7.6, motorCurrent: 24.2, motorTemp: 63.5, vibration: 2.2, loadLbs: 18400 }
      },
      'OP-01': {
        status: 'NORMAL',
        healthScore: 94.0,
        riskLevel: 'LOW',
        telemetry: { inletPressure: 34.0, outletPressure: 28.5, temperature: 115.0, flow: 52.0 }
      },
      'OP-02': {
        status: 'NORMAL',
        healthScore: 93.0,
        riskLevel: 'LOW',
        telemetry: { inletPressure: 38.0, outletPressure: 31.0, temperature: 120.0, flow: 38.0 }
      },
      'PS-01': {
        status: 'NORMAL',
        healthScore: 91.0,
        riskLevel: 'LOW',
        telemetry: { inflowRate: 90.0, dischargePressure: 45.0, powerKW: 180.0 }
      },
      'ST-01': {
        status: 'NORMAL',
        healthScore: 98.0,
        riskLevel: 'LOW',
        telemetry: { levelPct: 68.4, temperature: 65.0, volumeM3: 3420.0 }
      },
    },
    isAnomalyActive: false,
    isDemoData: true,
  };

  public init(io: SocketIOServer) {
    this.io = io;
    console.log('📡 Initializing PetroNexus Sensor Simulator...');
    this.startSimulation();
  }

  public getCurrentState(): LiveTelemetryState {
    return this.currentState;
  }

  public setActiveAlertCount(count: number) {
    this.currentState.activeAlertCount = count;
    if (this.io) {
      this.io.emit('telemetry_tick', this.currentState);
    }
  }

  public setAnomalyState(active: boolean) {
    this.isAnomalyActive = active;
    this.currentState.isAnomalyActive = active;
    Object.keys(this.assetAnomalies).forEach((k) => {
      this.assetAnomalies[k] = active;
    });
    this.currentState.activeAlertCount = active ? 2 : 0;
    if (!active) {
      this.resolveAssetAnomaly('ALL');
    }
    if (this.io) {
      this.io.emit('telemetry_tick', this.currentState);
    }
  }

  public resolveAssetAnomaly(tag: string) {
    if (tag === 'ALL') {
      Object.keys(this.assetAnomalies).forEach((k) => {
        this.assetAnomalies[k] = false;
      });
      // Restore all known assets
      ['SP-02', 'SRP-03', 'IW-02', 'PW-03'].forEach((t) => this.resolveAssetAnomaly(t));
      this.isAnomalyActive = false;
      this.currentState.isAnomalyActive = false;
      this.currentState.activeAlertCount = 0;
      this.currentState.fieldHealthScore = 95.8;
      if (this.io) this.io.emit('telemetry_tick', this.currentState);
      return this.currentState;
    }

    this.assetAnomalies[tag] = false;
    const asset = this.currentState.assets[tag];
    if (asset) {
      asset.status = 'NORMAL';
      asset.riskLevel = 'LOW';
      asset.healthScore = 95.0;

      if (tag === 'SP-02') {
        asset.telemetry.outletPressure = 85.8;
        asset.telemetry.heatLoss = 4.1;
      } else if (tag === 'SRP-03') {
        asset.telemetry.vibration = 2.1;
        asset.telemetry.motorTemp = 61.5;
        asset.telemetry.motorCurrent = 23.8;
      } else if (tag === 'IW-02' || tag === 'IW-01') {
        asset.telemetry.wellheadPressure = 80.5;
        asset.telemetry.bottomholeTemp = 258.0;
        asset.telemetry.steamRate = 2.6;
      } else if (tag.startsWith('PW-')) {
        asset.telemetry.wellheadPressure = 39.5;
        asset.telemetry.oilRate = 430.0;
        asset.telemetry.temperature = 142.0;
      } else if (tag === 'SG-01') {
        asset.telemetry.pressure = 88.0;
        asset.telemetry.temperature = 289.0;
      }
    }

    // Check if any anomalies remain
    const anyActive = Object.values(this.assetAnomalies).some(Boolean);
    this.isAnomalyActive = anyActive;
    this.currentState.isAnomalyActive = anyActive;
    this.currentState.activeAlertCount = Object.values(this.assetAnomalies).filter(Boolean).length;
    this.currentState.fieldHealthScore = anyActive ? 89.6 : 95.4;

    if (this.io) {
      this.io.emit('telemetry_tick', this.currentState);
    }
    return this.currentState;
  }

  public triggerAssetAnomaly(tag: string) {
    this.assetAnomalies[tag] = true;
    this.isAnomalyActive = true;
    this.currentState.isAnomalyActive = true;
    const asset = this.currentState.assets[tag];
    if (asset) {
      asset.status = 'WARNING';
      asset.riskLevel = 'HIGH';
      asset.healthScore = 71.0;
      if (tag === 'SP-02') {
        asset.telemetry.outletPressure = 80.8;
        asset.telemetry.heatLoss = 9.1;
      } else if (tag === 'SRP-03') {
        asset.telemetry.vibration = 5.8;
        asset.telemetry.motorTemp = 78.5;
        asset.telemetry.motorCurrent = 29.2;
      } else if (tag === 'IW-02') {
        asset.telemetry.wellheadPressure = 98.4;
      } else if (tag === 'PW-03') {
        asset.telemetry.oilRate = 180.0;
      }
    }
    this.currentState.activeAlertCount = Object.values(this.assetAnomalies).filter(Boolean).length;
    this.currentState.fieldHealthScore = 87.5;
    if (this.io) {
      this.io.emit('telemetry_tick', this.currentState);
    }
    return this.currentState;
  }

  public startSimulation() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);

    // Broadcast tick every 3.5 seconds
    this.intervalTimer = setInterval(async () => {
      this.tick();
    }, 3500);
  }

  private async tick() {
    this.tickCount++;
    const now = new Date();
    this.currentState.timestamp = now.toISOString();

    // 1. Subtle jitter for realism (bounded random walk)
    const jitter = (base: number, range: number) => {
      const delta = (Math.random() - 0.5) * range;
      return parseFloat((base + delta).toFixed(2));
    };

    // Update Weather with slight breeze fluctuations
    const weather = this.currentState.weather;
    weather.temperature = jitter(34.2, 0.4);
    weather.windSpeed = jitter(21.5, 1.8);
    weather.humidity = jitter(38.0, 1.0);
    weather.estimatedHeatLoss = parseFloat((5.5 + (weather.windSpeed - 15) * 0.18).toFixed(1));

    // Update OTSG SG-01
    const sg = this.currentState.assets['SG-01'];
    sg.telemetry.pressure = jitter(88.0, 0.6);
    sg.telemetry.temperature = jitter(289.0, 1.2);
    sg.telemetry.flow = jitter(5.0, 0.1);

    // Update SP-01 (Normal Line)
    const sp01 = this.currentState.assets['SP-01'];
    sp01.telemetry.inletPressure = sg.telemetry.pressure;
    sp01.telemetry.outletPressure = jitter(86.1, 0.4);
    sp01.telemetry.temperature = jitter(273.0, 0.8);
    sp01.telemetry.flow = jitter(2.9, 0.08);

    // Update SP-02 (Anomaly Line: fluctuating / elevated pressure drop)
    const sp02 = this.currentState.assets['SP-02'];
    sp02.telemetry.inletPressure = sg.telemetry.pressure;
    if (this.assetAnomalies['SP-02']) {
      // Controlled anomaly progression
      this.anomalyStep = (this.anomalyStep + 1) % 60;
      const dropFactor = Math.sin((this.anomalyStep / 60) * Math.PI) * 1.5;
      sp02.telemetry.outletPressure = parseFloat((81.2 - dropFactor).toFixed(2));
      sp02.telemetry.heatLoss = parseFloat((8.8 + dropFactor * 0.4).toFixed(2));
      sp02.status = 'WARNING';
      sp02.riskLevel = 'HIGH';
      sp02.healthScore = parseFloat((74.0 - dropFactor * 2).toFixed(1));
    } else {
      sp02.telemetry.outletPressure = jitter(85.8, 0.3);
      sp02.telemetry.heatLoss = jitter(4.1, 0.2);
      sp02.status = 'NORMAL';
      sp02.riskLevel = 'LOW';
      sp02.healthScore = 95.0;
    }

    // Update SRP-03 (Anomaly Pump)
    const srp03 = this.currentState.assets['SRP-03'];
    if (this.assetAnomalies['SRP-03']) {
      srp03.telemetry.vibration = jitter(5.8, 0.5);
      srp03.telemetry.motorTemp = jitter(78.5, 0.8);
      srp03.telemetry.motorCurrent = jitter(29.2, 0.6);
      srp03.status = 'WARNING';
      srp03.riskLevel = 'MODERATE';
      srp03.healthScore = 68.0;
    } else {
      srp03.telemetry.vibration = jitter(2.1, 0.2);
      srp03.telemetry.motorTemp = jitter(61.5, 0.4);
      srp03.telemetry.motorCurrent = jitter(23.8, 0.3);
      srp03.status = 'NORMAL';
      srp03.riskLevel = 'LOW';
      srp03.healthScore = 93.0;
    }

    // Update Production Wells
    const pw01 = this.currentState.assets['PW-01'];
    pw01.telemetry.oilRate = jitter(440.0, 5.0);
    pw01.telemetry.wellheadPressure = jitter(38.5, 0.4);

    const pw02 = this.currentState.assets['PW-02'];
    pw02.telemetry.oilRate = jitter(390.0, 4.0);

    const pw03 = this.currentState.assets['PW-03'];
    pw03.telemetry.oilRate = jitter(418.0, 4.5);

    // Storage Tank Fill Rate
    const st01 = this.currentState.assets['ST-01'];
    st01.telemetry.levelPct = parseFloat(Math.min(99.5, st01.telemetry.levelPct + 0.005).toFixed(2));
    st01.telemetry.volumeM3 = parseFloat(((st01.telemetry.levelPct / 100) * 5000).toFixed(1));

    // Overall Field Aggregations
    const totalOil = pw01.telemetry.oilRate + pw02.telemetry.oilRate + pw03.telemetry.oilRate;
    this.currentState.keyMetrics.oilProductionBpd = parseFloat(totalOil.toFixed(1));
    this.currentState.keyMetrics.steamPressureBar = sg.telemetry.pressure;
    this.currentState.keyMetrics.steamTemperatureC = sg.telemetry.temperature;

    // Field overall health score
    this.currentState.fieldHealthScore = parseFloat(
      (this.isAnomalyActive ? 89.6 : 94.2).toFixed(1)
    );

    // Broadcast real-time telemetry package via Socket.IO
    if (this.io) {
      this.io.emit('telemetry_tick', this.currentState);

      // Also emit granular sensor update for chart real-time listeners
      this.io.emit('sensor_reading', {
        timestamp: this.currentState.timestamp,
        SP01_PT_OUT: sp01.telemetry.outletPressure,
        SP02_PT_OUT: sp02.telemetry.outletPressure,
        SG01_PT: sg.telemetry.pressure,
        SG01_TT: sg.telemetry.temperature,
        PW01_OFT: pw01.telemetry.oilRate,
        SRP03_VIB: srp03.telemetry.vibration,
        TOTAL_OIL: this.currentState.keyMetrics.oilProductionBpd,
      });
    }

    // Every 60 ticks (~3.5 minutes), persist one snapshot batch to PostgreSQL
    if (this.tickCount % 60 === 0) {
      try {
        const sp02Sensor = await prisma.sensor.findUnique({ where: { tag: 'SP02_PT_OUT' } });
        if (sp02Sensor) {
          await prisma.sensorReading.create({
            data: {
              sensorId: sp02Sensor.id,
              value: sp02.telemetry.outletPressure,
              timestamp: now,
            },
          });
        }
      } catch (err) {
        // Non-blocking background log
      }
    }
  }
}

export const sensorSimulator = new SensorSimulator();
