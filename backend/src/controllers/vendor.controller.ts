import { Request, Response, NextFunction } from 'express';
import { vendorService } from '../services/vendor.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { VendorCategory, VendorStatus } from '../entities/Vendor';

export class VendorController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', search, category, status } = req.query as Record<string, string>;
      const [vendors, total] = await vendorService.getAll(
        parseInt(page), parseInt(limit), search, category as VendorCategory, status as VendorStatus
      );
      sendPaginated(res, vendors, total, parseInt(page), parseInt(limit));
    } catch (e) { next(e); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await vendorService.getById(req.params.id));
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await vendorService.create(req.body, req.user!.id), 'Vendor created', 201);
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await vendorService.update(req.params.id, req.body), 'Vendor updated');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await vendorService.delete(req.params.id);
      sendSuccess(res, null, 'Vendor deactivated');
    } catch (e) { next(e); }
  }

  async addRating(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, await vendorService.addRating(req.params.id, req.body, req.user!.id), 'Rating submitted', 201);
    } catch (e) { next(e); }
  }

  async getTopVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query as Record<string, string>;
      sendSuccess(res, await vendorService.getTopVendors(category as VendorCategory));
    } catch (e) { next(e); }
  }
}
export const vendorController = new VendorController();
