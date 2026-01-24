"use client";

import { Prisma } from "@prisma/client";
import {
  ChefHatIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

import CartSheet from "../../componentes/cart-sheet";
import {
  CartAdditionalSelection,
  CartContext,
  CartRequiredAdditionalSelection,
} from "../../context/cart";

interface ProductDetailsProps {
  product: Prisma.ProductGetPayload<{
    //Vai no banco, nesta variável product inclui nela restaurant do banco,
    //Seleciona dela o name e o avatarImageUrl
    include: {
      restaurant: {
        select: {
          name: true;
          avatarImageUrl: true;
          isOpen: true;
          deliveryFee: true;
        };
      };
      sizes: true;
      menuCategory: {
        select: {
          id: true;
          name: true;
          additionals: true;
          requiredAdditionalGroups: {
            include: {
              items: true;
            };
          };
        };
      };
    };
  }>;
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const { taggleCart, addProducts } = useContext(CartContext);
  const searchParams = useSearchParams();
  const isTakeaway = useMemo(
    () =>
      (searchParams.get("consumptionMethod") || "").toUpperCase() ===
      "TAKEANAY",
    [searchParams],
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const selectedSize = product.sizes?.find(
    (size) => size.id === selectedSizeId,
  );
  const [selectedAdditionals, setSelectedAdditionals] = useState<
    Record<string, CartAdditionalSelection>
  >({});
  const [selectedRequiredAdditionals, setSelectedRequiredAdditionals] =
    useState<Record<string, CartRequiredAdditionalSelection>>({});
  const [expandedRequiredGroups, setExpandedRequiredGroups] = useState<
    Record<string, boolean>
  >({});

  const hasSizes = (product.sizes?.length || 0) > 0;
  const availableAdditionals = product.menuCategory?.additionals || [];
  const hasAdditionals = availableAdditionals.length > 0;
  const requiredGroups = useMemo(
    () => product.menuCategory?.requiredAdditionalGroups || [],
    [product.menuCategory?.requiredAdditionalGroups],
  );
  const hasRequiredGroups = requiredGroups.length > 0;

  const selectedAdditionalsList = useMemo(
    () =>
      Object.values(selectedAdditionals).filter(
        (item) => (item?.quantity || 0) > 0,
      ),
    [selectedAdditionals],
  );

  const selectedRequiredList = useMemo(
    () =>
      Object.values(selectedRequiredAdditionals).filter(
        (item) => (item?.quantity || 0) > 0,
      ),
    [selectedRequiredAdditionals],
  );

  const requiredCounts = useMemo(
    () =>
      selectedRequiredList.reduce(
        (acc, item) => {
          acc[item.groupId] = (acc[item.groupId] || 0) + item.quantity;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [selectedRequiredList],
  );

  const requiredComplete = useMemo(
    () =>
      requiredGroups.every(
        (group) => (requiredCounts[group.id] || 0) >= group.requiredQuantity,
      ),
    [requiredCounts, requiredGroups],
  );

  const additionalsUnitTotal = useMemo(
    () =>
      selectedAdditionalsList.reduce(
        (acc, current) => acc + current.price * current.quantity,
        0,
      ),
    [selectedAdditionalsList],
  );

  const basePrice = product.price;
  const unitSizePrice = selectedSize?.price ?? null;
  const unitBaseTotal = unitSizePrice ?? basePrice;
  const unitTotal = unitBaseTotal + additionalsUnitTotal;
  const totalWithQuantity = unitTotal * quantity;
  const missingSize = hasSizes && !selectedSize;
  const missingRequired = hasRequiredGroups && !requiredComplete;
  const canAddToCart = !missingSize && !missingRequired;
  const addToCartMessage = missingSize
    ? missingRequired
      ? "Selecione um tamanho e complete os obrigatórios."
      : "Selecione um tamanho para continuar."
    : missingRequired
      ? "Complete os adicionais obrigatórios para continuar."
      : "";

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => {
      if (prev === 1) {
        return 1;
      } else {
        return prev - 1;
      }
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAdditionalChange = (additionalId: string, delta: number) => {
    const option = availableAdditionals.find(
      (item) => item.id === additionalId,
    );
    if (!option) return;

    setSelectedAdditionals((prev) => {
      const current = prev[additionalId] ?? { ...option, quantity: 0 };
      const nextQuantity = Math.max(0, (current.quantity || 0) + delta);

      if (nextQuantity === 0) {
        const rest = { ...prev };
        delete rest[additionalId];
        return rest;
      }

      return {
        ...prev,
        [additionalId]: {
          ...option,
          quantity: nextQuantity,
        },
      };
    });
  };

  const handleRequiredChange = (
    groupId: string,
    groupTitle: string,
    itemId: string,
    itemName: string,
    imageUrl: string | undefined,
    delta: number,
    requiredQuantity: number,
  ) => {
    setSelectedRequiredAdditionals((prev) => {
      const groupSelected = Object.values(prev).reduce((acc, item) => {
        if (item.groupId === groupId) {
          return acc + (item.quantity || 0);
        }
        return acc;
      }, 0);
      if (delta > 0 && groupSelected >= requiredQuantity) {
        return prev;
      }

      const current = prev[itemId] ?? {
        id: itemId,
        name: itemName,
        imageUrl,
        groupId,
        groupTitle,
        quantity: 0,
      };
      const nextQuantity = Math.max(0, (current.quantity || 0) + delta);
      if (nextQuantity === 0) {
        const rest = { ...prev };
        delete rest[itemId];
        return rest;
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: nextQuantity,
        },
      };
    });
  };

  const toggleRequiredGroup = (groupId: string) => {
    setExpandedRequiredGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleAddToCart = () => {
    if (!canAddToCart) {
      return;
    }
    addProducts({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: selectedSize ? selectedSize.price : product.price,
      basePrice: product.price,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      sizePrice: selectedSize?.price,
      sizes: product.sizes?.map((size) => ({
        id: size.id,
        name: size.name,
        price: size.price,
      })),
      additionals: selectedAdditionalsList,
      availableAdditionals: availableAdditionals,
      requiredAdditionals: selectedRequiredList,
      availableRequiredAdditionals: requiredGroups.map((group) => ({
        id: group.id,
        title: group.title,
        requiredQuantity: group.requiredQuantity,
        items: group.items.map((item) => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
      })),
      quantity,
    });
    taggleCart();
  };

  return (
    <>
      <div className="relative z-50 rounded-t-3xl p-5 mt-[-2rem] flex flex-1 min-h-0 flex-col bg-white ">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <Image
              src={product.restaurant.avatarImageUrl}
              alt={product.restaurant.name}
              width={20}
              height={20}
              className="rounded-full"
            />

            <p className="text-sm text-muted-foreground">
              {product.restaurant.name}
            </p>
          </div>

          <h2 className="mt-3 text-xl font-semibold">{product.name}</h2>

          <div className="flex items-center justify-between mb-3 mt-2">
            <div>
              <h3 className="text-xl font-semibold">
                {formatCurrency(unitTotal)}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-center">
              <Button
                variant="outline"
                className="h-8 w-8 rounded-xl"
                onClick={handleDecreaseQuantity}
              >
                <ChevronLeftIcon />
              </Button>

              <p className="w-4">{quantity}</p>

              <Button
                variant="destructive"
                className="h-8 w-8 rounded-xl"
                onClick={handleIncreaseQuantity}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="text-right text-xs text-muted-foreground">
              {selectedSize?.name && (
                <p className="flex justify-start">
                  Tamanho: {selectedSize.name}
                </p>
              )}
              {hasRequiredGroups && (
                <p>
                  {
                    requiredGroups.filter(
                      (group) =>
                        (requiredCounts[group.id] || 0) >=
                        group.requiredQuantity,
                    ).length
                  }
                  /{requiredGroups.length} obrigatórios completos
                </p>
              )}
              {hasAdditionals && (
                <p className="flex justify-start">
                  {selectedAdditionalsList.reduce(
                    (acc, item) => acc + item.quantity,
                    0,
                  )}{" "}
                  adicionais
                </p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {hasSizes && (
              <div className="space-y-2">
                <h4 className="font-semibold">Tamanhos</h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map((size) => (
                    <Button
                      key={size.id}
                      type="button"
                      variant={
                        selectedSizeId === size.id ? "default" : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedSizeId(size.id)}
                    >
                      {size.name} - {formatCurrency(size.price)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {hasRequiredGroups && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Obrigatórios</h4>
                  <p className="text-xs text-muted-foreground">
                    {
                      requiredGroups.filter(
                        (group) =>
                          (requiredCounts[group.id] || 0) >=
                          group.requiredQuantity,
                      ).length
                    }
                    /{requiredGroups.length} completos
                  </p>
                </div>
                <div className="space-y-3">
                  {requiredGroups.map((group) => {
                    const selectedCount = requiredCounts[group.id] || 0;
                    const isMissing = selectedCount < group.requiredQuantity;
                    const isComplete = selectedCount >= group.requiredQuantity;
                    const isExpanded =
                      expandedRequiredGroups[group.id] || false;
                    return (
                      <div key={group.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{group.title}</span>
                          <span
                            className={
                              isMissing
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            {selectedCount}/{group.requiredQuantity}{" "}
                            obrigatório(s)
                          </span>
                        </div>
                        {isComplete && !isExpanded ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => toggleRequiredGroup(group.id)}
                          >
                            <ChevronUpIcon size={14} /> Editar opcionais
                          </Button>
                        ) : (
                          <>
                            <div className="space-y-2">
                              {group.items.map((item) => {
                                const quantity =
                                  selectedRequiredAdditionals[item.id]
                                    ?.quantity || 0;
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-xl border p-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="relative h-12 w-12 rounded-lg bg-muted">
                                        <Image
                                          src={item.imageUrl}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <p className="text-sm font-medium">
                                        {item.name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg"
                                        onClick={() =>
                                          handleRequiredChange(
                                            group.id,
                                            group.title,
                                            item.id,
                                            item.name,
                                            item.imageUrl,
                                            -1,
                                            group.requiredQuantity,
                                          )
                                        }
                                        disabled={quantity === 0}
                                      >
                                        <ChevronLeftIcon size={14} />
                                      </Button>
                                      <span className="w-4 text-center text-xs">
                                        {quantity}
                                      </span>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg"
                                        onClick={() =>
                                          handleRequiredChange(
                                            group.id,
                                            group.title,
                                            item.id,
                                            item.name,
                                            item.imageUrl,
                                            1,
                                            group.requiredQuantity,
                                          )
                                        }
                                        disabled={
                                          selectedCount >=
                                          group.requiredQuantity
                                        }
                                      >
                                        <ChevronRightIcon size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {isComplete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => toggleRequiredGroup(group.id)}
                              >
                                <ChevronDownIcon size={14} /> Ocultar opcionais
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasAdditionals && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Adicionais</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedAdditionalsList.length > 0
                      ? `${selectedAdditionalsList.reduce(
                          (acc, item) => acc + item.quantity,
                          0,
                        )} selecionado(s)`
                      : "Opcional"}
                  </p>
                </div>
                <div className="space-y-2">
                  {availableAdditionals.map((additional) => {
                    const quantity =
                      selectedAdditionals[additional.id]?.quantity || 0;
                    return (
                      <div
                        key={additional.id}
                        className="flex items-center justify-between rounded-xl border p-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={additional.imageUrl}
                              alt={additional.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {additional.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(additional.price)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() =>
                              handleAdditionalChange(additional.id, -1)
                            }
                            disabled={quantity === 0}
                          >
                            <ChevronLeftIcon size={14} />
                          </Button>
                          <span className="w-4 text-center text-xs">
                            {quantity}
                          </span>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() =>
                              handleAdditionalChange(additional.id, 1)
                            }
                          >
                            <ChevronRightIcon size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4 mb-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Sobre</h4>
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="flex items-center gap-1.5 ">
              <ChefHatIcon size={18} />
              <h4 className="font-semibold">Ingredientes</h4>
            </div>
            <ul className="list-disc px-7 flex flex-col gap-0.5 text-sm text-muted-foreground">
              {product.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white p-2 ">
            {!canAddToCart && addToCartMessage && (
              <p className="mb-2 text-center text-xs text-destructive">
                {addToCartMessage}
              </p>
            )}
            <Button
              className="rounded-full w-full z-50 "
              onClick={handleAddToCart}
              disabled={!canAddToCart}
            >
              Adicionar
              {quantity > 1 && <p>({formatCurrency(totalWithQuantity)})</p>}
            </Button>
            <CartSheet
              isRestaurantOpen={product.restaurant.isOpen ?? true}
              isTakeaway={isTakeaway}
              deliveryFee={product.restaurant.deliveryFee ?? 0}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
