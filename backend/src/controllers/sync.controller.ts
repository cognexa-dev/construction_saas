import { Request, Response, NextFunction } from 'express';
import { syncService } from '../services/sync.service';
import { sendSuccess } from '../utils/response';

export class SyncController {
  async processBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await syncService.processBatch(req.body, req.user!.id);
      sendSuccess(res, results, 'Sync completed');
    } catch (e) { next(e); }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const [pendingCount, lastSync] = await Promise.all([
        syncService.getPendingCount(req.user!.id),
        syncService.getLastSync(req.user!.id),
      ]);
      sendSuccess(res, { pendingCount, lastSyncAt: lastSync?.updatedAt ?? null });
    } catch (e) { next(e); }
  }
}
export const syncController = new SyncController();
