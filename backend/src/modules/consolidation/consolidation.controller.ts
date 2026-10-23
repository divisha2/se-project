import { Request, Response } from 'express';
import { consolidationService } from './consolidation.service';

export const consolidationController = {
  runForSection: async (req: Request, res: Response) => {
    res.status(202).json(
      await consolidationService.runForSection(req.params.courseId, req.params.fileSectionId),
    );
  },
  runForCourse: async (req: Request, res: Response) => {
    res.status(202).json(await consolidationService.runForCourse(req.params.courseId));
  },
  listContent: async (req: Request, res: Response) => {
    res.json(await consolidationService.listContent(req.params.courseId));
  },
  getSources: async (req: Request, res: Response) => {
    res.json(await consolidationService.getSources(req.params.contentId));
  },
  editContent: async (req: Request, res: Response) => {
    res.json(await consolidationService.editContent(req.params.contentId, req.body.text));
  },
  setDecision: async (req: Request, res: Response) => {
    res.json(await consolidationService.setDecision(req.params.contentId, req.body.decision));
  },
  addManualContent: async (req: Request, res: Response) => {
    res.status(201).json(
      await consolidationService.addManualContent(
        req.params.courseId,
        req.body.fileSectionId,
        req.body.text,
      ),
    );
  },
};
