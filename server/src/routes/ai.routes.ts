
import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/status', authenticate, AIController.getStatus);

export default router;
