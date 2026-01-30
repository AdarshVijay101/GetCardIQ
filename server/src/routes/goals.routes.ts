import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';

const router = Router();

router.get('/', GoalsController.listGoals);
router.post('/', GoalsController.createGoal);
router.put('/:id', GoalsController.updateGoal);
router.delete('/:id', GoalsController.deleteGoal);

export default router;
