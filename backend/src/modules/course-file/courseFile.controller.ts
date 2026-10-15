import { Request, Response } from 'express';
import { courseFileService } from './courseFile.service';

export const courseFileController = {
  listSections: async (req: Request, res: Response) => {
    res.json(await courseFileService.listSections(req.params.courseId));
  },
  upsertSection: async (req: Request, res: Response) => {
    res.status(201).json(await courseFileService.upsertSection(req.params.courseId, req.body));
  },
  completionStatus: async (req: Request, res: Response) => {
    res.json(await courseFileService.getCompletionStatus(req.params.courseId));
  },
};
