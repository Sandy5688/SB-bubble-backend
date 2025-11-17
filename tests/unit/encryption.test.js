const { encrypt, decrypt, hash } = require('../../utils/encryption');

describe('Encryption Utility', () => {
  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt text correctly', () => {
      const original = 'sensitive data';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(original);
      expect(decrypted).toBe(original);
    });

    test('should produce different encrypted values for same input', () => {
      const text = 'test data';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });
  });

  describe('hash', () => {
    test('should produce consistent hash', () => {
      const text = 'password123';
      const hash1 = hash(text);
      const hash2 = hash(text);
      
      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different inputs', () => {
      const hash1 = hash('password1');
      const hash2 = hash('password2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
