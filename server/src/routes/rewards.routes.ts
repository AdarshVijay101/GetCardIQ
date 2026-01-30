import { Router } from 'express';
import { RewardsController } from '../controllers/rewards.controller';

const router = Router();

// Analytics
router.get('/summary', RewardsController.getSummary);
router.get('/breakdown', RewardsController.getBreakdown);
router.get('/ledger', RewardsController.getLedger);
router.get('/balances', RewardsController.getAllBalances);

// Actions
router.post('/setup', RewardsController.setupCard);
router.post('/redeem', RewardsController.redeem);
router.post('/adjust', RewardsController.adjust);

export default router;
