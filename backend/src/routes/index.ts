import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import budgetRoutes from './budget.routes';
import inventoryRoutes from './inventory.routes';
import vendorRoutes from './vendor.routes';
import safetyRoutes from './safety.routes';
import complianceRoutes from './compliance.routes';
import syncRoutes from './sync.routes';
import financialsRoutes from './financials.routes';
import boqRoutes from './boq.routes';
import estimationRoutes from './estimation.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/budget', budgetRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/vendors', vendorRoutes);
router.use('/safety', safetyRoutes);
router.use('/compliance', complianceRoutes);
router.use('/sync', syncRoutes);
router.use('/financials', financialsRoutes);
router.use('/boq', boqRoutes);
router.use('/estimations', estimationRoutes);
router.use('/ai', aiRoutes);

export default router;
