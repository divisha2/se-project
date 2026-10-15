import { ApiError } from '../../utils/ApiError';

// Admin user management.
//  FR-ADM-01 create user accounts (hash password with bcryptjs)
//  FR-ADM-02 assign roles
//  FR-ADM-03 activate / deactivate accounts
export const usersService = {
  async list() {
    throw ApiError.notImplemented('users.list');
  },
  async create(_data: unknown) {
    throw ApiError.notImplemented('users.create');
  },
  async updateRole(_id: string, _role: string) {
    throw ApiError.notImplemented('users.updateRole');
  },
  async setActive(_id: string, _isActive: boolean) {
    throw ApiError.notImplemented('users.setActive');
  },
};
