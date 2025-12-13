//Usando npx shadcn@2.3.0 init
//Para usar o botão dessa biblioteca instalamos com npx shadcn@2.3.0 add button
//Para usar o input dessa biblioteca instalamos com npx shadcn@2.3.0 add input

//Usando o prettier pligin do tailwind vindo de  npm install -D prettier-plugin-tailwindcss@0.6.5

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ProductPage = () => {
  return (
    <div className="p-5 border border-red-500 rounded-xl">
      <h1 className="text-red-500">Products Page</h1>
      <Button>Button da shadcn</Button>
      <Input placeholder="Odiei esse shadcn" />
    </div>
  );
};

export default ProductPage;
