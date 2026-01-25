import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const CONTROL_ACCESS_COOKIE_NAME = 'control_access_session';
const CONTROL_ACCESS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas

const getControlAccessSecret = () => {
  const email = process.env.CONTROL_ACCESS_EMAIL;
  const password = process.env.CONTROL_ACCESS_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return `${email}:${password}`;
};

const signValue = (value: string) => {
  const secret = getControlAccessSecret();

  if (!secret) {
    return null;
  }

  return createHmac('sha256', secret).update(value).digest('hex');
};

const safeEqual = (a: string, b: string) => {
  try {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
};

export const createControlAccessSession = async () => {
  const issuedAt = Date.now().toString();
  const signature = signValue(issuedAt);

  if (!signature) {
    return { success: false, error: 'Controle de acesso não configurado' };
  }

  const cookieStore = await cookies();
  cookieStore.set(CONTROL_ACCESS_COOKIE_NAME, `${issuedAt}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CONTROL_ACCESS_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return { success: true };
};

export const verifyControlAccessSession = async () => {
  const signatureSecret = getControlAccessSecret();

  if (!signatureSecret) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CONTROL_ACCESS_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return false;
  }

  const [issuedAt, signature] = cookieValue.split('.');

  if (!issuedAt || !signature) {
    return false;
  }

  const expectedSignature = signValue(issuedAt);

  if (!expectedSignature || !safeEqual(signature, expectedSignature)) {
    return false;
  }

  const issuedAtNumber = Number(issuedAt);

  if (!Number.isFinite(issuedAtNumber)) {
    return false;
  }

  const maxAgeMs = CONTROL_ACCESS_SESSION_MAX_AGE_SECONDS * 1000;

  if (Date.now() - issuedAtNumber > maxAgeMs) {
    return false;
  }

  return true;
};

export const clearControlAccessSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(CONTROL_ACCESS_COOKIE_NAME);
};
