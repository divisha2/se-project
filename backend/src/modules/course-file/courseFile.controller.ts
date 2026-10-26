import { Request, Response } from 'express';
import { courseFileService } from './courseFile.service';

export const courseFileController = {
  listSections: async (req: Request, res: Response) => {
    res.json(await courseFileService.listSections(req.params.courseId, req.user!));
  },
  upsertSection: async (req: Request, res: Response) => {
    res.status(201).json(await courseFileService.upsertSection(req.params.courseId, req.body));
  },
  completionStatus: async (req: Request, res: Response) => {
    res.json(await courseFileService.getCompletionStatus(req.params.courseId, req.user!.id));
  },
  workspace: async (req: Request, res: Response) => {
    res.json(await courseFileService.getWorkspace(req.params.courseId, req.user!));
  },
  submitPart: async (req: Request, res: Response) => {
    const { courseId, sectionId, partId } = req.params;
    res.json(await courseFileService.submitPart(req.user!.id, courseId, sectionId, partId, req.body?.notes));
  },
  completeSubmission: async (req: Request, res: Response) => {
    res.json(await courseFileService.completeSubmission(req.user!.id, req.params.courseId, req.params.sectionId));
  },
  reopenPart: async (req: Request, res: Response) => {
    const { courseId, sectionId, partId } = req.params;
    res.json(await courseFileService.reopenPart(req.user!.id, courseId, sectionId, partId, req.body?.reason));
  },
};
