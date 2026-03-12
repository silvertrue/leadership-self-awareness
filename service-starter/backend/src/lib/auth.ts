import { createHmac, timingSafeEqual } from 'node:crypto';

export interface AdminSession {
  adminId: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export const ADMIN_SESSION_COOKIE = 'self_awareness_admin_session';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function maxAgeSeconds(): number {
  const hours = Number(process.env.ADMIN_SESSION_MAX_AGE_HOURS || '12');
  return Math.max(1, hours) * 60 * 60;
}

function sign(value: string): string {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET');
  return createHmac('sha256', secret).update(value).digest('hex');
}

function encode(payload: AdminSession): string {
  const base = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${base}.${sign(base)}`;
}

function decode(token: string): AdminSession | null {
  const [base, signature] = token.split('.');
  if (!base || !signature) return null;
  const expected = sign(base);
  const left = Buffer.from(signature, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const payload = JSON.parse(Buffer.from(base, 'base64url').toString('utf8')) as AdminSession;
  if (Date.now() > payload.expiresAt) return null;
  return payload;
}

function parseCookies(header: string | null): Record<string, string> {
  return String(header || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const index = part.indexOf('=');
      if (index > 0) acc[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return acc;
    }, {});
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminSession> {
  const adminEmail = getRequiredEnv('ADMIN_EMAIL');
  const adminPassword = getRequiredEnv('ADMIN_PASSWORD');
  if (email !== adminEmail || password !== adminPassword) {
    throw new Error('Invalid admin credentials.');
  }
  const issuedAt = Date.now();
  return {
    adminId: 'admin',
    email,
    issuedAt,
    expiresAt: issuedAt + maxAgeSeconds() * 1000
  };
}

export function createAdminSessionCookie(session: AdminSession): string {
  return `${ADMIN_SESSION_COOKIE}=${encode(session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds()}; Secure`;
}

export function clearAdminSessionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export async function requireAdminSession(request: Request): Promise<AdminSession> {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies[ADMIN_SESSION_COOKIE];
  const session = token ? decode(token) : null;
  if (!session) throw new Error('Admin authentication required.');
  return session;
}

export function verifyPublicToken(token: string): string {
  if (!token || token.trim().length < 12) throw new Error('Invalid public token.');
  return token;
}
