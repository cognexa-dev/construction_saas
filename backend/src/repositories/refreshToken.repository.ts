import { AppDataSource } from '../config/database';
import { RefreshToken } from '../entities/RefreshToken';

export const RefreshTokenRepository = AppDataSource.getRepository(RefreshToken).extend({
  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  },

  async revokeToken(token: string): Promise<void> {
    await this.update({ token }, { isRevoked: true });
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.update({ userId, isRevoked: false }, { isRevoked: true });
  },

  async deleteExpiredTokens(): Promise<void> {
    await this.createQueryBuilder()
      .delete()
      .where('expires_at < NOW() OR is_revoked = true')
      .execute();
  },
});
