'use server';

import bcrypt from 'bcryptjs';

import { db } from '@/lib/prisma';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone: string;
}

export const createUser = async (input: CreateUserInput) => {
  try {
    // Verificar se o email já existe
    const existingUser = await db.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const normalizedCpf = input.cpf?.trim() || null;

    // Criar usuário
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        cpf: normalizedCpf,
        phone: input.phone,
      },
    });

    return { success: true, userId: user.id, user };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao criar usuário' };
  }
};
