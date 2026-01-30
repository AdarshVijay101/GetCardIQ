import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import plaidRoutes from './routes/plaid.routes';
import dashboardRoutes from './routes/dashboard.routes';
import insightsRoutes from './routes/insights.routes';
import cardRoutes from './routes/card.routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

import { demoMiddleware } from './middleware/demo.middleware';
app.use(demoMiddleware);

import { AdminController } from './controllers/admin.controller';
import { adminMiddleware } from './middleware/admin.middleware';

// ADMIN ROUTES (Protected by Key, Exempt from User Auth)
// Must be BEFORE app.use('/api', authenticate) to avoid JWT requirement
app.delete('/api/admin/wipe-demo', adminMiddleware, AdminController.wipeDemo);

import { authenticate } from './middlewares/auth.middleware';

// Routes
// Apply Auth Middleware to all API routes
app.use('/api', authenticate);

app.use('/api/plaid', plaidRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/cards', cardRoutes);
import recommendationsRoutes from './routes/recommendations.routes';
app.use('/api/recommendations', recommendationsRoutes);
import aiRoutes from './routes/ai.routes';
app.use('/api/ai', aiRoutes);
import rewardsRoutes from './routes/rewards.routes';
app.use('/api/rewards', rewardsRoutes);
import benefitsRoutes from './routes/benefits.routes';
app.use('/api/benefits', benefitsRoutes);

app.get('/', (req, res) => {
    res.send('GetCardIQ API (Real Data & SOC-2 Ready)');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
