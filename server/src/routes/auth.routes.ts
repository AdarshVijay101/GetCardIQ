import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);

export default router;
