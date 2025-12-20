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
  inCreaseProductQuantity: (productId: string) => void;
  removeProduct: (productId: string) => void;
}

export const CartContext = createContext<IcartContext>({
  isOpen: false,
  products: [],
  taggleCart: () => {},
  addProducts: () => {},
  descreaseProductQuantity: () => {},
  inCreaseProductQuantity: () => {},
  removeProduct: () => {},
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
      //some() pega como parametro prevProduct e ve se ele é === a product.id
      //Se for ele retorna true, se não false, ele percorre mas só retorna boolean, igual um map
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
  //Nesse dois caso, os dois verifica se o id do produto for diferente do produto selecionado, não faz nada com esse produto
  //Se for os mesmo id some ou subtrai 1
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

  const inCreaseProductQuantity = (productId: string) => {
    setProducts((prevProducts) => {
      return prevProducts.map((prevProduct) => {
        if (prevProduct.id != productId) {
          return prevProduct;
        }

        return { ...prevProduct, quantity: prevProduct.quantity + 1 };
      });
    });
  };

  const removeProduct = (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((prevProduct) => prevProduct.id != productId)
    );
  };

  return (
    <CartContext.Provider
      value={{
        isOpen,
        products,
        taggleCart,
        addProducts,
        descreaseProductQuantity,
        inCreaseProductQuantity,
        removeProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
