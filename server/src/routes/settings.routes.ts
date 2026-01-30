
import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/connections', SettingsController.getConnections);
router.delete('/connections/:id', SettingsController.deleteConnection);
router.get('/profile', SettingsController.getProfile);
router.put('/profile', SettingsController.updateProfile);

export default router;
