import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller';
import { verifyJobScheduler } from '../middlewares/jobAuth.middleware';

const router = Router();

// Protect all job routes
router.use(verifyJobScheduler);

router.post('/sync', JobsController.triggerSync);
router.post('/weekly-summary', JobsController.triggerWeeklySummary);
router.post('/update-cards', JobsController.triggerCardUpdate);

export default router;
