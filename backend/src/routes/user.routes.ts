import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { UserRole } from '../entities/User';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  userController.getAll.bind(userController)
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.OWNER),
  userController.getById.bind(userController)
);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validateBody(CreateUserDto),
  userController.create.bind(userController)
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateBody(UpdateUserDto),
  userController.update.bind(userController)
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  userController.delete.bind(userController)
);

router.patch(
  '/:id/toggle-status',
  authorize(UserRole.ADMIN),
  userController.toggleStatus.bind(userController)
);

export default router;
