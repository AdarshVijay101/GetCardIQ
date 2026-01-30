import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './utils/logger';
import SearchRouter from './routes/search.routes'; // We will create this
import ProfileRouter from './routes/profile.routes'; // We will create this

// Assuming these routes already exist in the actual app.ts file,
// but were not provided in the initial document snippet.
// If they don't exist, this will cause reference errors.
import CardRouter from './routes/card.routes';
app.use('/api/cards', CardRouter);

import DashboardRouter from './routes/dashboard.routes';
app.use('/api/dashboard', DashboardRouter);

import InsightsRouter from './routes/insights.routes';
app.use('/api/insights', InsightsRouter);

app.use('/api/search', SearchRouter);
app.use('/api/profile', ProfileRouter);
import RewardsRouter from './routes/rewards.routes';
app.use('/api/rewards', RewardsRouter);
import NotificationRouter from './routes/notification.routes';
app.use('/api/notifications', NotificationRouter);
import SettingsRouter from './routes/settings.routes';
app.use('/api/settings', SettingsRouter);
import RecommendationsRouter from './routes/recommendations.routes';
app.use('/api/recommendations', RecommendationsRouter);

import BenefitsRouter from './routes/benefits.routes';
app.use('/api/benefits', BenefitsRouter);

import GoalsRouter from './routes/goals.routes';
app.use('/api/goals', GoalsRouter);

import BudgetRouter from './routes/budget.routes';
app.use('/api/budget', BudgetRouter);


const PORT = process.env.PORT || 4000;

// Run initial jobs
import { initDB } from './db/init';
import { MonthlyAuditJob } from './jobs/monthlyAudit';

initDB().then(() => {
    // MonthlyAuditJob.run(); // Run once at startup for Audit Demo
});

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log("[Plaid] ENV:", process.env.PLAID_ENV, "CLIENT_ID set:", !!process.env.PLAID_CLIENT_ID, "SECRET set:", !!process.env.PLAID_SECRET);
});
