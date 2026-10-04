import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getAssets(req: Request, res: Response): Promise<void> {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);

    const assets = await prisma.asset.findMany({
      where,
      include: {
        sensors: true,
        alerts: {
          where: { status: 'ACTIVE' },
        },
        well: true,
        pipeline: true,
        pump: true,
        steamGenerator: true,
        storageTank: true,
        pumpStation: true,
      },
      orderBy: { tag: 'asc' },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    // Enrich with dynamic telemetry
    const enrichedAssets = assets.map((asset) => {
      const liveData = liveTelemetry.assets[asset.tag];
      return {
        ...asset,
        status: liveData ? liveData.status : asset.status,
        healthScore: liveData ? liveData.healthScore : asset.healthScore,
        riskLevel: liveData ? liveData.riskLevel : asset.riskLevel,
        liveTelemetry: liveData ? liveData.telemetry : null,
      };
    });

    res.json(enrichedAssets);
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to retrieve asset directory' });
  }
}

export async function getAssetById(req: Request, res: Response): Promise<void> {
  try {
    const assetId = req.params.id as string;

    const asset = await prisma.asset.findFirst({
      where: {
        OR: [{ id: assetId }, { tag: assetId }],
      },
      include: {
        sensors: {
          include: {
            readings: {
              orderBy: { timestamp: 'desc' },
              take: 15,
            },
          },
        },
        alerts: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        maintenanceRecords: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
        simulations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { result: true },
        },
        well: true,
        pipeline: true,
        pump: true,
        steamGenerator: true,
        storageTank: true,
        pumpStation: true,
      },
    });

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const liveTelemetry = sensorSimulator.getCurrentState();
    const liveData = liveTelemetry.assets[asset.tag];

    res.json({
      ...asset,
      status: liveData ? liveData.status : asset.status,
      healthScore: liveData ? liveData.healthScore : asset.healthScore,
      riskLevel: liveData ? liveData.riskLevel : asset.riskLevel,
      liveTelemetry: liveData ? liveData.telemetry : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch asset detail' });
  }
}

export async function getAssetReadings(req: Request, res: Response): Promise<void> {
  try {
    const assetId = req.params.id as string;
    const sensors = await prisma.sensor.findMany({
      where: {
        asset: {
          OR: [{ id: assetId }, { tag: assetId }],
        },
      },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    });

    res.json(sensors);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch asset readings' });
  }
}
