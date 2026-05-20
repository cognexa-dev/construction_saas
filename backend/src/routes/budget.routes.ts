import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateBudgetItemDto, UpdateBudgetItemDto, CreateCostEntryDto } from '../dto/budget.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), budgetController.getByProject.bind(budgetController));
router.get('/project/:projectId/variance', authorize(UserRole.ADMIN, UserRole.OWNER), budgetController.getVarianceReport.bind(budgetController));
router.post('/', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(CreateBudgetItemDto), budgetController.createItem.bind(budgetController));
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(UpdateBudgetItemDto), budgetController.updateItem.bind(budgetController));
router.delete('/:id', authorize(UserRole.ADMIN), budgetController.deleteItem.bind(budgetController));
router.get('/:id/cost-entries', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), budgetController.getCostEntries.bind(budgetController));
router.post('/cost-entries', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), validateBody(CreateCostEntryDto), budgetController.addCostEntry.bind(budgetController));
router.delete('/cost-entries/:id', authorize(UserRole.ADMIN), budgetController.deleteCostEntry.bind(budgetController));

export default router;
