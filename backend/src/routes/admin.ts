import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// All routes require admin role
const requireAdmin = requireRole(['admin']);

// ========================================
// User Management
// ========================================

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                created_at: true,
                last_login: true,
                email_verified: true
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change user role
router.patch('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'User ID is required' });
    const { role } = req.body;

    if (!['employee', 'hr_staff', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Toggle user active status
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'User ID is required' });
    const { is_active } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { is_active },
            select: {
                id: true,
                email: true,
                full_name: true,
                is_active: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new user
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                full_name,
                role: role || 'employee',
                email_verified: true
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true
            }
        });

        res.status(201).json(user);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ========================================
// Category Management
// ========================================

// Get all categories (including inactive)
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { qna_entries: true }
                }
            },
            orderBy: { display_order: 'asc' }
        });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create category
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
    const { name, description, color, display_order } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        const category = await prisma.category.create({
            data: {
                name,
                description,
                color,
                display_order: display_order || 0
            }
        });

        res.status(201).json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update category
router.patch('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Category ID is required' });
    const { name, description, color, display_order, is_active } = req.body;

    try {
        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
                ...(display_order !== undefined && { display_order }),
                ...(is_active !== undefined && { is_active })
            }
        });

        res.json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete category
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Category ID is required' });

    try {
        // Check if category is used
        const count = await prisma.qnACategory.count({
            where: { category_id: id }
        });

        if (count > 0) {
            return res.status(400).json({
                message: `Cannot delete category: used in ${count} Q&A entries`
            });
        }

        await prisma.category.delete({ where: { id } });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ========================================
// Tag Management
// ========================================

// Get all tags with usage count
router.get('/tags', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            include: {
                _count: {
                    select: { qna_entries: true }
                }
            },
            orderBy: {
                qna_entries: {
                    _count: 'desc'
                }
            }
        });

        res.json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Merge tags
router.post('/tags/merge', authenticateToken, requireAdmin, async (req, res) => {
    const { sourceTagId, targetTagId } = req.body;

    if (!sourceTagId || !targetTagId) {
        return res.status(400).json({ message: 'Source and target tag IDs are required' });
    }

    if (sourceTagId === targetTagId) {
        return res.status(400).json({ message: 'Source and target cannot be the same' });
    }

    try {
        // 1. Get all QnAs that have the source tag
        const sourceQnAs = await prisma.qnATag.findMany({
            where: { tag_id: sourceTagId },
            select: { qna_id: true }
        });

        // 2. Get all QnAs that have the target tag
        const targetQnAs = await prisma.qnATag.findMany({
            where: { tag_id: targetTagId },
            select: { qna_id: true }
        });

        const targetQnAIds = new Set(targetQnAs.map(t => t.qna_id));

        // 3. Iterate through source QnAs
        for (const source of sourceQnAs) {
            if (targetQnAIds.has(source.qna_id)) {
                // If the QnA already has the target tag, just delete the source tag relation
                // (We don't want duplicates)
                await prisma.qnATag.delete({
                    where: {
                        qna_id_tag_id: {
                            qna_id: source.qna_id,
                            tag_id: sourceTagId
                        }
                    }
                });
            } else {
                // If the QnA does NOT have the target tag, update the source tag to the target tag
                await prisma.qnATag.update({
                    where: {
                        qna_id_tag_id: {
                            qna_id: source.qna_id,
                            tag_id: sourceTagId
                        }
                    },
                    data: { tag_id: targetTagId }
                });
            }
        }

        // 4. Delete the source tag itself
        // (Any remaining relations should have been handled above, but if there are any stragglers due to race conditions, 
        // the cascade delete on the Tag model might handle them, or we ensure we cleaned up everything)
        // Note: The schema has onDelete: Cascade for QnATag -> Tag, so deleting the Tag will clean up any remaining QnATag entries.
        // However, we manually moved/deleted them to preserve the relationships.
        await prisma.tag.delete({ where: { id: sourceTagId } });

        res.json({ message: 'Tags merged successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete tag
router.delete('/tags/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Tag ID is required' });

    try {
        // Delete all QnATag relations first
        await prisma.qnATag.deleteMany({
            where: { tag_id: id }
        });

        // Delete the tag
        await prisma.tag.delete({ where: { id } });

        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ========================================
// System Statistics
// ========================================

// Get system stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            totalQnA,
            totalManuals,
            activeUsers,
            recentActivity
        ] = await Promise.all([
            // Total Q&A count
            prisma.qnAEntry.count({ where: { is_deleted: false } }),

            // Total Manual count
            prisma.manual.count({ where: { is_deleted: false } }),

            // Active users count
            prisma.user.count({ where: { is_active: true } }),

            // Recent activity (last 7 days)
            prisma.qnAEntry.findMany({
                where: {
                    is_deleted: false,
                    created_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                select: {
                    id: true,
                    question_title: true,
                    created_at: true,
                    created_by: {
                        select: { full_name: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 10
            })
        ]);

        res.json({
            totalQnA,
            totalManuals,
            activeUsers,
            recentActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
