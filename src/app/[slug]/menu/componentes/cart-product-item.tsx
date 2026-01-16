import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext, CartProduct } from "../context/cart";

interface CartItemProps {
  product: CartProduct;
}

const CartProductItem = ({ product }: CartItemProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const {
    descreaseProductQuantity,
    inCreaseProductQuantity,
    removeProduct,
    updateProductSize,
    updateProductAdditionals,
  } = useContext(CartContext);

  const availableAdditionals = product.availableAdditionals || [];
  const selectedAdditionals = useMemo(
    //EDITADO
    () => product.additionals || [],
    [product.additionals]
  );
  const additionalsToDisplay =
    availableAdditionals.length > 0
      ? availableAdditionals
      : selectedAdditionals;

  const selectedAdditionalsCount = useMemo(
    () =>
      selectedAdditionals.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [selectedAdditionals]
  );

  const additionalsUnitTotal = useMemo(
    () =>
      selectedAdditionals.reduce(
        (acc, item) => acc + item.price * (item.quantity || 0),
        0
      ),
    [selectedAdditionals]
  );

  const unitTotal = product.price + additionalsUnitTotal;
  const itemTotal = unitTotal * product.quantity;
  const canEditDetails =
    (product.sizes && product.sizes.length > 0) ||
    additionalsToDisplay.length > 0;

  const handleAdditionalChange = (additionalId: string, delta: number) => {
    const option =
      availableAdditionals.find((item) => item.id === additionalId) ||
      selectedAdditionals.find((item) => item.id === additionalId);
    if (!option) return;

    const currentQuantity =
      selectedAdditionals.find((item) => item.id === additionalId)?.quantity ||
      0;
    const nextQuantity = Math.max(0, currentQuantity + delta);

    const nextAdditionals = selectedAdditionals
      .filter((item) => item.id !== additionalId)
      .map((item) => ({ ...item }));

    if (nextQuantity > 0) {
      nextAdditionals.push({ ...option, quantity: nextQuantity });
    }

    updateProductAdditionals(
      product.id,
      product.sizeId || null,
      nextAdditionals,
      product.additionalsKey || null
    );
  };

  const handleSizeChange = (sizeId: string) => {
    const newSize = product.sizes?.find((s) => s.id === sizeId);
    updateProductSize(
      product.id,
      product.sizeId || null,
      newSize || null,
      product.additionalsKey || null
    );
  };

  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="relative h-20 w-20 mr-1">
              <Image
                src={product.imageUrl ?? "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1 ">
            <p className="text-sm font-semibold max-w-[60%] truncate text-ellipsis">
              {/* Essa combinação faz com que o nome do produto não quebre linha, e se quebrar adiciona ... no final */}
              {product.name}
            </p>
            <p className="text-sm font-semibold">{formatCurrency(itemTotal)}</p>
            <div className="flex items-center gap-1 text-center">
              <Button
                className="w-7 h-7 rounded-lg"
                variant="outline"
                onClick={() =>
                  descreaseProductQuantity(
                    product.id,
                    product.sizeId || null,
                    product.additionalsKey || null
                  )
                }
              >
                <ChevronLeftIcon size={14} />
              </Button>
              <p className="text-xs mx-[10px] ">{product.quantity}</p>
              <Button
                className="w-7 h-7 rounded-lg"
                variant="destructive"
                onClick={() =>
                  inCreaseProductQuantity(
                    product.id,
                    product.sizeId || null,
                    product.additionalsKey || null
                  )
                }
              >
                <ChevronRightIcon size={14} />
              </Button>
            </div>
            {product.sizeName && (
              <p className="text-xs text-muted-foreground">
                Tam: {product.sizeName}
              </p>
            )}
            {selectedAdditionalsCount > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                Adicionais:{" "}
                {selectedAdditionals
                  .map((additional) => `${additional.quantity}`)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="h-7 w-7 absolute right-0 rounded-lg border-none"
            variant="outline"
            onClick={() =>
              removeProduct(
                product.id,
                product.sizeId || null,
                product.additionalsKey || null
              )
            }
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {canEditDetails && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? (
              <ChevronUpIcon size={14} />
            ) : (
              <ChevronDownIcon size={14} />
            )}{" "}
            Detalhes
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="space-y-3 rounded-lg border p-3">
          {product.sizes && product.sizes.length > 0 && (
            <select
              className="text-xs border rounded-md px-2 py-1 w-full"
              value={product.sizeId || ""}
              onChange={(e) => handleSizeChange(e.target.value)}
            >
              <option value="">Selecionar tamanho</option>
              {product.sizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name} - {formatCurrency(size.price)}
                </option>
              ))}
            </select>
          )}

          {additionalsToDisplay.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">Adicionais</p>
              <div className="space-y-2">
                {additionalsToDisplay.map((additional) => {
                  const quantity =
                    selectedAdditionals.find(
                      (item) => item.id === additional.id
                    )?.quantity || 0;
                  return (
                    <div
                      key={additional.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={additional.imageUrl ?? "/placeholder.png"}
                            alt={additional.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium">
                            {additional.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatCurrency(additional.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="w-6 h-6 rounded-md"
                          variant="outline"
                          onClick={() =>
                            handleAdditionalChange(additional.id!, -1)
                          }
                          disabled={quantity === 0}
                        >
                          <ChevronLeftIcon size={12} />
                        </Button>
                        <p className="text-xs w-4 text-center">{quantity}</p>
                        <Button
                          className="w-6 h-6 rounded-md"
                          variant="destructive"
                          onClick={() =>
                            handleAdditionalChange(additional.id!, 1)
                          }
                        >
                          <ChevronRightIcon size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartProductItem;
