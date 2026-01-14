'use client';

import { Product } from '@prisma/client';
import { createContext, ReactNode, useState } from 'react';

export interface CartProduct extends Pick<
  Product,
  'id' | 'name' | 'imageUrl'
> {
  quantity: number;
  price: number; // preço atual considerando tamanho
  sizeId?: string | null;
  sizeName?: string | null;
  sizePrice?: number | null;
  sizes?: Array<{
    id?: string;
    name: string;
    price: number;
  }>;
}

export interface IcartContext {
  isOpen: boolean;
  products: CartProduct[];
  total: number;
  totalQuantity: number;
  taggleCart: () => void;
  addProducts: (product: CartProduct) => void;
  descreaseProductQuantity: (productId: string, sizeId?: string | null) => void;
  inCreaseProductQuantity: (productId: string, sizeId?: string | null) => void;
  removeProduct: (productId: string, sizeId?: string | null) => void;
  updateProductSize: (
    productId: string,
    currentSizeId: string | null | undefined,
    newSize: { id?: string; name: string; price: number } | null
  ) => void;
  clearCart: () => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  total: 0,
  totalQuantity: 0,
  taggleCart: () => {},
  addProducts: () => {},
  descreaseProductQuantity: () => {},
  inCreaseProductQuantity: () => {},
  removeProduct: () => {},
  updateProductSize: () => {},
  clearCart: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isOpen, setIsOPen] = useState<boolean>(false);

  const total = products.reduce((acc, product) => {
    //reduce percorre o array (a lista de produtos), recebe como parametro o produto
    //E acumula neste, neste caso soma, o valor ,0 faz com que acc comece com 0

    return acc + product.price * product.quantity;
  }, 0);

  const totalQuantity = products.reduce((acc, product) => {
    return acc + product.quantity;
  }, 0);

  const taggleCart = () => {
    setIsOPen((prev) => !prev);
  };

  const addProducts = (product: CartProduct) => {
    const productsIsAreadyOnTheCart = products.some(
      (prevProducts) =>
        prevProducts.id === product.id &&
        (prevProducts.sizeId || null) === (product.sizeId || null)
    );
    if (!productsIsAreadyOnTheCart) {
      return setProducts((prev) => [...prev, product]);
    }

    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id === product.id &&
          (prevProduct.sizeId || null) === (product.sizeId || null)
        ) {
          return {
            ...prevProduct,
            quantity: prevProduct.quantity + product.quantity,
          };
        }
        return prevProduct;
      });
    });
  };
  //Nesse dois caso, os dois verifica se o id do produto for diferente do produto selecionado, não faz nada com esse produto
  //Se for os mesmo id some ou subtrai 1
  const descreaseProductQuantity = (
    productId: string,
    sizeId?: string | null
  ) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id != productId ||
          (sizeId || null) !== (prevProduct.sizeId || null)
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
    sizeId?: string | null
  ) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (
          prevProduct.id != productId ||
          (sizeId || null) !== (prevProduct.sizeId || null)
        ) {
          return prevProduct;
        }

        return { ...prevProduct, quantity: prevProduct.quantity + 1 };
      });
    });
  };

  const removeProduct = (productId: string, sizeId?: string | null) => {
    setProducts(
      (prevProducts) =>
        prevProducts.filter(
          (prevProduct) =>
            prevProduct.id != productId ||
            (prevProduct.sizeId || null) !== (sizeId || null)
        )
    );
  };

  const updateProductSize = (
    productId: string,
    currentSizeId: string | null | undefined,
    newSize: { id?: string; name: string; price: number } | null
  ) => {
    setProducts((prevProducts) =>
      prevProducts.map((prevProduct) => {
        if (
          prevProduct.id !== productId ||
          (prevProduct.sizeId || null) !== (currentSizeId || null)
        ) {
          return prevProduct;
        }
        return {
          ...prevProduct,
          sizeId: newSize?.id ?? null,
          sizeName: newSize?.name ?? null,
          sizePrice: newSize?.price ?? null,
          price: newSize?.price ?? prevProduct.price,
        };
      })
    );
  };

  const clearCart = () => {
    setProducts([]);
    setIsOPen(false);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
