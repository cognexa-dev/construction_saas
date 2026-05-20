import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { LoginDto, RefreshTokenDto } from '../dto/auth.dto';

const router = Router();

router.post('/login', validateBody(LoginDto), authController.login.bind(authController));
router.post('/refresh', validateBody(RefreshTokenDto), authController.refresh.bind(authController));
router.post('/logout', validateBody(RefreshTokenDto), authController.logout.bind(authController));
router.post('/logout-all', authenticate, authController.logoutAll.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
