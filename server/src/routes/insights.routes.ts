import { Router } from 'express';
import { InsightsController } from '../controllers/insights.controller';

import { SavingsController } from '../controllers/savings.controller';

const router = Router();

router.get('/spending', InsightsController.getSpending);
router.get('/ledger', InsightsController.getLedger);
router.get('/savings', SavingsController.getPotentialSavings);
router.get('/spend', InsightsController.getSpendData); // Legacy
router.post('/refresh', InsightsController.categorizeAndEstimate);
router.get('/recurring', InsightsController.getRecurring);

export default router;
