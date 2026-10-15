import { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    res.json(await authService.login(email, password));
  },
  me: async (req: Request, res: Response) => {
    res.json(await authService.getProfile(req.user!.id));
  },
};
