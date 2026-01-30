import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';

const router = Router();

router.get('/', BudgetController.getBudget);
router.put('/', BudgetController.updateBudget);

export default router;
