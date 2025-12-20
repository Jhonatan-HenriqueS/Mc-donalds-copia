import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useContext } from "react";
import { CartContext } from "../context/cart";
import CartProductItem from "./cart-product-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/helpers/format-currency";

const CartSheet = () => {
  const { isOpen, taggleCart, products, total } = useContext(CartContext);

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetContent className="min-w-[88%]">
        <SheetHeader>
          <SheetTitle className="text-start">Carrinho</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="py-5 flex flex-col h-full">
          <div className="flex-auto flex flex-col gap-4">
            {/* Flex-auto para ocupar a largura toda, para empurrar o botão para baixo
            feito com html e body no global com @apply h-full
            */}
            {products.map((product) => (
              <CartProductItem key={product.id} product={product} />
            ))}
          </div>
          <Card className="mb-10">
            <CardContent className="p-5">
              <div className="flex justify-between">
                <p className="text-sm ">Total</p>
                <p className="font-semibold text-sm">{formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>
          <Button className="w-full rounded-full">Finalizar pedido</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
