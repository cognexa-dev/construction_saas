import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateBoqItemDto, UpdateBoqItemDto } from '../dto/boq.dto';
import { boqService } from '../services/boq.service';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

const ALL  = [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR];
const MGMT = [UserRole.ADMIN, UserRole.OWNER];

// --- BOQ items ---

router.get('/:projectId', authorize(...ALL), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await boqService.getByProject(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/:projectId', authorize(...MGMT), validateBody(CreateBoqItemDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await boqService.create(req.params.projectId, req.body, req.user!.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', authorize(...MGMT), validateBody(UpdateBoqItemDto), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await boqService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize(...MGMT), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await boqService.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// --- Material links ---

router.get('/items/:itemId/materials', authorize(...ALL), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await boqService.getMaterials(req.params.itemId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/items/:itemId/materials', authorize(...MGMT), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inventoryItemId, consumptionRate } = req.body;
    if (!inventoryItemId || consumptionRate === undefined) {
      return res.status(400).json({ success: false, message: 'inventoryItemId and consumptionRate are required' });
    }
    const data = await boqService.addMaterial(req.params.itemId, inventoryItemId, Number(consumptionRate));
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/materials/:linkId', authorize(...MGMT), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { consumptionRate } = req.body;
    if (consumptionRate === undefined) {
      return res.status(400).json({ success: false, message: 'consumptionRate is required' });
    }
    const data = await boqService.updateMaterial(req.params.linkId, Number(consumptionRate));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/materials/:linkId', authorize(...MGMT), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await boqService.removeMaterial(req.params.linkId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
