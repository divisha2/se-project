import express from 'express';
import { Submission, Course, User } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: { courseId: req.params.courseId },
      include: [
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lock/:courseId', authenticate, authorize('coordinator'), async (req, res) => {
  try {
    await Submission.update(
      { 
        status: 'locked',
        lockedAt: new Date()
      },
      { 
        where: { courseId: req.params.courseId }
      }
    );
    res.json({ message: 'All submissions locked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
