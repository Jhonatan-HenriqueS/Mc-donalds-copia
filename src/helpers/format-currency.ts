export const formatCurrency = (value: number) => {
  {
    return new Intl.NumberFormat("pt-BR", {
      //Está função tranforma meu preço em Reais automaticamente
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
};
