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
  const { isOpen, taggleCart } = useContext(CartContext);

  return (
    <Sheet open={isOpen} onOpenChange={taggleCart}>
      <SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Oi</SheetTitle>
            <SheetDescription>DD</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </SheetTrigger>
    </Sheet>
  );
};

export default CartSheet;
