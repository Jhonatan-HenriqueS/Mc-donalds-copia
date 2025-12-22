//Este layout faz com que tudo que estiver aqui sirva para todas as páginas
//Fiz alterações adicionadno o poppins e adicionadno no body meus desejos

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./[slug]/menu/context/cart";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mc-donalds",
  description: "Cópia do Mc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={`${poppins.className} antialiased`}>
        <CartProvider>{children}</CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
