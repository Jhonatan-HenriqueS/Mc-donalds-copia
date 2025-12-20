import { formatCurrency } from "@/helpers/format-currency";
import { CartContext, CartProduct } from "../context/cart";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from "lucide-react";
import { useContext } from "react";

interface CartItemProps {
  product: CartProduct;
}

const CartProductItem = ({ product }: CartItemProps) => {
  const { descreaseProductQuantity } = useContext(CartContext);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="bg-gray-100 rounded-xl p-2.5">
          <div className="relative h-20 w-20">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="space-y-1 ">
          <p className="text-sm font-semibold max-w-[90%] truncate text-ellipsis">
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
            <Button className="w-7 h-7 rounded-lg" variant="destructive">
              <ChevronRightIcon size={14} />
            </Button>
          </div>
        </div>
      </div>
      <Button className="h-7 w-7 rounded-lg" variant="outline">
        <Trash2Icon />
      </Button>
    </div>
  );
};

export default CartProductItem;
