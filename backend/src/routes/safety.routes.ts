import { Router } from 'express';
import { safetyController } from '../controllers/safety.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateChecklistDto, SubmitChecklistDto, CreateIncidentReportDto, UpdateIncidentReportDto, CreateWorkerInsuranceDto } from '../dto/safety.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

const ALL = [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR];
const MGMT = [UserRole.ADMIN, UserRole.OWNER];

router.get('/dashboard', authorize(...ALL), safetyController.getDashboard.bind(safetyController));
router.get('/checklists', authorize(...ALL), safetyController.getChecklists.bind(safetyController));
router.post('/checklists', authorize(...MGMT), validateBody(CreateChecklistDto), safetyController.createChecklist.bind(safetyController));
router.post('/checklists/submit', authorize(...ALL), validateBody(SubmitChecklistDto), safetyController.submitChecklist.bind(safetyController));
router.get('/checklists/submissions', authorize(...ALL), safetyController.getSubmissions.bind(safetyController));
router.get('/incidents', authorize(...ALL), safetyController.getIncidents.bind(safetyController));
router.post('/incidents', authorize(...ALL), validateBody(CreateIncidentReportDto), safetyController.createIncident.bind(safetyController));
router.put('/incidents/:id', authorize(...ALL), validateBody(UpdateIncidentReportDto), safetyController.updateIncident.bind(safetyController));
router.get('/insurance', authorize(...ALL), safetyController.getInsurances.bind(safetyController));
router.post('/insurance', authorize(...MGMT), validateBody(CreateWorkerInsuranceDto), safetyController.addInsurance.bind(safetyController));
router.get('/insurance/expiring', authorize(...ALL), safetyController.getExpiringInsurances.bind(safetyController));

export default router;
