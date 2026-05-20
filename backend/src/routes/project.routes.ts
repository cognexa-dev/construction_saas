import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize(UserRole.ADMIN, UserRole.OWNER), projectController.getDashboardStats.bind(projectController));
router.get('/', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), projectController.getAll.bind(projectController));
router.get('/:id', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), projectController.getById.bind(projectController));
router.post('/', authorize(UserRole.ADMIN), validateBody(CreateProjectDto), projectController.create.bind(projectController));
router.put('/:id', authorize(UserRole.ADMIN), validateBody(UpdateProjectDto), projectController.update.bind(projectController));
router.delete('/:id', authorize(UserRole.ADMIN), projectController.delete.bind(projectController));

export default router;
