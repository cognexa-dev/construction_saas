import { Request, Response, NextFunction } from 'express';
import { safetyService } from '../services/safety.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { IncidentSeverity } from '../entities/IncidentReport';

export class SafetyController {
  async getChecklists(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.getAllChecklists()); } catch (e) { next(e); }
  }

  async createChecklist(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.createChecklist(req.body, req.user!.id), 'Checklist created', 201); } catch (e) { next(e); }
  }

  async submitChecklist(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.submitDailyChecklist(req.body, req.user!.id), 'Submitted', 201); } catch (e) { next(e); }
  }

  async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, from, to } = req.query as Record<string, string>;
      sendSuccess(res, await safetyService.getSubmissions(projectId, from, to));
    } catch (e) { next(e); }
  }

  async createIncident(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.createIncident(req.body, req.user!.id), 'Incident reported', 201); } catch (e) { next(e); }
  }

  async getIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, severity } = req.query as Record<string, string>;
      const [data, total] = await safetyService.getIncidents(projectId, severity as IncidentSeverity);
      sendPaginated(res, data, total, 1, 100);
    } catch (e) { next(e); }
  }

  async updateIncident(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.updateIncident(req.params.id, req.body)); } catch (e) { next(e); }
  }

  async addInsurance(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.addWorkerInsurance(req.body, req.user!.id), 'Insurance added', 201); } catch (e) { next(e); }
  }

  async getInsurances(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.getWorkerInsurances(req.query.projectId as string)); } catch (e) { next(e); }
  }

  async getExpiringInsurances(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.getExpiringInsurances(Number(req.query.days) || 30)); } catch (e) { next(e); }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await safetyService.getSafetyDashboard(req.query.projectId as string)); } catch (e) { next(e); }
  }
}
export const safetyController = new SafetyController();
