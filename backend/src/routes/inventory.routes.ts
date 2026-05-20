import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  CreateInventoryItemDto, UpdateInventoryItemDto,
  CreateStockTransactionDto, CreatePurchaseRequisitionDto, UpdatePRStatusDto,
} from '../dto/inventory.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

router.get('/alerts/low-stock', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getLowStockAlerts.bind(inventoryController));
router.get('/', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getAllItems.bind(inventoryController));
router.get('/:id', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getItemById.bind(inventoryController));
router.post('/', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(CreateInventoryItemDto), inventoryController.createItem.bind(inventoryController));
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(UpdateInventoryItemDto), inventoryController.updateItem.bind(inventoryController));
router.get('/:id/transactions', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getTransactionHistory.bind(inventoryController));
router.post('/transactions', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), validateBody(CreateStockTransactionDto), inventoryController.recordTransaction.bind(inventoryController));
router.post('/pr', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), validateBody(CreatePurchaseRequisitionDto), inventoryController.createPR.bind(inventoryController));
router.get('/pr/project/:projectId', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getPRsByProject.bind(inventoryController));
router.get('/pr/:id', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), inventoryController.getPRById.bind(inventoryController));
router.patch('/pr/:id/status', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(UpdatePRStatusDto), inventoryController.updatePRStatus.bind(inventoryController));

export default router;
