import { EncryptionService } from './EncryptionService';

// Mock the environment for LocalDevKeyProvider
// Use a valid base64 key (32 bytes = 44 chars)
process.env.ENCRYPTION_KEY_BASE64 = 'u8x/4sJ+1p250238592035823095823095823098520='; // Mock key

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeAll(() => {
        service = new EncryptionService();
    });

    it('should encrypt and decrypt a string correctly', async () => {
        const originalText = 'plaid-access-token-12345';
        const encrypted = await service.encrypt(originalText);

        expect(encrypted.ciphertext).toBeDefined();
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.tag).toBeDefined();
        expect(encrypted.version).toBe('v1');

        const decrypted = await service.decrypt(encrypted);
        expect(decrypted).toBe(originalText);
    });

    it('should generate different ciphertexts for the same input (random IV)', async () => {
        const text = 'secret-data';
        const first = await service.encrypt(text);
        const second = await service.encrypt(text);

        expect(first.ciphertext).not.toBe(second.ciphertext);
        expect(first.iv).not.toBe(second.iv);
    });
});
