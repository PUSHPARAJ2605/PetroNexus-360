import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    const liveTelemetry = sensorSimulator.getCurrentState();

    const [field, assetCount, activeAlerts, recentAudits] = await Promise.all([
      prisma.field.findFirst({
        where: { code: 'BAGHEWALA-01' },
      }),
      prisma.asset.count(),
      prisma.alert.findMany({
        where: { status: 'ACTIVE' },
        include: { asset: true },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 8,
        include: { user: true, asset: true },
      }),
    ]);

    // Format feed items from audit logs
    const operationsFeed = recentAudits.map((a) => {
      const timeStr = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: a.id,
        time: timeStr,
        timestamp: a.timestamp,
        text: a.details,
        action: a.action,
        user: a.user?.name || 'System Simulator',
        asset: a.asset?.tag,
      };
    });

    res.json({
      field: {
        code: field?.code || 'BAGHEWALA-01',
        name: field?.name || 'Baghewala Heavy Oil Field',
        location: field?.location || 'Bikaner Basin, Rajasthan',
        healthScore: liveTelemetry.fieldHealthScore,
      },
      kpis: {
        oilProductionBpd: liveTelemetry.keyMetrics.oilProductionBpd,
        steamRateThr: liveTelemetry.keyMetrics.steamRateThr,
        steamTemperatureC: liveTelemetry.keyMetrics.steamTemperatureC,
        steamPressureBar: liveTelemetry.keyMetrics.steamPressureBar,
        activeWells: liveTelemetry.keyMetrics.activeWells,
        fieldHealthScore: liveTelemetry.fieldHealthScore,
        activeAlerts: activeAlerts.length,
        pumpAvailabilityPct: liveTelemetry.keyMetrics.pumpAvailabilityPct,
        pipelineHealthPct: liveTelemetry.keyMetrics.pipelineHealthPct,
        energyConsumptionMWh: liveTelemetry.keyMetrics.energyConsumptionMWh,
      },
      weather: liveTelemetry.weather,
      activeAlerts: activeAlerts.map((alt) => ({
        id: alt.id,
        assetTag: alt.asset.tag,
        severity: alt.severity,
        category: alt.category,
        message: alt.message,
        timestamp: alt.timestamp,
      })),
      operationsFeed,
      isDemoData: true,
      timestamp: liveTelemetry.timestamp,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard overview' });
  }
}

export async function getDashboardTrends(req: Request, res: Response): Promise<void> {
  try {
    // Generate realistic multi-day and multi-hour data series for charts
    const now = new Date();
    const productionTrends = [];
    const steamSorTrends = [];
    const reservoirTempTrends = [];
    const pressureTrends = [];

    // 12 historical time points (hourly intervals)
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000 * 2);
      const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const baseProduction = 1220 + Math.sin(i * 0.7) * 35;
      const baseSteam = 5.0 + Math.cos(i * 0.5) * 0.3;
      const sor = parseFloat((baseSteam * 24 / (baseProduction / 6.29)).toFixed(2)); // ratio

      productionTrends.push({
        time: timeLabel,
        oilProduction: Math.round(baseProduction),
        target: 1250,
      });

      steamSorTrends.push({
        time: timeLabel,
        steamRate: parseFloat(baseSteam.toFixed(2)),
        sor: Math.max(1.8, Math.min(3.2, sor)),
      });

      reservoirTempTrends.push({
        time: timeLabel,
        zoneR01: parseFloat((195 + Math.sin(i * 0.4) * 4.2).toFixed(1)),
        zoneR02: parseFloat((182 + Math.cos(i * 0.4) * 3.1).toFixed(1)),
        steamEnthalpy: Math.round(2780 + Math.sin(i) * 20),
      });

      pressureTrends.push({
        time: timeLabel,
        sg01Pressure: parseFloat((88.0 + Math.sin(i * 0.8) * 0.6).toFixed(1)),
        sp01Pressure: parseFloat((86.2 + Math.sin(i * 0.8) * 0.5).toFixed(1)),
        sp02Pressure: parseFloat((81.4 - Math.abs(Math.sin(i * 0.6)) * 1.8).toFixed(1)),
        reservoirPressure: parseFloat((72.5 + Math.sin(i * 0.3) * 1.2).toFixed(1)),
      });
    }

    res.json({
      productionTrends,
      steamSorTrends,
      reservoirTempTrends,
      pressureTrends,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve dashboard trends' });
  }
}
