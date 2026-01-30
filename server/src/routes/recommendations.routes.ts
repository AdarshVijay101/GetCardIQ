
import { Router } from 'express';
import { RecommendationsController } from '../controllers/recommendations.controller';

const router = Router();

router.get('/best-card', RecommendationsController.getBestCard);

export default router;
