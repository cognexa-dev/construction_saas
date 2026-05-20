import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { estimationService } from '../services/estimation.service';
import { EstimationCategory } from '../entities/EstimationItem';

const router = Router();
router.use(authenticate);

// GET /api/estimations/:projectId
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const result = await estimationService.getByProject(req.params.projectId);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, message: e.message ?? 'Error' });
  }
});

// PATCH /api/estimations/:projectId/settings
router.patch('/:projectId/settings', async (req: Request, res: Response) => {
  try {
    const result = await estimationService.updateSettings(req.params.projectId, req.body);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, message: e.message ?? 'Error' });
  }
});

// POST /api/estimations/:projectId/items
router.post('/:projectId/items', async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user?: { id: string } }).user;
    const result = await estimationService.addItem(
      req.params.projectId,
      { ...req.body, category: req.body.category as EstimationCategory },
      user?.id ?? '',
    );
    res.status(201).json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, message: e.message ?? 'Error' });
  }
});

// PATCH /api/estimations/items/:id
router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    const result = await estimationService.updateItem(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, message: e.message ?? 'Error' });
  }
});

// DELETE /api/estimations/items/:id
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    await estimationService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ success: false, message: e.message ?? 'Error' });
  }
});

export default router;
