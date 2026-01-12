
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

        // Fix Korean filename encoding: multer sends Latin-1 encoded filenames
        const decodedFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        const attachment = await prisma.attachment.create({
            data: {
                entity_type: entityType,
                entity_id: entityId,
                file_name: decodedFileName,
                file_type: path.extname(decodedFileName).substring(1), // e.g., 'pdf'
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

// IMPORTANT: Specific routes MUST come BEFORE generic pattern routes!
// Download file - MUST be before /:entityType/:entityId
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

        // Use absolute path from process.cwd() for reliable file resolution
        const filePath = path.isAbsolute(attachment.storage_path)
            ? attachment.storage_path
            : path.join(process.cwd(), attachment.storage_path);

        console.log('[Download Debug] storage_path:', attachment.storage_path);
        console.log('[Download Debug] resolved filePath:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('[Download Debug] File not found:', filePath);
            return res.status(404).json({ message: 'File not found on server' });
        }

        const fileBuffer = fs.readFileSync(filePath);
        console.log('[Download Debug] Read file buffer size:', fileBuffer.length, 'bytes');

        const encodedName = encodeURIComponent(attachment.file_name);

        // Set headers and send file
        res.writeHead(200, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': attachment.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`,
            'Content-Length': fileBuffer.length
        });

        res.end(fileBuffer);
        console.log('[Download Debug] File sent successfully, bytes:', fileBuffer.length);
    } catch (error) {
        console.error('Download failed', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

// Get attachments for an entity - Generic pattern comes AFTER specific routes
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
