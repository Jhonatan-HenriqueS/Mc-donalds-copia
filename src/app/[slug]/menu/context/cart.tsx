"use client";

import { Product } from "@prisma/client";
import { createContext, ReactNode, useState } from "react";

interface CartProduct extends Product {
  //Pega os dados salvos de fato
  quantity: number;
}

export interface IcartContext {
  isOpen: boolean;
  products: CartProduct[];
  taggleCart: () => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  taggleCart: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isOpen, setIsOPen] = useState<boolean>(false);

  const taggleCart = () => {
    setIsOPen((prev) => !prev);
  };

  return (
    <CartContext.Provider value={{ isOpen, products, taggleCart }}>
      {children}
    </CartContext.Provider>
  );
};
