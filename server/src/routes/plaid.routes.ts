import { Router } from 'express';
import { PlaidController } from '../controllers/plaid.controller';

const router = Router();

router.post('/link-token', PlaidController.createLinkToken);
router.post('/exchange_public_token', PlaidController.exchangePublicToken);
router.post('/transactions/sync', PlaidController.syncTransactions);
router.get('/debug', PlaidController.debugSync);

export default router;
