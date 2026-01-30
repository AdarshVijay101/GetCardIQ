import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/summary', DashboardController.getSummary);
router.get('/transactions', DashboardController.getRecentTransactions);
router.get('/insights/spend', DashboardController.getSpendAnalytics);
router.get('/recommendations/best-card', DashboardController.getRecommendation);
router.get('/actions', DashboardController.getActions);

export default router;
