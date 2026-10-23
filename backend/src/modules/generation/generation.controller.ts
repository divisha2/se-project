import { Request, Response } from 'express';
import { generationService } from './generation.service';

export const generationController = {
  generate: async (req: Request, res: Response) => {
    res.status(202).json(await generationService.generate(req.params.courseId));
  },
  getLatest: async (req: Request, res: Response) => {
    res.json(await generationService.getLatest(req.params.courseId));
  },
};
