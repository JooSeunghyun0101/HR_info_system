import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Create Comment or Reply
router.post('/', authenticateToken, async (req, res) => {
    const { content, entity_type, entity_id, parent_id } = req.body;
    const userId = req.user!.id;

    try {
        // Validation
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }

        if (!['qna', 'manual'].includes(entity_type)) {
            return res.status(400).json({ message: 'Invalid entity_type' });
        }

        if (!entity_id) {
            return res.status(400).json({ message: 'entity_id is required' });
        }

        // Verify parent comment exists if parent_id is provided
        if (parent_id) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parent_id }
            });

            if (!parentComment || parentComment.is_deleted) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                entity_type,
                entity_id,
                parent_id: parent_id || null,
                created_by_id: userId
            },
            include: {
                created_by: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                replies: {
                    where: { is_deleted: false },
                    include: {
                        created_by: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        }
                    },
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all comments for an entity
router.get('/:entity_type/:entity_id', authenticateToken, async (req, res) => {
    const { entity_type, entity_id } = req.params;

    try {
        if (!['qna', 'manual'].includes(entity_type)) {
            return res.status(400).json({ message: 'Invalid entity_type' });
        }

        // Fetch top-level comments (parent_id = null) with nested replies
        const comments = await prisma.comment.findMany({
            where: {
                entity_type,
                entity_id,
                parent_id: null,
                is_deleted: false
            },
            include: {
                created_by: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                updated_by: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                replies: {
                    where: { is_deleted: false },
                    include: {
                        created_by: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        },
                        updated_by: {
                            select: {
                                id: true,
                                full_name: true
                            }
                        }
                    },
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update comment (author only)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    try {
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Find existing comment
        const existingComment = await prisma.comment.findUnique({
            where: { id }
        });

        if (!existingComment || existingComment.is_deleted) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Authorization: Only author can edit
        if (existingComment.created_by_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only edit your own comments' });
        }

        // Update comment
        const updatedComment = await prisma.comment.update({
            where: { id },
            data: {
                content: content.trim(),
                updated_by_id: userId,
                updated_at: new Date()
            },
            include: {
                created_by: {
                    select: {
                        id: true,
                        full_name: true
                    }
                },
                updated_by: {
                    select: {
                        id: true,
                        full_name: true
                    }
                }
            }
        });

        res.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete comment (soft delete - author or admin/hr_staff)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    try {
        // Find existing comment
        const existingComment = await prisma.comment.findUnique({
            where: { id }
        });

        if (!existingComment || existingComment.is_deleted) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Authorization: Author or admin/hr_staff
        const isAuthor = existingComment.created_by_id === userId;
        const isAdmin = ['admin', 'hr_staff'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized: You can only delete your own comments or must be an admin' });
        }

        // Soft delete comment
        await prisma.comment.update({
            where: { id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                deleted_by_id: userId
            }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
