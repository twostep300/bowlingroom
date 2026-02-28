import crypto from 'node:crypto';

const rateStore = new Map<string, { count: number; resetAt: number }>();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

export function createToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfTokenFromSecret(input: string): string {
  const secret = process.env.CSRF_SECRET || 'dev-only-secret';
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

export function createRandomToken(size = 24): string {
  return crypto.randomBytes(size).toString('hex');
}

export function isRateLimitedWithConfig(key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

export function isRateLimited(key: string): boolean {
  const windowMs = Number(process.env.FORM_RATE_LIMIT_WINDOW_MS || 60000);
  const max = Number(process.env.FORM_RATE_LIMIT_MAX || 20);
  return isRateLimitedWithConfig(key, windowMs, max);
}
