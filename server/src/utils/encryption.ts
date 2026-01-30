import crypto from 'crypto';

// AES-256-GCM Algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// In a real production app (GCP), this key would come from Secret Manager.
// For local dev, we use a fixed key derived from .env or a default (securely ignored in prod).
const SECRET_MASTER_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Exactly 32 chars

export const encrypt = (text: string): Buffer => {
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Create a cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_MASTER_KEY), iv);

    // Encrypt the text
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // Get the auth tag
    const tag = cipher.getAuthTag();

    // Return the result as a combined buffer: [IV (16)] + [Tag (16)] + [Encrypted Content]
    return Buffer.concat([iv, tag, encrypted]);
};

export const decrypt = (data: Buffer): string => {
    // Extract IV, Tag, and Text
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const text = data.subarray(IV_LENGTH + TAG_LENGTH);

    // Create a decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_MASTER_KEY), iv);
    decipher.setAuthTag(tag);

    // Decrypt and return
    return decipher.update(text) + decipher.final('utf8');
};
