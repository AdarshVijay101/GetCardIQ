import winston from 'winston';

// Keys to redact from logs
const REDACT_KEYS = ['password', 'token', 'access_token', 'secret', 'key', 'authorization', 'cookie'];

const redactSecrets = winston.format((info) => {
    const mask = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;

        // If it's an array, mask each item
        if (Array.isArray(obj)) {
            return obj.map(mask);
        }

        const newObj = { ...obj };
        for (const key of Object.keys(newObj)) {
            if (REDACT_KEYS.includes(key.toLowerCase()) || key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) {
                newObj[key] = '[REDACTED]';
            } else if (typeof newObj[key] === 'object') {
                newObj[key] = mask(newObj[key]);
            }
        }
        return newObj;
    };

    return mask(info);
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        redactSecrets(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ],
});
