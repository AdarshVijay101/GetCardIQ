import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';

dotenv.config();

export interface EncryptionKeyProvider {
  getKey(): Promise<Buffer>;
}

export class LocalDevKeyProvider implements EncryptionKeyProvider {
  async getKey(): Promise<Buffer> {
    const keyBase64 = process.env.ENCRYPTION_KEY_BASE64;
    if (!keyBase64) {
      throw new Error('ENCRYPTION_KEY_BASE64 is missing in .env for LocalDevKeyProvider');
    }
    return Buffer.from(keyBase64, 'base64');
  }
}

export class GcpSecretManagerKeyProvider implements EncryptionKeyProvider {
  private client = new SecretManagerServiceClient();
  private cachedKey: Buffer | null = null;
  private readonly secretName: string;

  constructor(secretName: string) {
    this.secretName = secretName;
  }

  async getKey(): Promise<Buffer> {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    try {
      const [version] = await this.client.accessSecretVersion({
        name: this.secretName,
      });

      const payload = version.payload?.data;
      if (!payload) {
        throw new Error(`Secret payload is empty for ${this.secretName}`);
      }

      // Assuming the secret is stored as a base64 string or raw bytes. 
      // If stored as raw bytes in GCP, result is Uint8Array/Buffer.
      // If stored as base64 string, we decode it. 
      // We will assume Standard Base64 String for consistency with LocalDev.
      const secretString = payload.toString();
      this.cachedKey = Buffer.from(secretString, 'base64');
      
      return this.cachedKey;
    } catch (error) {
      console.error('Failed to fetch secret from GCP:', error);
      throw error;
    }
  }
}

export const getKeyProvider = (): EncryptionKeyProvider => {
  if (process.env.NODE_ENV === 'production') {
    const secretName = process.env.GCP_ENCRYPTION_KEY_SECRET_NAME;
    if (!secretName) {
      throw new Error('GCP_ENCRYPTION_KEY_SECRET_NAME is required in production');
    }
    return new GcpSecretManagerKeyProvider(secretName);
  } else {
    return new LocalDevKeyProvider();
  }
};
