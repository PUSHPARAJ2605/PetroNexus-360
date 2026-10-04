import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getWells(req: Request, res: Response): Promise<void> {
  try {
    const wells = await prisma.well.findMany({
      include: {
        asset: {
          include: {
            alerts: { where: { status: 'ACTIVE' } },
            sensors: true,
          },
        },
      },
      orderBy: { asset: { tag: 'asc' } },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    const formattedWells = wells.map((w) => {
      const liveData = liveTelemetry.assets[w.asset.tag];
      const livePressure = liveData?.telemetry.wellheadPressure ?? w.pressure;
      const liveTemp = liveData?.telemetry.temperature ?? liveData?.telemetry.bottomholeTemp ?? w.temperature;
      const liveOilRate = liveData?.telemetry.oilRate ?? w.oilRate ?? 0;
      const liveSteamRate = liveData?.telemetry.steamRate ?? w.steamRate ?? 0;

      return {
        id: w.id,
        assetId: w.assetId,
        wellId: w.asset.tag,
        name: w.asset.name,
        type: w.type,
        reservoirZone: w.reservoirZone,
        depth: w.depth,
        status: liveData ? liveData.status : w.asset.status,
        pressure: livePressure,
        temperature: liveTemp,
        oilRate: liveOilRate,
        steamRate: liveSteamRate,
        cssCycle: w.cssCycle,
        lastCssDate: w.lastCssDate,
        healthScore: liveData ? liveData.healthScore : w.healthScore,
        riskLevel: liveData ? liveData.riskLevel : w.asset.riskLevel,
        activeAlertsCount: w.asset.alerts.length,
      };
    });

    res.json(formattedWells);
  } catch (error: any) {
    console.error('Error fetching wells:', error);
    res.status(500).json({ error: 'Failed to retrieve wells data' });
  }
}

export async function getWellById(req: Request, res: Response): Promise<void> {
  try {
    const wellId = req.params.id as string;

    const well = await prisma.well.findFirst({
      where: {
        OR: [{ id: wellId }, { assetId: wellId }, { asset: { tag: wellId } }],
      },
      include: {
        asset: {
          include: {
            sensors: {
              include: {
                readings: {
                  orderBy: { timestamp: 'desc' },
                  take: 24,
                },
              },
            },
            alerts: {
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
            maintenanceRecords: {
              orderBy: { scheduledDate: 'desc' },
              take: 5,
            },
            simulations: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: { input: true, result: true },
            },
          },
        },
      },
    });

    if (!well) {
      res.status(404).json({ error: 'Well not found' });
      return;
    }

    const liveTelemetry = sensorSimulator.getCurrentState();
    const liveData = liveTelemetry.assets[well.asset.tag];

    // Build historical CSS timeline and charts
    const historySeries = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const isPostSoak = i < 7;
      historySeries.push({
        date: dt.toISOString().split('T')[0],
        pressure: parseFloat((well.pressure + Math.sin(i * 0.4) * 3).toFixed(1)),
        temperature: parseFloat((well.temperature - (14 - i) * 2.2 + (isPostSoak ? 15 : 0)).toFixed(1)),
        oilProduction: well.type === 'PRODUCTION' ? Math.round((well.oilRate || 400) + Math.sin(i) * 25) : 0,
        steamInjection: well.type === 'INJECTION' ? parseFloat(((well.steamRate || 2.8) + Math.cos(i) * 0.2).toFixed(2)) : 0,
      });
    }

    res.json({
      ...well,
      status: liveData ? liveData.status : well.asset.status,
      healthScore: liveData ? liveData.healthScore : well.healthScore,
      riskLevel: liveData ? liveData.riskLevel : well.asset.riskLevel,
      currentPressure: liveData?.telemetry.wellheadPressure ?? well.pressure,
      currentTemperature: liveData?.telemetry.temperature ?? liveData?.telemetry.bottomholeTemp ?? well.temperature,
      currentOilRate: liveData?.telemetry.oilRate ?? well.oilRate ?? 0,
      currentSteamRate: liveData?.telemetry.steamRate ?? well.steamRate ?? 0,
      historySeries,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch well details' });
  }
}
