import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getPipelines(req: Request, res: Response): Promise<void> {
  try {
    const pipelines = await prisma.pipeline.findMany({
      include: {
        asset: {
          include: {
            alerts: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { asset: { tag: 'asc' } },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    const formattedPipelines = pipelines.map((pipe) => {
      const liveData = liveTelemetry.assets[pipe.asset.tag];
      const inlet = liveData?.telemetry.inletPressure ?? pipe.inletPressure;
      const outlet = liveData?.telemetry.outletPressure ?? pipe.outletPressure;
      const temp = liveData?.telemetry.temperature ?? pipe.temperature;
      const flow = liveData?.telemetry.flow ?? pipe.flowRate;
      const heatLoss = liveData?.telemetry.heatLoss ?? pipe.heatLossRate;

      const pressureDrop = parseFloat(Math.max(0.2, inlet - outlet).toFixed(2));
      const hasAnomaly = pressureDrop > 5.0 || heatLoss > 7.5;

      return {
        id: pipe.id,
        pipelineId: pipe.asset.tag,
        name: pipe.asset.name,
        fromAsset: pipe.fromAsset,
        toAsset: pipe.toAsset,
        length: pipe.length,
        diameter: pipe.diameter,
        status: liveData ? liveData.status : hasAnomaly ? 'WARNING' : pipe.asset.status,
        inletPressure: inlet,
        outletPressure: outlet,
        pressureDrop,
        temperature: temp,
        flowRate: flow,
        heatLossRate: heatLoss,
        healthScore: liveData ? liveData.healthScore : pipe.asset.healthScore,
        leakRisk: hasAnomaly ? 'HIGH' : pipe.leakRisk,
        activeAlerts: pipe.asset.alerts,
        anomalyDetected: hasAnomaly,
        anomalyWarning: hasAnomaly ? 'Elevated pressure differential detected across line span.' : null,
      };
    });

    res.json(formattedPipelines);
  } catch (error: any) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Failed to retrieve pipeline data' });
  }
}

export async function getPipelineById(req: Request, res: Response): Promise<void> {
  try {
    const pipeId = req.params.id as string;
    const pipe = await prisma.pipeline.findFirst({
      where: {
        OR: [{ id: pipeId }, { asset: { tag: pipeId } }],
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

    if (!pipe) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }

    const liveTelemetry = sensorSimulator.getCurrentState();
    const liveData = liveTelemetry.assets[pipe.asset.tag];

    res.json({
      ...pipe,
      status: liveData ? liveData.status : pipe.asset.status,
      healthScore: liveData ? liveData.healthScore : pipe.asset.healthScore,
      inletPressure: liveData?.telemetry.inletPressure ?? pipe.inletPressure,
      outletPressure: liveData?.telemetry.outletPressure ?? pipe.outletPressure,
      temperature: liveData?.telemetry.temperature ?? pipe.temperature,
      heatLossRate: liveData?.telemetry.heatLoss ?? pipe.heatLossRate,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve pipeline details' });
  }
}
