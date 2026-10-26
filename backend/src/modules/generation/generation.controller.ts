import { Request, Response } from 'express';
import { generationService } from './generation.service';

export const generationController = {
  generate: async (req: Request, res: Response) => {
    res.status(201).json(await generationService.generate(req.user!.id, req.params.courseId, req.query.force === 'true'));
  },
  getLatest: async (req: Request, res: Response) => {
    res.json(await generationService.getLatest(req.user!.id, req.params.courseId));
  },
};
