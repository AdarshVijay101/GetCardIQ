
import { Router } from 'express';
import { BenefitsController } from '../controllers/benefits.controller';

const router = Router();

router.get('/status', BenefitsController.getBenefitStatus);
router.get('/missed', BenefitsController.getMissedRewards);

export default router;
