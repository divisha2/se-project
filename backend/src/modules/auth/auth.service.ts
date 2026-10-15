import { ApiError } from '../../utils/ApiError';

// TODO (once Prisma models exist):
//  - login(email, password): find user, check isActive (FR-ADM-03), bcrypt.compare, return signToken(user.id, role)
//  - getProfile(userId)
export const authService = {
  async login(_email: string, _password: string) {
    throw ApiError.notImplemented('auth.login');
  },
  async getProfile(_userId: string) {
    throw ApiError.notImplemented('auth.getProfile');
  },
};
