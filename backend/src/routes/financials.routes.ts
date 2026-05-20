import { Router } from 'express';
import { financialsController } from '../controllers/financials.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateRevenueEntryDto, UpdateRevenueEntryDto, TallyExportDto } from '../dto/financials.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

const ALL = [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR];
const MGMT = [UserRole.ADMIN, UserRole.OWNER];

router.get('/dashboard', authorize(...ALL), financialsController.getDashboard.bind(financialsController));
router.get('/revenue/summary', authorize(...ALL), financialsController.getRevenueSummary.bind(financialsController));
router.get('/revenue', authorize(...ALL), financialsController.getRevenueEntries.bind(financialsController));
router.post('/revenue', authorize(...MGMT), validateBody(CreateRevenueEntryDto), financialsController.createRevenueEntry.bind(financialsController));
router.put('/revenue/:id', authorize(...MGMT), validateBody(UpdateRevenueEntryDto), financialsController.updateRevenueEntry.bind(financialsController));
router.delete('/revenue/:id', authorize(...MGMT), financialsController.deleteRevenueEntry.bind(financialsController));
router.get('/margin', authorize(...MGMT), financialsController.getMarginAnalysis.bind(financialsController));
router.post('/tally/export', authorize(...MGMT), validateBody(TallyExportDto), financialsController.exportTally.bind(financialsController));
router.get('/tally/logs', authorize(...MGMT), financialsController.getExportLogs.bind(financialsController));

export default router;
