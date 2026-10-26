import { Request, Response } from 'express';
import { coursesService } from './courses.service';

export const coursesController = {
  
list: async (req: Request, res: Response) => {
  try {
    const result = await coursesService.listCourses(
      req.user!.id,
      req.user!.role
    );

    res.json(result);
  } catch (error) {
    console.error('COURSES API ERROR:', error);
    throw error;
  }
},

  get: async (req: Request, res: Response) => {
    res.json(await coursesService.getCourse(req.params.courseId, req.user!));
  },
  meta: async (_req: Request, res: Response) => {
    res.json(await coursesService.meta());
  },
  create: async (req: Request, res: Response) => {
    res.status(201).json(await coursesService.createCourse(req.body));
  },
  update: async (req: Request, res: Response) => {
    res.json(await coursesService.updateCourse(req.params.courseId, req.body));
  },
  createSection: async (req: Request, res: Response) => {
    res.status(201).json(await coursesService.createSection(req.params.courseId, req.body));
  },
  assignFaculty: async (req: Request, res: Response) => {
    res.status(201).json(await coursesService.assignFaculty(req.params.courseId, req.body));
  },
  assignCoordinator: async (req: Request, res: Response) => {
    res.json(await coursesService.assignCoordinator(req.params.courseId, req.body.userId));
  },
  updateInstitution: async (req: Request, res: Response) => {
    res.json(await coursesService.updateInstitution(req.params.courseId, req.body));
  },
  getCommonInfo: async (req: Request, res: Response) => {
    res.json(await coursesService.getCommonInfo(req.params.courseId, req.user!));
  },
  updateCommonInfo: async (req: Request, res: Response) => {
    res.json(await coursesService.updateCommonInfo(req.params.courseId, req.user!.id, req.body));
  },
};
