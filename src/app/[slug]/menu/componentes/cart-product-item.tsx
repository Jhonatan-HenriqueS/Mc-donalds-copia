import { ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useContext } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext, CartProduct } from "../context/cart";

interface CartItemProps {
  product: CartProduct;
}

const CartProductItem = ({ product }: CartItemProps) => {
  const { descreaseProductQuantity, inCreaseProductQuantity, removeProduct } =
    useContext(CartContext);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <div className="relative h-20 w-20 mr-3">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-1 ">
          <p className="text-sm font-semibold max-w-[80%] truncate text-ellipsis">
            {/* Essa combinação faz com que o nome do produto não quebre linha, e se quebrar adiciona ... no final */}
            {product.name}
          </p>
          <p className="text-sm font-semibold">
            {formatCurrency(product.price)}
          </p>
          <div className="flex items-center gap-1 text-center">
            <Button
              className="w-7 h-7 rounded-lg"
              variant="outline"
              onClick={() => descreaseProductQuantity(product.id)}
            >
              <ChevronLeftIcon size={14} />
            </Button>
            <p className="text-xs mx-[10px] ">{product.quantity}</p>
            <Button
              className="w-7 h-7 rounded-lg"
              variant="destructive"
              onClick={() => inCreaseProductQuantity(product.id)}
            >
              <ChevronRightIcon size={14} />
            </Button>
          </div>
        </div>
      </div>
      <Button
        className="h-7 w-7 relative right-3 rounded-lg border-none"
        variant="outline"
        onClick={() => removeProduct(product.id)}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
};

export default CartProductItem;
