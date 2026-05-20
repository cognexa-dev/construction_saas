import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export class InventoryController {
  async getAllItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50', search, category, lowStock } = req.query as Record<string, string>;
      const [items, total] = await inventoryService.getAllItems(
        parseInt(page), parseInt(limit), search, category, lowStock === 'true'
      );
      sendPaginated(res, items, total, parseInt(page), parseInt(limit));
    } catch (e) { next(e); }
  }

  async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.getItemById(req.params.id));
    } catch (e) { next(e); }
  }

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.createItem(req.body, req.user!.id), 'Item created', 201);
    } catch (e) { next(e); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.updateItem(req.params.id, req.body), 'Item updated');
    } catch (e) { next(e); }
  }

  async recordTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.recordTransaction(req.body, req.user!.id), 'Transaction recorded', 201);
    } catch (e) { next(e); }
  }

  async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.getTransactionHistory(req.params.id));
    } catch (e) { next(e); }
  }

  async createPR(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.createPR(req.body, req.user!.id), 'PR created', 201);
    } catch (e) { next(e); }
  }

  async getPRsByProject(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.getPRsByProject(req.params.projectId));
    } catch (e) { next(e); }
  }

  async getPRById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.getPRById(req.params.id));
    } catch (e) { next(e); }
  }

  async updatePRStatus(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.updatePRStatus(req.params.id, req.body, req.user!.id), 'PR status updated');
    } catch (e) { next(e); }
  }

  async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await inventoryService.getLowStockAlerts());
    } catch (e) { next(e); }
  }
}
export const inventoryController = new InventoryController();
