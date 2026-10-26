import { Request, Response } from 'express';
import { consolidationService } from './consolidation.service';

export const consolidationController = {
  runForSection: async (req: Request, res: Response) => {
    res.status(202).json(
      await consolidationService.runForSection(req.user!.id, req.params.courseId, req.params.templateSectionId, req.query.force === 'true'),
    );
  },
  runForCourse: async (req: Request, res: Response) => {
    res.status(202).json(await consolidationService.runForCourse(req.user!.id, req.params.courseId, req.query.force === 'true'));
  },
  listContent: async (req: Request, res: Response) => {
    res.json(await consolidationService.listContent(req.user!.id, req.params.courseId));
  },
  getSources: async (req: Request, res: Response) => {
    res.json(await consolidationService.getSources(req.user!.id, req.params.contentId));
  },
  editContent: async (req: Request, res: Response) => {
    res.json(await consolidationService.editContent(req.user!.id, req.params.contentId, req.body.text));
  },
  setDecision: async (req: Request, res: Response) => {
    res.json(await consolidationService.setDecision(req.user!.id, req.params.contentId, req.body.decision));
  },
  addManualContent: async (req: Request, res: Response) => {
    res.status(201).json(
      await consolidationService.addManualContent(req.user!.id, req.params.courseId, String(req.body.templateSectionId), req.body.text),
    );
  },
};
