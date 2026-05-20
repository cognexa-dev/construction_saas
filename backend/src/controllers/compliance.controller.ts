import { Request, Response, NextFunction } from 'express';
import { complianceService } from '../services/compliance.service';
import { sendSuccess } from '../utils/response';

export class ComplianceController {
  async getRera(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.getReraByProject(req.params.projectId)); } catch (e) { next(e); }
  }

  async upsertRera(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.upsertRera(req.params.projectId, req.body, req.user!.id)); } catch (e) { next(e); }
  }

  async addMilestone(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.addMilestone(req.params.projectId, req.body, req.user!.id), 'Milestone added', 201); } catch (e) { next(e); }
  }

  async updateMilestone(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.updateMilestone(req.params.id, req.body)); } catch (e) { next(e); }
  }

  async getLand(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.getLandRecord(req.params.projectId)); } catch (e) { next(e); }
  }

  async upsertLand(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.upsertLandRecord(req.params.projectId, req.body, req.user!.id)); } catch (e) { next(e); }
  }

  async upsertApproval(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.upsertApproval(req.params.projectId, req.body, req.user!.id)); } catch (e) { next(e); }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await complianceService.getComplianceSummary()); } catch (e) { next(e); }
  }
}
export const complianceController = new ComplianceController();
