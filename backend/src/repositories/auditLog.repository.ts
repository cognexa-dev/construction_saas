import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction } from '../entities/AuditLog';

export const AuditLogRepository = AppDataSource.getRepository(AuditLog).extend({
  async log(params: {
    userId?: string;
    action: AuditAction;
    entityType?: string;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.create(params);
    return this.save(log);
  },
});
