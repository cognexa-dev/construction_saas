import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { UserRole, UserStatus } from '../entities/User';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search,
        role,
        status,
      } = req.query as Record<string, string>;

      const [users, total] = await userService.getAllUsers(
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        role as UserRole,
        status as UserStatus
      );

      const safeUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }));

      sendPaginated(res, safeUsers, total, parseInt(page, 10), parseInt(limit, 10));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id);
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(req.body, req.user!.id);
      sendSuccess(
        res,
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        'User created successfully',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user!.id);
      sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id, req.user!.id);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.toggleUserStatus(req.params.id, req.user!.id);
      sendSuccess(res, { id: user.id, status: user.status }, 'User status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
