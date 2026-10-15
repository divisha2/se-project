import express from 'express';
import { CourseFile, File } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/check-completeness/:courseId', authenticate, authorize('coordinator'), async (req, res) => {
  try {
    const courseFile = await CourseFile.findOne({ where: { courseId: req.params.courseId } });
    
    if (!courseFile) {
      return res.status(404).json({ error: 'Course file not found' });
    }
    
    const submissions = await File.findAll({ 
      where: {
        courseId: req.params.courseId,
        status: ['valid', 'locked']
      }
    });
    
    // AI/System checks for missing mandatory sections
    const missingSections = []; // TODO: Implement actual logic
    
    await courseFile.update({
      completenessCheck: {
        allMandatorySectionsSubmitted: missingSections.length === 0,
        missingSections,
        lastChecked: new Date()
      }
    });
    
    res.json(courseFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/consolidate/:courseId', authenticate, async (req, res) => {
  try {
    // AI-assisted document consolidation
    const courseFile = await CourseFile.findOne({ where: { courseId: req.params.courseId } });
    
    if (!courseFile) {
      return res.status(404).json({ error: 'Course file not found' });
    }
    
    await courseFile.update({
      status: 'processing',
      consolidatedContent: {
        path: '/consolidated/temp.pdf',
        generatedAt: new Date(),
        aiProcessed: true
      }
    });
    
    res.json(courseFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-final/:courseId', authenticate, authorize('coordinator'), async (req, res) => {
  try {
    const courseFile = await CourseFile.findOne({ where: { courseId: req.params.courseId } });
    
    if (!courseFile) {
      return res.status(404).json({ error: 'Course file not found' });
    }
    
    await courseFile.update({
      status: 'finalized',
      finalCourseFile: {
        path: '/final/course-file.pdf',
        generatedAt: new Date(),
        downloadUrl: `/api/course-file/download/${courseFile.id}`
      }
    });
    
    res.json(courseFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
