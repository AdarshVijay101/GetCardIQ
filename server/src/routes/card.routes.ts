import { Router } from 'express';
import { CardController } from '../controllers/card.controller';

const router = Router();

// Top Cards (Scraping)
router.get('/top', CardController.getTopCards);
router.post('/top/resync', CardController.resyncTopCards);
router.get('/top/sync-status', CardController.getSyncStatus);

// CRUD
router.get('/', CardController.list);
router.get('/search', CardController.search);
router.post('/', CardController.create);
router.delete('/:id', CardController.delete);

export default router;
