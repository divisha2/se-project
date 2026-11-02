import { Request, Response } from 'express';
import { generationService } from './generation.service';

export const generationController = {
  generate: async (req: Request, res: Response) => {
    res.status(201).json(await generationService.generate(req.user!.id, req.params.courseId, req.query.force === 'true'));
  },
  getLatest: async (req: Request, res: Response) => {
    res.json(await generationService.getLatest(req.user!.id, req.params.courseId));
  },
  getEditor: async (req: Request, res: Response) => {
    res.json(await generationService.getEditorData(req.user!.id, req.params.courseId));
  },
  saveSection: async (req: Request, res: Response) => {
    res.json(await generationService.saveSection(req.user!.id, req.params.courseId, Number(req.params.sectionId), req.body.text ?? ''));
  },
};
