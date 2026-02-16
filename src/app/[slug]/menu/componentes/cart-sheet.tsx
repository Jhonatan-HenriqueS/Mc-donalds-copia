import { useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext } from "../context/cart";
import CartProductItem from "./cart-product-item";
import FinishOrderDialog from "./finish-order-dialog";

interface CartSheetProps {
  isRestaurantOpen?: boolean;
  isTakeaway?: boolean;
  deliveryFee?: number;
  paymentMethods: Array<{ id: string; name: string }>;
  restaurantInfo?: {
    contactPhone?: string | null;
    addressStreet?: string | null;
    addressNumber?: string | null;
    addressNeighborhood?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
    addressZipCode?: string | null;
    addressReference?: string | null;
  };
}

const CartSheet = ({
  isRestaurantOpen = true,
  isTakeaway = false,
  deliveryFee = 0,
  paymentMethods,
  restaurantInfo,
}: CartSheetProps) => {
  const [finishOnderDialogIsOPen, setFinishOnderDialogIsOPen] = useState(false);
  const {
    isOpen,
    taggleCart,
    products,
    total,
    subtotalProducts,
    subtotalSizes,
    subtotalAdditionals,
  } = useContext(CartContext);
  const subtotal = total;
  const fee = isTakeaway ? deliveryFee : 0;
  const totalWithFee = subtotal + fee;

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetContent className="min-w-[94%]">
        <SheetHeader>
          <SheetTitle className="text-start">Carrinho</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>

        <div className="py-5 flex flex-col h-full">
          <ScrollArea className="h-full overflow-y-auto pb-6">
            <div className="flex-auto flex flex-col gap-4">
              {/* Flex-auto para ocupar a largura toda, para empurrar o botão para baixo
            feito com html e body no global com @apply h-full
            */}

              {products.map((product) => (
                <CartProductItem
                  key={`${product.id}-${product.sizeId || "default"}-${product.additionalsKey || "plain"}-${product.requiredAdditionalsKey || "required"}`}
                  product={product}
                />
              ))}
            </div>
            <ScrollBar orientation="vertical" className="hidden"></ScrollBar>
          </ScrollArea>

          <Card className="mb-10">
            <CardContent className="p-5">
              <div className="flex justify-between">
                <p className="text-sm ">Produtos</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(subtotalProducts)}
                </p>
              </div>
              {subtotalSizes !== 0 && (
                <div className="flex justify-between">
                  <p className="text-sm ">Tamanhos</p>
                  <p className="font-semibold text-sm">
                    {formatCurrency(subtotalSizes)}
                  </p>
                </div>
              )}
              {subtotalAdditionals > 0 && (
                <div className="flex justify-between">
                  <p className="text-sm ">Adicionais</p>
                  <p className="font-semibold text-sm">
                    {formatCurrency(subtotalAdditionals)}
                  </p>
                </div>
              )}
              {isTakeaway && (
                <div className="flex justify-between">
                  <p className="text-sm text-red-500">Taxa de entrega</p>
                  <p className="font-semibold text-sm text-red-500">
                    {formatCurrency(fee)}
                  </p>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t mt-2">
                <p className="text-sm ">Total</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(totalWithFee)}
                </p>
              </div>
            </CardContent>
          </Card>
          {isRestaurantOpen ? (
            <>
              <Button
                className="w-full rounded-full"
                onClick={() => setFinishOnderDialogIsOPen(true)}
              >
                Finalizar pedido
              </Button>
              <FinishOrderDialog
                open={finishOnderDialogIsOPen}
                onOpenChange={setFinishOnderDialogIsOPen}
                paymentMethods={paymentMethods}
                restaurantInfo={restaurantInfo}
              />
            </>
          ) : (
            <p className="w-full rounded-full text-center text-sm font-semibold text-red-500">
              Restaurante fechado no momento
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
