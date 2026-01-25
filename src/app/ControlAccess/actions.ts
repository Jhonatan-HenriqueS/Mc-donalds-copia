'use server';

import { createControlAccessSession } from '@/lib/control-access';

interface ControlAccessInput {
  email: string;
  password: string;
}

export const controlAccessLogin = async (input: ControlAccessInput) => {
  const envEmail = process.env.CONTROL_ACCESS_EMAIL;
  const envPassword = process.env.CONTROL_ACCESS_PASSWORD;

  if (!envEmail || !envPassword) {
    return { success: false, error: 'Controle de acesso não configurado' };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedEnvEmail = envEmail.trim().toLowerCase();

  if (normalizedEmail !== normalizedEnvEmail || input.password !== envPassword) {
    return { success: false, error: 'Email ou senha inválidos' };
  }

  const sessionResult = await createControlAccessSession();

  if (!sessionResult.success) {
    return {
      success: false,
      error: sessionResult.error || 'Erro ao criar sessão',
    };
  }

  return { success: true };
};
