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

const CartSheet = () => {
  const { isOpen, taggleCart, products } = useContext(CartContext);

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle></SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        {products.map((product) => (
          <h1 key={product.id}>
            {product.name} - {product.quantity}
          </h1>
        ))}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
