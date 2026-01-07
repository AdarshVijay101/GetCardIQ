import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { apiLimiter } from './middlewares/rateLimiter';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/jobs.routes';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors()); // Configure origin in production!
app.use(express.json());

// Global Rate Limiter
app.use(apiLimiter);

// Request Logger
app.use((req, res, next) => {
    logger.info({
        message: 'Incoming Request',
        method: req.method,
        url: req.url,
        ip: req.ip,
        // Body is redacted by logger format automatically if it contains secrets
        body: req.body
    });
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

export default app;
