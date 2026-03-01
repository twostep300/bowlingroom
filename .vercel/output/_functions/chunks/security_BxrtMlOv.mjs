import crypto from 'node:crypto';

const rateStore = /* @__PURE__ */ new Map();
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}
function createToken() {
  return crypto.randomBytes(32).toString("hex");
}
function createRandomToken(size = 24) {
  return crypto.randomBytes(size).toString("hex");
}
function isRateLimitedWithConfig(key, windowMs, max) {
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
function isRateLimited(key) {
  const windowMs = Number(process.env.FORM_RATE_LIMIT_WINDOW_MS || 6e4);
  const max = Number(process.env.FORM_RATE_LIMIT_MAX || 20);
  return isRateLimitedWithConfig(key, windowMs, max);
}

export { createRandomToken as a, isRateLimited as b, createToken as c, isRateLimitedWithConfig as i, verifyPassword as v };
