import { AppDataSource } from '../config/database';
import { SyncQueue, SyncOperation, SyncStatus } from '../entities/SyncQueue';
import { SyncBatchDto } from '../dto/sync.dto';
import { logger } from '../utils/logger';

const syncRepo = AppDataSource.getRepository(SyncQueue);

const SUPPORTED_ENTITIES: Record<string, string> = {
  stock_transaction: 'stock_transactions',
  cost_entry: 'cost_entries',
  checklist_submission: 'daily_checklist_submissions',
  incident_report: 'incident_reports',
};

export class SyncService {
  async processBatch(dto: SyncBatchDto, userId: string) {
    const results: Array<{ clientId: string; status: string; serverId?: string; error?: string }> = [];

    for (const op of dto.operations) {
      const entry = syncRepo.create({
        clientId: op.clientId,
        userId,
        entityType: op.entityType,
        entityId: op.entityId ?? null,
        operation: op.operation,
        payload: op.payload ?? null,
        clientTimestamp: new Date(op.clientTimestamp),
        status: SyncStatus.PROCESSING,
      });

      const saved = await syncRepo.save(entry);

      try {
        const result = await this.processOperation(op, userId);
        saved.status = SyncStatus.COMPLETED;
        saved.entityId = result?.id ?? op.entityId ?? null;
        await syncRepo.save(saved);
        results.push({ clientId: op.clientId, status: 'completed', serverId: result?.id });
      } catch (err) {
        saved.status = SyncStatus.FAILED;
        saved.errorMessage = (err as Error).message;
        saved.retryCount += 1;
        await syncRepo.save(saved);
        results.push({ clientId: op.clientId, status: 'failed', error: (err as Error).message });
        logger.warn(`Sync failed for ${op.entityType}:${op.clientId}`, err);
      }
    }

    return results;
  }

  private async processOperation(
    op: { entityType: string; entityId?: string; operation: SyncOperation; payload?: Record<string, unknown> },
    userId: string
  ): Promise<{ id: string } | null> {
    if (!SUPPORTED_ENTITIES[op.entityType]) {
      throw new Error(`Unsupported entity type: ${op.entityType}`);
    }

    const repo = AppDataSource.getRepository(SUPPORTED_ENTITIES[op.entityType]);

    if (op.operation === SyncOperation.CREATE) {
      const record = repo.create({ ...(op.payload ?? {}), createdBy: userId });
      return repo.save(record) as Promise<{ id: string }>;
    }

    if (op.operation === SyncOperation.UPDATE && op.entityId) {
      const existing = await repo.findOne({ where: { id: op.entityId } });
      if (!existing) throw new Error(`Record not found: ${op.entityId}`);

      // Conflict check: client timestamp vs server updatedAt
      const serverTs = (existing as Record<string, unknown>).updatedAt as Date | undefined;
      if (serverTs && op.payload?.['_clientTimestamp']) {
        const clientTs = new Date(op.payload['_clientTimestamp'] as string);
        if (serverTs > clientTs) {
          throw new Error('CONFLICT: Server version is newer than client');
        }
      }

      Object.assign(existing, op.payload ?? {});
      return repo.save(existing) as Promise<{ id: string }>;
    }

    if (op.operation === SyncOperation.DELETE && op.entityId) {
      const existing = await repo.findOne({ where: { id: op.entityId } });
      if (existing) await repo.remove(existing);
      return { id: op.entityId };
    }

    return null;
  }

  async getPendingCount(userId: string) {
    return syncRepo.count({ where: { userId, status: SyncStatus.FAILED } });
  }

  async getLastSync(userId: string) {
    return syncRepo.findOne({
      where: { userId, status: SyncStatus.COMPLETED },
      order: { updatedAt: 'DESC' },
    });
  }
}

export const syncService = new SyncService();
