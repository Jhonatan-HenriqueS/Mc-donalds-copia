"use client";

import { OrderStatus, Prisma } from "@prisma/client";
import { Separator } from "@radix-ui/react-separator";
import { ChevronLeftIcon, ScrollTextIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/helpers/format-currency";

interface OrdersPageProps {
  orders: Array<
    Prisma.OrderGetPayload<{
      include: {
        restaurant: {
          select: {
            name: true;
            avatarImageUrl: true;
          };
        };
        orderProducts: {
          include: {
            product: true;
            additionals: true;
            requiredAdditionals: true;
          };
        };
      };
    }>
  >;
}

const getStatusLabel = (status: OrderStatus) => {
  if (status === "OUT_FOR_DELIVERY") return "Enviado para Entrega";
  if (status === "FINISHED") return "Finalizado";
  if (status === "IN_PREPARATION") return "Em preparo";
  if (status === "PENDING") return "Pendente";
  return "";
};

const OrderList = ({ orders }: OrdersPageProps) => {
  const router = useRouter();
  const handleBackClick = () => router.back();

  return (
    <div className="space-y-6 p-6">
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full"
        onClick={handleBackClick}
      >
        <ChevronLeftIcon />
      </Button>
      <div className="flex items-center gap-3 ">
        <ScrollTextIcon />
        <h2 className="text-lg font-semibold ">Meus Pedidos</h2>
      </div>
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-5 space-y-4">
            <div
              className={`w-fit rounded-full px-2 py-1 text-xs text-white font-semibold
                    ${
                      order.status === OrderStatus.FINISHED &&
                      "bg-green-400 text-white"
                    }
                    ${
                      order.status === OrderStatus.IN_PREPARATION &&
                      "bg-blue-400 text-white"
                    }
                    ${
                      order.status === OrderStatus.PENDING &&
                      "bg-yellow-400 text-white"
                    }
                    ${
                      order.status === OrderStatus.OUT_FOR_DELIVERY &&
                      "bg-purple-400 text-white"
                    }
                `}
            >
              {getStatusLabel(order.status)}
            </div>
            <div className="flex items-center gap-2 ">
              <div className="relative h-5 w-5">
                <Image
                  src={order.restaurant.avatarImageUrl}
                  alt={order.restaurant.name}
                  className="rounded-sm"
                  fill
                />
              </div>
              <p className="font-bold text-sm ">{order.restaurant.name}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              {order.orderProducts.map((orderProduct) => (
                <div key={orderProduct.id} className="flex items-center gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-gray-300 text-white text-xs font-semibold">
                    {orderProduct.quantity}
                  </div>
                  <div className="text-sm">
                    <p>{orderProduct.product.name}</p>
                    {orderProduct.sizeName && (
                      <p className="text-xs text-muted-foreground">
                        Tam: {orderProduct.sizeName}
                      </p>
                    )}
                    {orderProduct.additionals &&
                      orderProduct.additionals.length > 0 && (
                        <ul className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
                          {orderProduct.additionals.map((additional) => (
                            <li key={additional.id}>
                              {additional.quantity}x {additional.name} (
                              {formatCurrency(additional.price)})
                            </li>
                          ))}
                        </ul>
                      )}
                    {orderProduct.requiredAdditionals &&
                      orderProduct.requiredAdditionals.length > 0 && (
                        <div className="mt-1">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Obrigatórios
                          </p>
                          <ul className="text-[11px] text-muted-foreground space-y-0.5">
                            {orderProduct.requiredAdditionals.map(
                              (required) => (
                                <li key={required.id}>
                                  {required.quantity}x {required.name} (
                                  {required.groupTitle})
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Produtos</span>
                <span className="text-foreground font-semibold">
                  {formatCurrency(order.productsSubtotal)}
                </span>
              </div>
              {order.sizesSubtotal !== 0 && (
                <div className="flex justify-between">
                  <span>Tamanhos</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(order.sizesSubtotal)}
                  </span>
                </div>
              )}
              {order.additionalsSubtotal > 0 && (
                <div className="flex justify-between">
                  <span>Adicionais</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(order.additionalsSubtotal)}
                  </span>
                </div>
              )}
              {order.consumptionMethod === "TAKEANAY" && (
                <div className="flex justify-between text-red-500">
                  <span>Taxa de entrega</span>
                  <span className="font-semibold">
                    {formatCurrency(order.deliveryFee ?? 0)}
                  </span>
                </div>
              )}
            </div>
            <Separator />
            <p className="text-sm font-semibold">
              {formatCurrency(order.total)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderList;
