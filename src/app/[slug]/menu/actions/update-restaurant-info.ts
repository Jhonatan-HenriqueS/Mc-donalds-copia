'use server';

import { revalidatePath } from 'next/cache';

import { verifyRestaurantOwner } from '@/app/actions/session';
import { db } from '@/lib/prisma';

interface UpdateRestaurantInfoInput {
  restaurantId: string;
  contactPhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  addressReference?: string;
}

const normalizeOptional = (value?: string) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const updateRestaurantInfo = async (input: UpdateRestaurantInfoInput) => {
  try {
    const isOwner = await verifyRestaurantOwner(input.restaurantId);
    if (!isOwner) {
      return {
        success: false,
        error: 'Acesso negado. Você não tem permissão para alterar informações.',
      };
    }

    const contactPhone = normalizeOptional(input.contactPhone);
    const addressStreet = normalizeOptional(input.addressStreet);
    const addressNumber = normalizeOptional(input.addressNumber);
    const addressNeighborhood = normalizeOptional(input.addressNeighborhood);
    const addressCity = normalizeOptional(input.addressCity);
    const addressState = normalizeOptional(input.addressState)?.toUpperCase();
    const addressZipCode = normalizeOptional(input.addressZipCode);
    const addressReference = normalizeOptional(input.addressReference);

    const hasAnyFilledField = Boolean(
      contactPhone ||
        addressStreet ||
        addressNumber ||
        addressNeighborhood ||
        addressCity ||
        addressState ||
        addressZipCode ||
        addressReference,
    );

    if (!hasAnyFilledField) {
      return {
        success: false,
        error: 'Preencha ao menos um campo para salvar.',
      };
    }

    if (contactPhone) {
      const digits = contactPhone.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 11) {
        return {
          success: false,
          error: 'Informe um telefone válido com DDD.',
        };
      }
    }

    if (addressZipCode) {
      const zipDigits = addressZipCode.replace(/\D/g, '');
      if (zipDigits.length !== 8) {
        return {
          success: false,
          error: 'Informe um CEP válido no formato 00000-000.',
        };
      }
    }

    const restaurant = await db.restaurant.update({
      where: { id: input.restaurantId },
      data: {
        ...(contactPhone ? { contactPhone } : {}),
        ...(addressStreet ? { addressStreet } : {}),
        ...(addressNumber ? { addressNumber } : {}),
        ...(addressNeighborhood ? { addressNeighborhood } : {}),
        ...(addressCity ? { addressCity } : {}),
        ...(addressState ? { addressState } : {}),
        ...(addressZipCode ? { addressZipCode } : {}),
        ...(addressReference ? { addressReference } : {}),
      },
      select: {
        slug: true,
        allowDineIn: true,
        contactPhone: true,
        addressStreet: true,
        addressNumber: true,
        addressNeighborhood: true,
        addressCity: true,
        addressState: true,
        addressZipCode: true,
        addressReference: true,
      },
    });

    revalidatePath(`/${restaurant.slug}`);
    revalidatePath(`/${restaurant.slug}/menu`);
    revalidatePath(`/${restaurant.slug}/orders`);

    return { success: true, restaurant };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'Erro ao salvar informações do restaurante.',
    };
  }
};
