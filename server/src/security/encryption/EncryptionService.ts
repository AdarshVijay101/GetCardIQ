import crypto from 'crypto';
import { getKeyProvider, EncryptionKeyProvider } from './EncryptionKeyProvider';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface EncryptedData {
    ciphertext: string; // Base64
    iv: string; // Base64
    tag: string; // Base64
    version: string; // 'v1'
}

export class EncryptionService {
    private keyProvider: EncryptionKeyProvider;

    constructor() {
        this.keyProvider = getKeyProvider();
    }

    async encrypt(text: string): Promise<EncryptedData> {
        const key = await this.keyProvider.getKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const tag = cipher.getAuthTag();

        return {
            ciphertext: encrypted,
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            version: 'v1'
        };
    }

    async decrypt(data: EncryptedData): Promise<string> {
        const key = await this.keyProvider.getKey();
        const iv = Buffer.from(data.iv, 'base64');
        const tag = Buffer.from(data.tag, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(data.ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
