'use client';

import { Product } from '@prisma/client';
import { createContext, ReactNode, useState } from 'react';

export interface CartAdditionalOption {
  id?: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export type CartAdditionalSelection = CartAdditionalOption & {
  quantity: number;
};

export interface CartRequiredAdditionalItem {
  id?: string;
  name: string;
  imageUrl?: string;
  groupId: string;
  groupTitle: string;
}

export type CartRequiredAdditionalSelection = CartRequiredAdditionalItem & {
  quantity: number;
};

export interface CartRequiredAdditionalGroup {
  id: string;
  title: string;
  requiredQuantity: number;
  items: Array<{
    id?: string;
    name: string;
    imageUrl?: string;
  }>;
}

export interface CartProduct
  extends Pick<Product, 'id' | 'name' | 'imageUrl'> {
  quantity: number;
  price: number; // preço atual considerando tamanho (sem adicionais)
  basePrice: number;
  sizeId?: string | null;
  sizeName?: string | null;
  sizePrice?: number | null;
  sizes?: Array<{
    id?: string;
    name: string;
    price: number;
  }>;
  additionals?: CartAdditionalSelection[];
  availableAdditionals?: CartAdditionalOption[];
  additionalsKey?: string;
  requiredAdditionals?: CartRequiredAdditionalSelection[];
  availableRequiredAdditionals?: CartRequiredAdditionalGroup[];
  requiredAdditionalsKey?: string;
}

export interface IcartContext {
  isOpen: boolean;
  products: CartProduct[];
  subtotalProducts: number;
  subtotalSizes: number;
  subtotalAdditionals: number;
  total: number;
  totalQuantity: number;
  taggleCart: () => void;
  addProducts: (product: CartProduct) => void;
  descreaseProductQuantity: (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  inCreaseProductQuantity: (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  removeProduct: (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  updateProductSize: (
    productId: string,
    currentSizeId: string | null | undefined,
    newSize: { id?: string; name: string; price: number } | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  updateProductAdditionals: (
    productId: string,
    sizeId: string | null | undefined,
    additionals: CartAdditionalSelection[],
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  updateProductRequiredAdditionals: (
    productId: string,
    sizeId: string | null | undefined,
    requiredAdditionals: CartRequiredAdditionalSelection[],
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => void;
  clearCart: (closeCart?: boolean) => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  subtotalProducts: 0,
  subtotalSizes: 0,
  subtotalAdditionals: 0,
  total: 0,
  totalQuantity: 0,
  taggleCart: () => {},
  addProducts: () => {},
  descreaseProductQuantity: () => {},
  inCreaseProductQuantity: () => {},
  removeProduct: () => {},
  updateProductSize: () => {},
  updateProductAdditionals: () => {},
  updateProductRequiredAdditionals: () => {},
  clearCart: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isOpen, setIsOPen] = useState<boolean>(false);

  const normalizeAdditionals = (additionals?: CartAdditionalSelection[]) =>
    (additionals || [])
      .filter((item) => (item.quantity ?? 0) > 0)
      .map((item) => ({
        ...item,
        quantity: Math.max(0, item.quantity ?? 0),
      }));

  const normalizeRequiredAdditionals = (
    additionals?: CartRequiredAdditionalSelection[]
  ) =>
    (additionals || [])
      .filter((item) => (item.quantity ?? 0) > 0)
      .map((item) => ({
        ...item,
        quantity: Math.max(0, item.quantity ?? 0),
      }));

  const getAdditionalsKey = (additionals?: CartAdditionalSelection[]) => {
    const normalized = normalizeAdditionals(additionals).sort((a, b) => {
      const aKey = (a.id || a.name).toLowerCase();
      const bKey = (b.id || b.name).toLowerCase();

      if (aKey === bKey) {
        if (a.price === b.price) {
          return a.quantity - b.quantity;
        }
        return a.price - b.price;
      }

      return aKey.localeCompare(bKey);
    });

    return JSON.stringify(
      normalized.map((item) => ({
        key: item.id || item.name,
        quantity: item.quantity,
        price: item.price,
      }))
    );
  };

  const getRequiredAdditionalsKey = (
    additionals?: CartRequiredAdditionalSelection[]
  ) => {
    const normalized = normalizeRequiredAdditionals(additionals).sort((a, b) => {
      const aKey = (a.id || a.name).toLowerCase();
      const bKey = (b.id || b.name).toLowerCase();
      if (a.groupId === b.groupId) {
        if (aKey === bKey) {
          return a.quantity - b.quantity;
        }
        return aKey.localeCompare(bKey);
      }
      return a.groupId.localeCompare(b.groupId);
    });

    return JSON.stringify(
      normalized.map((item) => ({
        key: item.id || item.name,
        groupId: item.groupId,
        quantity: item.quantity,
      }))
    );
  };

  const getAdditionalsUnitTotal = (
    additionals?: CartAdditionalSelection[]
  ) => {
    return normalizeAdditionals(additionals).reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  };

  const matchesAdditionalsKey = (
    targetKey: string | null | undefined,
    productKey?: string | null
  ) => {
    return (targetKey ?? "") === (productKey ?? "");
  };

  const matchesRequiredAdditionalsKey = (
    targetKey: string | null | undefined,
    productKey?: string | null
  ) => {
    return (targetKey ?? "") === (productKey ?? "");
  };

  const sanitizeProduct = (product: CartProduct): CartProduct => {
    const basePrice = product.basePrice ?? product.price;
    const normalizedAdditionals = normalizeAdditionals(product.additionals);
    const normalizedRequiredAdditionals = normalizeRequiredAdditionals(
      product.requiredAdditionals
    );
    return {
      ...product,
      basePrice,
      price: product.price ?? basePrice,
      sizePrice:
        product.sizePrice ??
        (product.sizeId ? product.price : null) ??
        null,
      additionals: normalizedAdditionals,
      additionalsKey: getAdditionalsKey(normalizedAdditionals),
      requiredAdditionals: normalizedRequiredAdditionals,
      requiredAdditionalsKey: getRequiredAdditionalsKey(
        normalizedRequiredAdditionals
      ),
    };
  };

  const subtotalProducts = products.reduce(
    (acc, product) =>
      acc + (product.basePrice ?? product.price) * product.quantity,
    0
  );

  const subtotalSizes = products.reduce((acc, product) => {
    const base = product.basePrice ?? product.price;
    const sizeReference =
      product.sizePrice ?? (product.sizeId ? product.price : base);
    const sizeExtra = sizeReference - base;
    return acc + sizeExtra * product.quantity;
  }, 0);

  const subtotalAdditionals = products.reduce((acc, product) => {
    const unitAdditionals = getAdditionalsUnitTotal(product.additionals);
    return acc + unitAdditionals * product.quantity;
  }, 0);

  const total = subtotalProducts + subtotalSizes + subtotalAdditionals;

  const totalQuantity = products.reduce((acc, product) => {
    return acc + product.quantity;
  }, 0);

  const taggleCart = () => {
    setIsOPen((prev) => !prev);
  };

  const addProducts = (product: CartProduct) => {
    const normalizedProduct = sanitizeProduct(product);
    const productsIsAreadyOnTheCart = products.some(
      (prevProducts) =>
        prevProducts.id === normalizedProduct.id &&
        (prevProducts.sizeId || null) === (normalizedProduct.sizeId || null) &&
        (prevProducts.additionalsKey || "") ===
          (normalizedProduct.additionalsKey || "") &&
        (prevProducts.requiredAdditionalsKey || "") ===
          (normalizedProduct.requiredAdditionalsKey || "")
    );
    if (!productsIsAreadyOnTheCart) {
      return setProducts((prev) => [...prev, normalizedProduct]);
    }

    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id === normalizedProduct.id &&
          (prevProduct.sizeId || null) === (normalizedProduct.sizeId || null) &&
          (prevProduct.additionalsKey || "") ===
            (normalizedProduct.additionalsKey || "") &&
          (prevProduct.requiredAdditionalsKey || "") ===
            (normalizedProduct.requiredAdditionalsKey || "")
        ) {
          return {
            ...prevProduct,
            quantity: prevProduct.quantity + normalizedProduct.quantity,
          };
        }
        return prevProduct;
      });
    });
  };
  const descreaseProductQuantity = (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id != productId ||
          (sizeId || null) !== (prevProduct.sizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
        ) {
          return prevProduct;
        }

        if (prevProduct.quantity === 1) {
          return prevProduct;
        }
        return { ...prevProduct, quantity: prevProduct.quantity - 1 };
      });
    });
  };

  const inCreaseProductQuantity = (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id != productId ||
          (sizeId || null) !== (prevProduct.sizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
        ) {
          return prevProduct;
        }

        return { ...prevProduct, quantity: prevProduct.quantity + 1 };
      });
    });
  };

  const removeProduct = (
    productId: string,
    sizeId?: string | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    setProducts((prevProducts) =>
      prevProducts.filter(
        (prevProduct) =>
          prevProduct.id != productId ||
          (prevProduct.sizeId || null) !== (sizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
      )
    );
  };

  const updateProductSize = (
    productId: string,
    currentSizeId: string | null | undefined,
    newSize: { id?: string; name: string; price: number } | null,
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    setProducts((prevProducts) =>
      prevProducts.map((prevProduct) => {
        if (
          prevProduct.id !== productId ||
          (prevProduct.sizeId || null) !== (currentSizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
        ) {
          return prevProduct;
        }
        const nextPrice = newSize?.price ?? prevProduct.basePrice;
        return {
          ...prevProduct,
          sizeId: newSize?.id ?? null,
          sizeName: newSize?.name ?? null,
          sizePrice: newSize?.price ?? null,
          price: nextPrice,
        };
      })
    );
  };

  const updateProductAdditionals = (
    productId: string,
    sizeId: string | null | undefined,
    additionals: CartAdditionalSelection[],
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    const normalizedAdditionals = normalizeAdditionals(additionals);
    const newAdditionalsKey = getAdditionalsKey(normalizedAdditionals);
    setProducts((prevProducts) =>
      prevProducts.map((prevProduct) => {
        if (
          prevProduct.id !== productId ||
          (prevProduct.sizeId || null) !== (sizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
        ) {
          return prevProduct;
        }
        return {
          ...prevProduct,
          additionals: normalizedAdditionals,
          additionalsKey: newAdditionalsKey,
        };
      })
    );
  };

  const updateProductRequiredAdditionals = (
    productId: string,
    sizeId: string | null | undefined,
    requiredAdditionals: CartRequiredAdditionalSelection[],
    additionalsKey?: string | null,
    requiredAdditionalsKey?: string | null
  ) => {
    const normalizedRequired = normalizeRequiredAdditionals(requiredAdditionals);
    const newRequiredKey = getRequiredAdditionalsKey(normalizedRequired);
    setProducts((prevProducts) =>
      prevProducts.map((prevProduct) => {
        if (
          prevProduct.id !== productId ||
          (prevProduct.sizeId || null) !== (sizeId || null) ||
          !matchesAdditionalsKey(additionalsKey, prevProduct.additionalsKey) ||
          !matchesRequiredAdditionalsKey(
            requiredAdditionalsKey,
            prevProduct.requiredAdditionalsKey
          )
        ) {
          return prevProduct;
        }
        return {
          ...prevProduct,
          requiredAdditionals: normalizedRequired,
          requiredAdditionalsKey: newRequiredKey,
        };
      })
    );
  };

  const clearCart = (closeCart: boolean = true) => {
    setProducts([]);
    if (closeCart) {
      setIsOPen(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        isOpen,
        products,
        totalQuantity,
        taggleCart,
        addProducts,
        descreaseProductQuantity,
        inCreaseProductQuantity,
        removeProduct,
        clearCart,
        total,
        updateProductSize,
        subtotalProducts,
        subtotalSizes,
        subtotalAdditionals,
        updateProductAdditionals,
        updateProductRequiredAdditionals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
