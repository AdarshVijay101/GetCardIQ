import { Router } from 'express';
import { PlaidController } from '../controllers/plaid.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Protected Routes
// Aligned with User requested path /api/plaid/link-token
router.post('/link-token', authenticate, PlaidController.createLinkToken);
router.post('/exchange_public_token', authenticate, PlaidController.exchangePublicToken);

export default router;
