import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { ProjectStatus } from '../entities/Project';

export class ProjectController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
      const [projects, total] = await projectService.getAll(
        parseInt(page), parseInt(limit), status as ProjectStatus, search
      );
      sendPaginated(res, projects, total, parseInt(page), parseInt(limit));
    } catch (e) { next(e); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await projectService.getById(req.params.id));
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await projectService.create(req.body, req.user!.id), 'Project created', 201);
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await projectService.update(req.params.id, req.body), 'Project updated');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.delete(req.params.id);
      sendSuccess(res, null, 'Project deleted');
    } catch (e) { next(e); }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await projectService.getDashboardStats());
    } catch (e) { next(e); }
  }
}
export const projectController = new ProjectController();
