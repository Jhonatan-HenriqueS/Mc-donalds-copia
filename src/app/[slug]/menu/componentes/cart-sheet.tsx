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

const CartSheet = () => {
  const { isOpen, taggleCart, products } = useContext(CartContext);

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetContent className="min-w-[88%]">
        <SheetHeader>
          <SheetTitle className="text-start">Carrinho</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="py-5">
          {products.map((product) => (
            <CartProductItem key={product.id} product={product} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
