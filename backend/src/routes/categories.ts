import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { is_active: true },
            orderBy: { display_order: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create category (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    const { name, description, color, display_order } = req.body;

    try {
        const category = await prisma.category.create({
            data: {
                name,
                description,
                color,
                display_order
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
