"use client";

import { Product } from "@prisma/client";
import { createContext, ReactNode, useState } from "react";

interface CartProduct
  extends Pick<Product, "id" | "name" | "price" | "imageUrl"> {
  //Pega os dados salvos de fato
  quantity: number;
}

export interface IcartContext {
  isOpen: boolean;
  products: CartProduct[];
  taggleCart: () => void;
  addProducts: (product: CartProduct) => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  taggleCart: () => {},
  addProducts: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isOpen, setIsOPen] = useState<boolean>(false);

  const taggleCart = () => {
    setIsOPen((prev) => !prev);
  };

  const addProducts = (product: CartProduct) => {
    setProducts((prev) => [...prev, product]);
    //...prev retorna tudo que estava na lista anterior
  };

  return (
    <CartContext.Provider value={{ isOpen, products, taggleCart, addProducts }}>
      {children}
    </CartContext.Provider>
  );
};
