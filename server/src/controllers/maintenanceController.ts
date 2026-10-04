import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getMaintenanceOverview(req: Request, res: Response): Promise<void> {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { asset: true },
      orderBy: { scheduledDate: 'asc' },
    });

    const liveTelemetry = sensorSimulator.getCurrentState();

    // Asset Cards for Predictive Maintenance page
    const assetCategories = [
      {
        tag: 'SG-01',
        title: 'Steam Generator Unit',
        assetType: 'STEAM_GENERATOR',
        healthScore: liveTelemetry.assets['SG-01']?.healthScore || 94.5,
        failureRisk: 'LOW',
        remainingHealth: 94.5,
        lastMaintenance: '7 days ago (SRV Recalibration)',
        nextRecommendedInspection: 'In 21 days (Burner & Tube Scale Ultrasonic)',
        recommendation: 'Nominal operational status. Water TDS within API limits.',
      },
      {
        tag: 'SP-02',
        title: 'High-Pressure Steam Pipeline #2',
        assetType: 'STEAM_PIPELINE',
        healthScore: liveTelemetry.assets['SP-02']?.healthScore || 74.0,
        failureRisk: 'HIGH',
        remainingHealth: 74.0,
        lastMaintenance: '45 days ago (Visual Walkdown)',
        nextRecommendedInspection: 'Within 36 hours (FLIR Insulation & Acoustic Survey)',
        recommendation: 'Differential pressure drop (ΔP = 6.8 bar) signals potential constriction or localized insulation breach.',
      },
      {
        tag: 'SRP-03',
        title: 'Sucker Rod Pumping Unit #3',
        assetType: 'SRP',
        healthScore: liveTelemetry.assets['SRP-03']?.healthScore || 68.0,
        failureRisk: 'MODERATE',
        remainingHealth: 68.0,
        lastMaintenance: '28 days ago (Rod String Lubrication)',
        nextRecommendedInspection: 'Within 24 hours (Gearbox Vibration Spectrum Analysis)',
        recommendation: 'Elevated vibration (5.8 mm/s) and motor temp (78.5°C). Inspect wrist pin bearings and rod guide wear.',
      },
      {
        tag: 'SP-01',
        title: 'Steam Transit Line SP-01',
        assetType: 'STEAM_PIPELINE',
        healthScore: 92.0,
        failureRisk: 'LOW',
        remainingHealth: 92.0,
        lastMaintenance: '14 days ago',
        nextRecommendedInspection: 'In 45 days',
        recommendation: 'Insulation jackets intact; hydraulic pressure drop within design criteria.',
      },
      {
        tag: 'PS-01',
        title: 'Central Booster Pump Station',
        assetType: 'PUMP_STATION',
        healthScore: 91.0,
        failureRisk: 'LOW',
        remainingHealth: 91.0,
        lastMaintenance: '12 days ago',
        nextRecommendedInspection: 'In 30 days',
        recommendation: 'Positive displacement manifold operating at 90 m3/hr nominal discharge.',
      },
      {
        tag: 'ST-01',
        title: 'Crude Thermal Storage Tank #1',
        assetType: 'STORAGE_TANK',
        healthScore: 98.0,
        failureRisk: 'LOW',
        remainingHealth: 98.0,
        lastMaintenance: '60 days ago',
        nextRecommendedInspection: 'In 90 days',
        recommendation: 'Steam heating coils maintaining consistent 65°C crude fluid mobility.',
      },
    ];

    res.json({
      records,
      assetCards: assetCategories,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve maintenance data' });
  }
}

export async function createMaintenanceRecord(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { assetId, title, description, maintenanceType, priority, scheduledDate, technician } = req.body;

    if (!assetId || !title || !scheduledDate) {
      res.status(400).json({ error: 'assetId, title, and scheduledDate are required' });
      return;
    }

    // Resolve asset
    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id: assetId }, { tag: assetId }] },
    });

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        assetId: asset.id,
        title,
        description: description || '',
        maintenanceType: maintenanceType || 'PREVENTIVE',
        priority: priority || 'MEDIUM',
        status: 'SCHEDULED',
        scheduledDate: new Date(scheduledDate),
        technician: technician || req.user?.name || 'Field Lead',
      },
      include: { asset: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        assetId: asset.id,
        action: 'MAINTENANCE_SCHEDULED',
        details: `Work order "${title}" scheduled for ${asset.tag}. Priority: ${priority}.`,
      },
    });

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create maintenance work order' });
  }
}
