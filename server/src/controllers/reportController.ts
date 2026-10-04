import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.query;
    const where: any = {};
    if (type) where.type = String(type);

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    // Dynamically generated live summary reports
    const liveReports = [
      {
        id: 'rep-live-prod',
        title: 'Daily Field Production & Lift Summary',
        type: 'PRODUCTION',
        generatedBy: 'PetroNexus Analytics Engine',
        summary: `Gross heavy crude rate: ${liveTelemetry.keyMetrics.oilProductionBpd} BPD. 3 active producers with average water cut of 38%.`,
        data: {
          oilProductionBpd: liveTelemetry.keyMetrics.oilProductionBpd,
          activeWells: liveTelemetry.keyMetrics.activeWells,
          pw01Bpd: liveTelemetry.assets['PW-01']?.telemetry.oilRate || 440,
          pw02Bpd: liveTelemetry.assets['PW-02']?.telemetry.oilRate || 390,
          pw03Bpd: liveTelemetry.assets['PW-03']?.telemetry.oilRate || 418,
          timestamp: liveTelemetry.timestamp,
        },
        createdAt: new Date(),
      },
      {
        id: 'rep-live-steam',
        title: 'OTSG Thermal Balance & Distribution Report',
        type: 'STEAM_EFFICIENCY',
        generatedBy: 'Steam Intelligence Core',
        summary: `Generator delivery rate: ${liveTelemetry.keyMetrics.steamRateThr} t/hr at ${liveTelemetry.keyMetrics.steamPressureBar} bar. Field average SOR: 2.45.`,
        data: {
          steamPressureBar: liveTelemetry.keyMetrics.steamPressureBar,
          steamTemperatureC: liveTelemetry.keyMetrics.steamTemperatureC,
          estimatedHeatLossPct: liveTelemetry.weather.estimatedHeatLoss,
          fuelRateNm3hr: 380,
          waterRateM3hr: 5.2,
          timestamp: liveTelemetry.timestamp,
        },
        createdAt: new Date(),
      },
      ...reports,
    ];

    res.json(liveReports);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
}

export async function exportReportCsv(req: Request, res: Response): Promise<void> {
  try {
    const { type = 'PRODUCTION' } = req.query;
    const live = sensorSimulator.getCurrentState();

    let csvContent = '';
    const now = new Date().toISOString();

    if (type === 'PRODUCTION') {
      csvContent = `Timestamp,Asset_Tag,Well_Type,Pressure_Bar,Temperature_C,Oil_Rate_BPD,Status\n`;
      csvContent += `${now},PW-01,PRODUCTION,38.5,142.0,${live.assets['PW-01']?.telemetry.oilRate || 440},NORMAL\n`;
      csvContent += `${now},PW-02,PRODUCTION,35.0,136.0,${live.assets['PW-02']?.telemetry.oilRate || 390},NORMAL\n`;
      csvContent += `${now},PW-03,PRODUCTION,41.0,148.0,${live.assets['PW-03']?.telemetry.oilRate || 418},NORMAL\n`;
      csvContent += `${now},IW-01,INJECTION,84.0,268.0,0.0,NORMAL\n`;
      csvContent += `${now},IW-02,INJECTION,79.5,255.0,0.0,NORMAL\n`;
    } else {
      csvContent = `Timestamp,Asset_Tag,Asset_Type,Health_Score,Status,Risk_Level,Primary_Metric\n`;
      for (const [tag, data] of Object.entries(live.assets)) {
        csvContent += `${now},${tag},EQUIPMENT,${data.healthScore},${data.status},${data.riskLevel},${JSON.stringify(data.telemetry).replace(/,/g, ';')}\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="petronexus_${type.toString().toLowerCase()}_export.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}
