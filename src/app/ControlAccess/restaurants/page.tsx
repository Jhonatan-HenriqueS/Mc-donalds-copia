import { redirect } from 'next/navigation';

import { verifyControlAccessSession } from '@/lib/control-access';
import { db } from '@/lib/prisma';

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const toUtcDateOnly = (date: Date) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
};

const ControlAccessRestaurantsPage = async () => {
  const hasAccess = await verifyControlAccessSession();

  if (!hasAccess) {
    redirect('/ControlAccess');
  }

  const restaurants = await db.restaurant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const today = toUtcDateOnly(new Date());

  const restaurantsWithExpiry = restaurants
    .map((restaurant) => {
      const expiresAt = addDays(restaurant.createdAt, 30);
      const warningStartsAt = addDays(expiresAt, -3);
      const expiringSoon =
        today >= toUtcDateOnly(warningStartsAt) &&
        today <= toUtcDateOnly(expiresAt);

      return {
        ...restaurant,
        expiresAt,
        expiringSoon,
      };
    })
    .sort((a, b) => {
      if (a.expiringSoon !== b.expiringSoon) {
        return a.expiringSoon ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Controle de restaurantes</h1>
          <p className="text-sm text-muted-foreground">
            Listagem com slug, nome, criador, data de criação e vencimento (+30
            dias).
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Restaurante</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Criado por</th>
                  <th className="px-4 py-3 font-medium">Data de criação</th>
                  <th className="px-4 py-3 font-medium">Data de vencimento</th>
                </tr>
              </thead>
              <tbody>
                {restaurantsWithExpiry.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      Nenhum restaurante cadastrado.
                    </td>
                  </tr>
                ) : (
                  restaurantsWithExpiry.map((restaurant) => {
                    const rowClassName = restaurant.expiringSoon
                      ? 'text-destructive'
                      : '';
                    const slugClassName = restaurant.expiringSoon
                      ? 'text-destructive'
                      : 'text-muted-foreground';

                    return (
                      <tr
                        key={restaurant.id}
                        className={`border-t border-muted/60 ${rowClassName}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {restaurant.name}
                        </td>
                        <td className={`px-4 py-3 ${slugClassName}`}>
                          {restaurant.slug}
                        </td>
                        <td className="px-4 py-3">
                          {restaurant.user?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(restaurant.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(restaurant.expiresAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlAccessRestaurantsPage;
