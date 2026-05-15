import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { config } from '../config.js';

const ENCRYPTED_PREFIX = 'aes-256-gcm:';

class CookieCryptoService {
  private readonly key = config.cookieEncryptionKey
    ? createHash('sha256').update(config.cookieEncryptionKey).digest()
    : null;

  encrypt(cookie: string): string {
    if (!this.key) {
      return cookie;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(cookie, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(storedCookie: string): string {
    if (!storedCookie.startsWith(ENCRYPTED_PREFIX)) {
      return storedCookie;
    }

    if (!this.key) {
      throw new Error('COOKIE_ENCRYPTION_KEY is required to decrypt stored cookies');
    }

    const payload = storedCookie.slice(ENCRYPTED_PREFIX.length);
    const [ivBase64, tagBase64, encryptedBase64] = payload.split(':');

    if (!ivBase64 || !tagBase64 || !encryptedBase64) {
      throw new Error('Encrypted cookie payload is malformed');
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}

export const cookieCryptoService = new CookieCryptoService();
