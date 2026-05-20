import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { SyncBatchDto } from '../dto/sync.dto';

const router = Router();
router.use(authenticate);

router.post('/batch', validateBody(SyncBatchDto), syncController.processBatch.bind(syncController));
router.get('/status', syncController.getStatus.bind(syncController));

export default router;
