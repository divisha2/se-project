import { Request, Response } from 'express';
import { usersService } from './users.service';

export const usersController = {
  list: async (req: Request, res: Response) => {
    res.json(await usersService.list(req.query.role as string | undefined));
  },
  create: async (req: Request, res: Response) => {
    res.status(201).json(await usersService.create(req.body));
  },
  updateRole: async (req: Request, res: Response) => {
    res.json(await usersService.updateRole(req.params.id, req.body.role));
  },
  setActive: async (req: Request, res: Response) => {
    res.json(await usersService.setActive(req.params.id, req.body.isActive, req.user!.id));
  },
};
