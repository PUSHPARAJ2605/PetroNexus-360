import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'petronexus-super-secret-key-360-digital-twin';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `User ${user.email} logged into PetroNexus 360 session.`,
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_LOGOUT',
        details: `User ${req.user.email} signed out of session.`,
      },
    });
  }
  res.json({ message: 'Logged out successfully' });
}

export async function getDemoAccounts(req: Request, res: Response): Promise<void> {
  res.json([
    {
      role: 'ADMIN',
      label: 'Admin',
      email: 'admin@petronexus360.demo',
      password: 'PetroAdmin@360',
      description: 'Full supervisory authority, user provisioning, system calibration',
    },
    {
      role: 'OPERATOR',
      label: 'Operator',
      email: 'operator@petronexus360.demo',
      password: 'Operator@360',
      description: 'Daily steam injection, wellhead monitoring, simulation testing',
    },
    {
      role: 'ENGINEER',
      label: 'Engineer',
      email: 'engineer@petronexus360.demo',
      password: 'Engineer@360',
      description: 'Reservoir dynamics, What-If scenario comparisons, thermal efficiency',
    },
    {
      role: 'MAINTENANCE_ENGINEER',
      label: 'Maintenance',
      email: 'maintenance@petronexus360.demo',
      password: 'Maint@360',
      description: 'Pumps, vibration tracking, pipeline ultrasonic inspections',
    },
    {
      role: 'SAFETY_OFFICER',
      label: 'Safety Officer',
      email: 'safety@petronexus360.demo',
      password: 'Safety@360',
      description: 'Caprock pressure containment, risk heatmap, HSE incident tracking',
    },
  ]);
}
