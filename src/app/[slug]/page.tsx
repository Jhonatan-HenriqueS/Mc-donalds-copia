import Image from 'next/image';
import { notFound } from 'next/navigation';

import { db } from '@/lib/prisma';

import ConsumptionMethodOPtion from './Components/consumption-method-option';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

const RestaurantPage = async ({ params }: RestaurantPageProps) => {
  //next tem componentes rederizados no servidor, ou seja, se ele for asyncrono ele tem acesso ao servidor e não posso interagir
  const { slug } = await params;
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return notFound(); //Mostra o erro do next
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 pt-24">
      <div className="flex flex-col items-center gap-2">
        <Image
          src={restaurant?.avatarImageUrl}
          alt={restaurant?.name}
          width={82}
          height={82}
        />
        {/* Obrigatório largura e altura */}
        <h2 className="font-semibold">{restaurant?.name}</h2>
      </div>
      <div className="pt-12 text-center space-y-2">
        <h3 className="text-2x1 font-semibold">Seja Bem-vindo</h3>
        <p className="opacity-55">
          Escolha como prefere aproveitar sua refeição <br />
          Estamos aqui para oferecer praticidade e fechar cada detalhe
        </p>
      </div>
      <div className="pt-14 grid grid-cols-2 gap-4">
        <ConsumptionMethodOPtion
          option="DINE_IN"
          slug={slug}
          buttonText="Para comer aqui"
          imageUrl="/dine_in.png"
          imageAlt="Para comer aqui"
        />
        <ConsumptionMethodOPtion
          option="TAKEANAY"
          slug={slug}
          buttonText="Para levar"
          imageUrl="/takeaway.png"
          imageAlt="Para levar"
        />
      </div>
    </div>
  );
};

export default RestaurantPage;
