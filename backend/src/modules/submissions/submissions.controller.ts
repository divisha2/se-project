import { Request, Response } from 'express';
import { submissionsService } from './submissions.service';

export const submissionsController = {
  listMine: async (req: Request, res: Response) => {
    res.json(await submissionsService.listMine(req.user!.id, req.query.courseId as string | undefined));
  },
  saveVersion: async (req: Request, res: Response) => {
    res.status(201).json(await submissionsService.saveVersion(req.user!.id, req.params.itemId, req.body ?? {}, req.file));
  },
  remove: async (req: Request, res: Response) => {
    res.json(await submissionsService.remove(req.user!.id, req.params.itemId));
  },
  restoreVersion: async (req: Request, res: Response) => {
    res.json(await submissionsService.restoreVersion(req.user!.id, req.params.itemId, Number(req.params.versionNumber)));
  },
  listVersions: async (req: Request, res: Response) => {
    res.json(await submissionsService.listVersions(req.user!, req.params.itemId));
  },
  download: async (req: Request, res: Response) => {
    res.json(await submissionsService.download(req.user!, req.params.submissionId));
  },
  setDeadline: async (req: Request, res: Response) => {
    const { deadline, partId, sectionId } = req.body;
    res.json(await submissionsService.setDeadline(req.user!.id, req.params.courseId, new Date(deadline), { partId, sectionId }));
  },
  reopen: async (req: Request, res: Response) => {
    res.json(await submissionsService.reopen(req.user!.id, req.params.itemId, req.body ?? {}));
  },
  listForCourse: async (req: Request, res: Response) => {
    res.json(
      await submissionsService.listForCourse(req.user!.id, req.params.courseId, {
        status: req.query.status as string | undefined,
        facultyId: req.query.facultyId as string | undefined,
      }),
    );
  },
  review: async (req: Request, res: Response) => {
    res.json(await submissionsService.review(req.user!.id, req.params.submissionId, req.body));
  },
};
