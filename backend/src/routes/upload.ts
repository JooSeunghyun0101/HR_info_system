
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { entityType, entityId } = req.body;
        const userId = (req as any).user.id;

        if (!entityType || !entityId) {
            // Clean up uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Entity type and ID are required' });
        }

        const attachment = await prisma.attachment.create({
            data: {
                entity_type: entityType,
                entity_id: entityId,
                file_name: req.file.originalname,
                file_type: path.extname(req.file.originalname).substring(1), // e.g., 'pdf'
                file_size: req.file.size,
                storage_path: req.file.path,
                mime_type: req.file.mimetype,
                uploaded_by_id: userId
            }
        });

        res.status(201).json(attachment);
    } catch (error) {
        console.error('Upload failed', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'File upload failed' });
    }
});

// Get attachments for an entity
router.get('/:entityType/:entityId', authenticateToken, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        if (!entityType || !entityId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const attachments = await prisma.attachment.findMany({
            where: {
                entity_type: entityType,
                entity_id: entityId
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        res.json(attachments);
    } catch (error) {
        console.error('Failed to fetch attachments', error);
        res.status(500).json({ message: 'Failed to fetch attachments' });
    }
});

// Download file
router.get('/download/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Missing file ID' });
        }

        const attachment = await prisma.attachment.findUnique({
            where: { id }
        });

        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const filePath = path.resolve(attachment.storage_path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath, attachment.file_name);
    } catch (error) {
        console.error('Download failed', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

// Delete attachment
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Missing file ID' });
        }

        const attachment = await prisma.attachment.findUnique({
            where: { id }
        });

        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Check permission (only uploader or admin)
        const user = (req as any).user;
        if (user.role !== 'admin' && user.role !== 'hr_staff' && user.id !== attachment.uploaded_by_id) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        // Delete file from disk
        if (fs.existsSync(attachment.storage_path)) {
            fs.unlinkSync(attachment.storage_path);
        }

        // Delete record
        await prisma.attachment.delete({
            where: { id }
        });

        res.json({ message: 'Attachment deleted' });
    } catch (error) {
        console.error('Delete failed', error);
        res.status(500).json({ message: 'Delete failed' });
    }
});

export default router;
