import express from 'express';
import multer from 'multer';
import path from 'path';
import { File, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    // Check if replacing existing document
    const existingFile = await File.findOne({
      where: {
        courseId: req.body.courseId,
        section: req.body.section,
        uploadedById: req.user.id
      }
    });

    if (existingFile) {
      const previousVersions = existingFile.previousVersions || [];
      previousVersions.push({
        path: existingFile.path,
        uploadedAt: existingFile.updatedAt,
        version: existingFile.version
      });
      
      await existingFile.update({
        version: existingFile.version + 1,
        name: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        status: 'under_validation',
        previousVersions
      });
      
      // Trigger AI validation
      setTimeout(() => validateDocument(existingFile.id), 1000);
      
      return res.status(200).json(existingFile);
    }

    const fileData = await File.create({
      name: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      courseId: req.body.courseId,
      section: req.body.section,
      uploadedById: req.user.id,
      category: req.body.category,
      description: req.body.description,
      status: 'under_validation'
    });
    
    // Trigger AI validation
    setTimeout(() => validateDocument(fileData.id), 1000);
    
    res.status(201).json(fileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI validation placeholder
async function validateDocument(fileId) {
  try {
    const file = await File.findByPk(fileId);
    if (!file) return;
    
    // Simulate AI validation
    const isValid = Math.random() > 0.2; // 80% success rate for demo
    
    await file.update({
      status: isValid ? 'valid' : 'invalid',
      validationResult: {
        isValid,
        errors: isValid ? [] : ['Document format not recognized', 'Missing required sections'],
        checkedAt: new Date(),
        checkedBy: 'AI System'
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
  }
}

router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const files = await File.findAll({
      where: { courseId: req.params.courseId },
      include: [{
        model: User,
        as: 'uploadedBy',
        attributes: ['id', 'name', 'email']
      }]
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.status === 'locked' || file.status === 'included_in_final') {
      return res.status(403).json({ error: 'Cannot delete locked document' });
    }
    
    await file.destroy();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
