import express from 'express';
import { Course, User, CourseFaculty } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'coordinator') {
      where.coordinatorId = req.user.id;
    }
    
    const courses = await Course.findAll({
      where,
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['section'] }
        }
      ]
    });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/assign-coordinator', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.update({ 
      coordinatorId: req.body.coordinatorId,
      status: 'assigned'
    });
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/assign-faculty', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { facultyId, section } = req.body;
    
    await CourseFaculty.create({
      courseId: req.params.id,
      userId: facultyId,
      section
    });
    
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['section'] }
        }
      ]
    });
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['section'] }
        }
      ]
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
