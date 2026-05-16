import assert from 'node:assert/strict';
import test from 'node:test';

const loadCookieCryptoService = async () => {
  process.env.GEMINI_API_KEY ??= 'test-gemini-key';
  const { CookieCryptoService } = await import('../cookie-crypto.service.js');
  return CookieCryptoService;
};

test('encrypts and decrypts cookies with AES-256-GCM', async () => {
  const CookieCryptoService = await loadCookieCryptoService();
  const service = new CookieCryptoService('test-cookie-key', 'development');
  const cookie = 'MUSIC_U=abc; __csrf=def';
  const encrypted = service.encrypt(cookie);

  assert.notEqual(encrypted, cookie);
  assert.match(encrypted, /^aes-256-gcm:/);
  assert.equal(service.decrypt(encrypted), cookie);
});

test('returns plaintext when no key is configured outside production', async () => {
  const CookieCryptoService = await loadCookieCryptoService();
  const service = new CookieCryptoService(undefined, 'development');
  const cookie = 'MUSIC_U=abc; __csrf=def';

  assert.equal(service.encrypt(cookie), cookie);
  assert.equal(service.decrypt(cookie), cookie);
});

test('throws when decrypting encrypted cookies without a key', async () => {
  const CookieCryptoService = await loadCookieCryptoService();
  const encrypted = new CookieCryptoService('test-cookie-key', 'development').encrypt('MUSIC_U=abc');
  const service = new CookieCryptoService(undefined, 'development');

  assert.throws(() => service.decrypt(encrypted), /COOKIE_ENCRYPTION_KEY is required/);
});

test('throws when encrypted cookie auth tag is damaged', async () => {
  const CookieCryptoService = await loadCookieCryptoService();
  const service = new CookieCryptoService('test-cookie-key', 'development');
  const encrypted = service.encrypt('MUSIC_U=abc');
  const parts = encrypted.split(':');
  parts[2] = `${parts[2].startsWith('A') ? 'B' : 'A'}${parts[2].slice(1)}`;

  assert.throws(() => service.decrypt(parts.join(':')));
});

test('requires COOKIE_ENCRYPTION_KEY in production', async () => {
  const CookieCryptoService = await loadCookieCryptoService();
  assert.throws(
    () => new CookieCryptoService(undefined, 'production'),
    /COOKIE_ENCRYPTION_KEY is required in production/,
  );
});
