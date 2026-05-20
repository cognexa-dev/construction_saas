import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { CreateVendorDto, UpdateVendorDto, CreateVendorRatingDto } from '../dto/vendor.dto';
import { UserRole } from '../entities/User';

const router = Router();
router.use(authenticate);

router.get('/top', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), vendorController.getTopVendors.bind(vendorController));
router.get('/', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), vendorController.getAll.bind(vendorController));
router.get('/:id', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), vendorController.getById.bind(vendorController));
router.post('/', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(CreateVendorDto), vendorController.create.bind(vendorController));
router.put('/:id', authorize(UserRole.ADMIN, UserRole.OWNER), validateBody(UpdateVendorDto), vendorController.update.bind(vendorController));
router.delete('/:id', authorize(UserRole.ADMIN), vendorController.delete.bind(vendorController));
router.post('/:id/ratings', authorize(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERVISOR), validateBody(CreateVendorRatingDto), vendorController.addRating.bind(vendorController));

export default router;
