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
}

const CartSheet = ({ isRestaurantOpen = true }: CartSheetProps) => {
  const [finishOnderDialogIsOPen, setFinishOnderDialogIsOPen] = useState(false);
  const { isOpen, taggleCart, products, total } = useContext(CartContext);

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetContent className="min-w-[88%]">
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
                <CartProductItem key={product.id} product={product} />
              ))}
            </div>
            <ScrollBar orientation="vertical" className="hidden"></ScrollBar>
          </ScrollArea>

          <Card className="mb-10">
            <CardContent className="p-5">
              <div className="flex justify-between">
                <p className="text-sm ">Total</p>
                <p className="font-semibold text-sm">{formatCurrency(total)}</p>
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
