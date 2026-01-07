import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per `window` (here, per hour)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    handler: (req, res, next, options) => {
        logger.warn(`Login rate limit exceeded for IP ${req.ip}`);
        res.status(options.statusCode).json({ error: options.message });
    }
});
