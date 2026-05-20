import { Router } from 'express';
import { complianceController } from '../controllers/compliance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { UpsertReraDto, CreateMilestoneDto, UpdateMilestoneDto, UpsertLandRecordDto, UpsertApprovalDto } from '../dto/compliance.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

const ALL = [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR];
const MGMT = [UserRole.ADMIN, UserRole.OWNER];

router.get('/summary', authorize(...MGMT), complianceController.getSummary.bind(complianceController));
router.get('/rera/:projectId', authorize(...ALL), complianceController.getRera.bind(complianceController));
router.put('/rera/:projectId', authorize(...MGMT), validateBody(UpsertReraDto), complianceController.upsertRera.bind(complianceController));
router.post('/rera/:projectId/milestones', authorize(...MGMT), validateBody(CreateMilestoneDto), complianceController.addMilestone.bind(complianceController));
router.patch('/milestones/:id', authorize(...ALL), validateBody(UpdateMilestoneDto), complianceController.updateMilestone.bind(complianceController));
router.get('/land/:projectId', authorize(...ALL), complianceController.getLand.bind(complianceController));
router.put('/land/:projectId', authorize(...MGMT), validateBody(UpsertLandRecordDto), complianceController.upsertLand.bind(complianceController));
router.put('/land/:projectId/approval', authorize(...MGMT), validateBody(UpsertApprovalDto), complianceController.upsertApproval.bind(complianceController));

export default router;
