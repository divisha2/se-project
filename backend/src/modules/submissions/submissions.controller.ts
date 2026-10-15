import { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { submissionsService } from './submissions.service';

export const submissionsController = {
  listMine: async (req: Request, res: Response) => {
    res.json(await submissionsService.listMine(req.user!.id, req.query.courseId as string | undefined));
  },
  upload: async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('File is required');
    res.status(201).json(await submissionsService.upload(req.user!.id, req.body, req.file));
  },
  replace: async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('File is required');
    res.json(await submissionsService.replace(req.user!.id, req.params.documentId, req.file));
  },
  remove: async (req: Request, res: Response) => {
    res.json(await submissionsService.remove(req.user!.id, req.params.documentId));
  },
  listVersions: async (req: Request, res: Response) => {
    res.json(await submissionsService.listVersions(req.params.documentId));
  },
  setDeadline: async (req: Request, res: Response) => {
    res.json(await submissionsService.setDeadline(req.params.courseId, new Date(req.body.deadline)));
  },
  reopen: async (req: Request, res: Response) => {
    res.json(await submissionsService.reopen(req.params.documentId));
  },
  listForCourse: async (req: Request, res: Response) => {
    res.json(
      await submissionsService.listForCourse(req.params.courseId, {
        status: req.query.status as string | undefined,
        facultyId: req.query.facultyId as string | undefined,
      }),
    );
  },
};
