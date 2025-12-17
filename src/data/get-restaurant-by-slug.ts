import { db } from "@/lib/prisma";

export const getRestaurantBySlug = async (slug: string) => {
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  //Existe findFirst e unique, first caso eu quiser preocurar um campo sem unique, unique preocura unique

  return restaurant;
};
