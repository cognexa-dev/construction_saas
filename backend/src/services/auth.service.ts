import { Request } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { AuditAction } from '../entities/AuditLog';
import { User, UserRole } from '../entities/User';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { logger } from '../utils/logger';

export class AuthService {
  async login(dto: LoginDto, req: Request) {
    const user = await UserRepository.findByEmailWithPassword(dto.email);

    if (!user) {
      await AuditLogRepository.log({
        action: AuditAction.LOGIN_FAILED,
        newValues: { email: dto.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is not active. Contact administrator.', 403);
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      await AuditLogRepository.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await this.generateTokens(user, req);

    user.lastLoginAt = new Date();
    await UserRepository.save(user);

    await AuditLogRepository.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User ${user.email} logged in`);
    return { tokens, user };
  }

  async register(dto: RegisterDto, createdById?: string): Promise<User> {
    const exists = await UserRepository.emailExists(dto.email);
    if (exists) throw new AppError('Email already registered', 409);

    const user = UserRepository.create({
      email: dto.email.toLowerCase(),
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      role: dto.role ?? UserRole.SUPERVISOR,
      createdBy: createdById ?? null,
    });

    const saved = await UserRepository.save(user);

    await AuditLogRepository.log({
      userId: createdById,
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: saved.id,
      newValues: { email: saved.email, role: saved.role },
    });

    return saved;
  }

  async refreshTokens(token: string, req: Request) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const storedToken = await RefreshTokenRepository.findValidToken(token);
    if (!storedToken || !storedToken.isValid) {
      throw new AppError('Refresh token revoked or expired', 401);
    }

    const user = await UserRepository.findById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new AppError('User not found or inactive', 401);
    }

    await RefreshTokenRepository.revokeToken(token);
    return this.generateTokens(user, req);
  }

  async logout(refreshToken: string): Promise<void> {
    await RefreshTokenRepository.revokeToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshTokenRepository.revokeAllUserTokens(userId);
  }

  private async generateTokens(user: User, req: Request) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await RefreshTokenRepository.save(
      RefreshTokenRepository.create({
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiryDate(),
        ipAddress: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      })
    );

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}

export const authService = new AuthService();
