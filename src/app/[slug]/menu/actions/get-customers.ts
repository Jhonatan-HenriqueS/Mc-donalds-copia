'use server';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

export const getCustomers = async (restaurantId: string) => {
  try {
    // Verificar se o usuário está autenticado e é dono do restaurante
    const isOwner = await verifyRestaurantOwner(restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error:
          'Acesso negado. Você não tem permissão para visualizar clientes.',
        customers: [],
      };
    }

    // Buscar todos os pedidos do restaurante
    const orders = await db.order.findMany({
      where: {
        restaurantId,
      },
      select: {
        customerCpf: true,
        customerName: true,
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular data do início do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Agrupar por CPF e calcular totais
    const customersMap = new Map<
      string,
      {
        name: string;
        cpf: string;
        lastOrderDate: Date;
        totalSpent: number;
        totalSpentThisMonth: number;
      }
    >();

    let totalMonthRevenue = 0;

    orders.forEach((order) => {
      const cpf = order.customerCpf;
      const orderDate = new Date(order.createdAt);
      const isThisMonth = orderDate >= startOfMonth;

      // Adicionar ao total do mês se for do mês atual
      if (isThisMonth) {
        totalMonthRevenue += order.total;
      }

      if (!customersMap.has(cpf)) {
        customersMap.set(cpf, {
          name: order.customerName,
          cpf: cpf,
          lastOrderDate: order.createdAt,
          totalSpent: order.total,
          totalSpentThisMonth: isThisMonth ? order.total : 0,
        });
      } else {
        const existing = customersMap.get(cpf)!;
        // Atualizar nome e data se for mais recente
        if (order.createdAt > existing.lastOrderDate) {
          existing.name = order.customerName;
          existing.lastOrderDate = order.createdAt;
        }
        // Somar totais
        existing.totalSpent += order.total;
        if (isThisMonth) {
          existing.totalSpentThisMonth += order.total;
        }
      }
    });

    // Converter Map para array e ordenar por data do último pedido
    const customers = Array.from(customersMap.values()).sort(
      (a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime()
    );

    return {
      success: true,
      customers,
      totalMonthRevenue,
    };
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, customers: [] };
    }
    return { success: false, error: 'Erro ao buscar clientes', customers: [] };
  }
};
