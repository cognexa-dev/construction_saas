import { Request, Response, NextFunction } from 'express';
import { financialsService } from '../services/financials.service';
import { CreateRevenueEntryDto, UpdateRevenueEntryDto, RevenueQueryDto, TallyExportDto } from '../dto/financials.dto';

export const financialsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query as { projectId?: string };
      const data = await financialsService.getFinancialsDashboard(projectId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getRevenueSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query as { projectId?: string };
      const data = await financialsService.getRevenueSummary(projectId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getRevenueEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialsService.getRevenueEntries(req.query as RevenueQueryDto);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async createRevenueEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialsService.createRevenueEntry(req.body as CreateRevenueEntryDto, req.user!.id);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },

  async updateRevenueEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialsService.updateRevenueEntry(req.params.id, req.body as UpdateRevenueEntryDto);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async deleteRevenueEntry(req: Request, res: Response, next: NextFunction) {
    try {
      await financialsService.deleteRevenueEntry(req.params.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async getMarginAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query as { projectId?: string };
      const data = await financialsService.getMarginAnalysis(projectId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async exportTally(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financialsService.exportTally(req.body as TallyExportDto, req.user!.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.csv);
    } catch (err) { next(err); }
  },

  async getExportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await financialsService.getExportLogs();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
