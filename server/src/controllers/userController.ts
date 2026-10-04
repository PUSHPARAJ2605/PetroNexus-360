import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: (role as Role) || Role.OPERATOR,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'USER_CREATED',
        details: `Admin created new field user account: ${user.email} (${user.role})`,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.id as string;
    const { name, role, password } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (role) data.role = role as Role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.id as string;
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Cannot delete current logged-in user account' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
