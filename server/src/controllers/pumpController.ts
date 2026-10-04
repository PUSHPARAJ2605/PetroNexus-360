import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getPumps(req: Request, res: Response): Promise<void> {
  try {
    const pumps = await prisma.pump.findMany({
      include: {
        asset: {
          include: {
            alerts: { where: { status: 'ACTIVE' } },
            maintenanceRecords: {
              where: { status: 'SCHEDULED' },
              take: 1,
            },
          },
        },
      },
      orderBy: { asset: { tag: 'asc' } },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    const formattedPumps = pumps.map((p) => {
      const liveData = liveTelemetry.assets[p.asset.tag];
      const vibration = liveData?.telemetry.vibration ?? p.vibration;
      const motorTemp = liveData?.telemetry.motorTemp ?? p.motorTemp;
      const motorCurrent = liveData?.telemetry.motorCurrent ?? p.motorCurrent;
      const load = liveData?.telemetry.loadLbs ?? p.polishedRodLoad;

      const isWarning = vibration > 4.5 || motorTemp > 75;

      return {
        id: p.id,
        pumpId: p.asset.tag,
        name: p.asset.name,
        type: p.pumpType,
        status: liveData ? liveData.status : isWarning ? 'WARNING' : p.asset.status,
        strokeRate: p.strokeRate,
        strokeLength: p.strokeLength,
        motorCurrent,
        motorTemp,
        vibration,
        polishedRodLoad: load,
        efficiency: isWarning ? 68.0 : p.efficiency,
        runtimeHours: p.runtimeHours,
        healthScore: liveData ? liveData.healthScore : p.asset.healthScore,
        riskLevel: liveData ? liveData.riskLevel : isWarning ? 'MODERATE' : 'LOW',
        activeAlerts: p.asset.alerts,
        nextMaintenance: p.asset.maintenanceRecords[0] || null,
        degradationWarning: isWarning ? 'Potential mechanical degradation detected: elevated vibration and motor thermals.' : null,
      };
    });

    res.json(formattedPumps);
  } catch (error: any) {
    console.error('Error fetching pumps:', error);
    res.status(500).json({ error: 'Failed to retrieve pump telemetry' });
  }
}

export async function getPumpById(req: Request, res: Response): Promise<void> {
  try {
    const pumpId = req.params.id as string;
    const pump = await prisma.pump.findFirst({
      where: {
        OR: [{ id: pumpId }, { asset: { tag: pumpId } }],
      },
      include: {
        asset: {
          include: {
            alerts: true,
            maintenanceRecords: true,
          },
        },
      },
    });

    if (!pump) {
      res.status(404).json({ error: 'Pump unit not found' });
      return;
    }

    const liveTelemetry = sensorSimulator.getCurrentState();
    const liveData = liveTelemetry.assets[pump.asset.tag];

    // Generate 24-hour vibration trend
    const vibrationTrend = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * 3600 * 1000);
      const isDegrading = pump.asset.tag === 'SRP-03' && i < 10;
      const baseVib = pump.asset.tag === 'SRP-03' ? (isDegrading ? 5.8 : 3.2) : 2.2;
      vibrationTrend.push({
        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        vibration: parseFloat((baseVib + (Math.random() - 0.5) * 0.4).toFixed(2)),
        warningThreshold: 4.5,
        criticalThreshold: 7.0,
      });
    }

    res.json({
      ...pump,
      status: liveData ? liveData.status : pump.asset.status,
      healthScore: liveData ? liveData.healthScore : pump.asset.healthScore,
      riskLevel: liveData ? liveData.riskLevel : pump.asset.riskLevel,
      currentVibration: liveData?.telemetry.vibration ?? pump.vibration,
      currentMotorTemp: liveData?.telemetry.motorTemp ?? pump.motorTemp,
      currentMotorCurrent: liveData?.telemetry.motorCurrent ?? pump.motorCurrent,
      vibrationTrend,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve pump details' });
  }
}
