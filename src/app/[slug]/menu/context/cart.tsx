"use client";

import { Product } from "@prisma/client";
import { createContext, ReactNode, useState } from "react";

export interface CartProduct
  extends Pick<Product, "id" | "name" | "price" | "imageUrl"> {
  //Pega os dados salvos de fato
  quantity: number;
}

export interface IcartContext {
  isOpen: boolean;
  products: CartProduct[];
  taggleCart: () => void;
  addProducts: (product: CartProduct) => void;
  descreaseProductQuantity: (productId: string) => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  taggleCart: () => {},
  addProducts: () => {},
  descreaseProductQuantity: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isOpen, setIsOPen] = useState<boolean>(false);

  const taggleCart = () => {
    setIsOPen((prev) => !prev);
  };

  const addProducts = (product: CartProduct) => {
    const productsIsAreadyOnTheCart = products.some(
      (prevProducts) => prevProducts.id === product.id
    );
    if (!productsIsAreadyOnTheCart) {
      //Se não tiver o produto no meu carrinho, retorna a lista e o produto
      return setProducts((prev) => [...prev, product]);
      //...prevProducts retorna tudo que estava na lista anterior
    }

    setProducts((prevProducts) => {
      //Se esse produto existe e eu to salvando novamente, eu adiciono a quantidade que estava com a nova quantidade que o usuário quer
      return prevProducts.map((prevProduct) => {
        if (prevProduct.id === product.id) {
          return {
            ...prevProduct,
            quantity: prevProduct.quantity + product.quantity,
          };
        }
        return prevProduct;
      });
    });
  };

  const descreaseProductQuantity = (productId: string) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (prevProduct.id != productId) {
          return prevProduct;
        }

        if (prevProduct.quantity === 1) {
          return prevProduct;
        }
        return { ...prevProduct, quantity: prevProduct.quantity - 1 };
      });
    });
  };

  return (
    <CartContext.Provider
      value={{
        isOpen,
        products,
        taggleCart,
        addProducts,
        descreaseProductQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
