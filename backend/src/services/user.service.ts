import { UserRepository } from '../repositories/user.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { AuditAction } from '../entities/AuditLog';
import { UserRole, UserStatus } from '../entities/User';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { AppError } from '../middleware/errorHandler';
import { authService } from './auth.service';

export class UserService {
  async getAllUsers(
    page: number,
    limit: number,
    search?: string,
    role?: UserRole,
    status?: UserStatus
  ) {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 20));
    return UserRepository.findAllPaginated(validPage, validLimit, search, role, status);
  }

  async getUserById(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async createUser(dto: CreateUserDto, createdById: string) {
    return authService.register(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
      },
      createdById
    );
  }

  async updateUser(id: string, dto: UpdateUserDto, updatedById: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);

    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone ?? null;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;

    const updated = await UserRepository.save(user);

    await AuditLogRepository.log({
      userId: updatedById,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: id,
      oldValues,
      newValues: { firstName: dto.firstName, lastName: dto.lastName, role: dto.role, status: dto.status },
    });

    return updated;
  }

  async deleteUser(id: string, deletedById: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);

    if (user.id === deletedById) throw new AppError('Cannot delete your own account', 400);

    await AuditLogRepository.log({
      userId: deletedById,
      action: AuditAction.DELETE,
      entityType: 'User',
      entityId: id,
      oldValues: { email: user.email, role: user.role },
    });

    await UserRepository.remove(user);
  }

  async toggleUserStatus(id: string, updatedById: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.id === updatedById) throw new AppError('Cannot change your own status', 400);

    user.status =
      user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    return UserRepository.save(user);
  }
}

export const userService = new UserService();
