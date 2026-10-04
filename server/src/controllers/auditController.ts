import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { assetId, action, limit = 50 } = req.query;
    const where: any = {};
    if (assetId) where.assetId = String(assetId);
    if (action) where.action = String(action);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        asset: { select: { id: true, tag: true, name: true } },
        simulation: { select: { id: true, title: true, status: true, approvalStatus: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve operation audit trail' });
  }
}
