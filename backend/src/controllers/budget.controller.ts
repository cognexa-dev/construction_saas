import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';
import { sendSuccess } from '../utils/response';

export class BudgetController {
  async getByProject(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.getItemsByProject(req.params.projectId));
    } catch (e) { next(e); }
  }

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.createItem(req.body, req.user!.id), 'Budget item created', 201);
    } catch (e) { next(e); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.updateItem(req.params.id, req.body), 'Budget item updated');
    } catch (e) { next(e); }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      await budgetService.deleteItem(req.params.id);
      sendSuccess(res, null, 'Budget item deleted');
    } catch (e) { next(e); }
  }

  async getCostEntries(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.getCostEntries(req.params.id));
    } catch (e) { next(e); }
  }

  async addCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.addCostEntry(req.body, req.user!.id), 'Cost entry added', 201);
    } catch (e) { next(e); }
  }

  async deleteCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      await budgetService.deleteCostEntry(req.params.id);
      sendSuccess(res, null, 'Cost entry deleted');
    } catch (e) { next(e); }
  }

  async getVarianceReport(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await budgetService.getVarianceReport(req.params.projectId));
    } catch (e) { next(e); }
  }
}
export const budgetController = new BudgetController();
