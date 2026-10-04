import { Request, Response } from 'express';
import { PrismaClient, AlertStatus, Severity } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function getAlerts(req: Request, res: Response): Promise<void> {
  try {
    const { status, severity, category } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status) as AlertStatus;
    if (severity && severity !== 'ALL') where.severity = String(severity) as any;
    if (category && category !== 'ALL') where.category = String(category);

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Count real active alerts in database
    const activeCount = await prisma.alert.count({
      where: { status: 'ACTIVE' },
    });

    sensorSimulator.setActiveAlertCount(activeCount);

    res.json(alerts);
  } catch (error: any) {
    console.error('getAlerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
}

export async function updateAlert(req: AuthRequest, res: Response): Promise<void> {
  try {
    const alertId = req.params.id as string;
    const { status, assignedTo, notes } = req.body;

    const data: any = {};
    if (status) {
      data.status = status as AlertStatus;
      if (status === 'RESOLVED') {
        data.resolvedAt = new Date();
      } else if (status === 'ACTIVE') {
        data.resolvedAt = null;
      }
    }
    if (assignedTo !== undefined) data.assignedTo = assignedTo || null;
    if (notes !== undefined) data.notes = notes;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data,
      include: { asset: true, user: true },
    });

    // Update active count on simulator
    const activeCount = await prisma.alert.count({
      where: { status: 'ACTIVE' },
    });
    sensorSimulator.setActiveAlertCount(activeCount);

    // If all alerts are resolved, turn off anomaly state
    if (activeCount === 0) {
      sensorSimulator.setAnomalyState(false);
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          assetId: alert.assetId,
          action: `ALERT_${status || 'UPDATED'}`,
          details: `Alert ${alert.id} on ${alert.asset.tag} updated. Status: ${alert.status}. Notes: ${notes || 'N/A'}`,
        },
      });
    } catch (e) {
      // non-blocking
    }

    res.json(alert);
  } catch (error: any) {
    console.error('updateAlert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
}

export async function createAlert(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { assetTag, severity, category, message, notes } = req.body;

    let asset = null;
    if (assetTag) {
      asset = await prisma.asset.findUnique({ where: { tag: assetTag } });
    }
    if (!asset) {
      asset = await prisma.asset.findFirst();
    }

    if (!asset) {
      res.status(400).json({ error: 'No asset available for alert creation' });
      return;
    }

    const alert = await prisma.alert.create({
      data: {
        assetId: asset.id,
        severity: (severity as Severity) || Severity.WARNING,
        category: category || 'PIPELINE',
        message: message || `Telemetry anomaly reported on ${asset.tag}. Requires field operator assessment.`,
        status: AlertStatus.ACTIVE,
        notes: notes || null,
        assignedTo: req.user?.id || null,
      },
      include: { asset: true, user: true },
    });

    const activeCount = await prisma.alert.count({ where: { status: 'ACTIVE' } });
    sensorSimulator.setActiveAlertCount(activeCount);
    sensorSimulator.setAnomalyState(true);

    res.status(201).json(alert);
  } catch (error: any) {
    console.error('createAlert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
}

export async function resolveAllAlerts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const resolutionNote = req.body?.notes || 'Batch resolved by operator clearance.';

    await prisma.alert.updateMany({
      where: { status: { not: AlertStatus.RESOLVED } },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        notes: resolutionNote,
      },
    });

    sensorSimulator.setActiveAlertCount(0);
    sensorSimulator.setAnomalyState(false);

    const alerts = await prisma.alert.findMany({
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ message: 'All active alerts have been resolved.', alerts });
  } catch (error: any) {
    console.error('resolveAllAlerts error:', error);
    res.status(500).json({ error: 'Failed to resolve all alerts' });
  }
}
