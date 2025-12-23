"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionMethod } from "@prisma/client";
import { Loader2Icon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useContext, useTransition } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"; //Vindo de shadcn@2.3.0 add drawer
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { createOrder } from "../actions/create-order";
import { CartContext } from "../context/cart";
import { isValidCpf } from "../helpers/cpf";

const formSchema = z.object({
  //z é um formulário já pronto e seguro
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório!",
  }),
  //trim tira os espaços se houve e min determina qual o minimo de caractere necessário para ser aceito
  //Message é o erro que será exibido caso estiver inválido
  cpf: z
    .string()
    .trim()
    .min(11, {
      message: "O CPF é obrigatório!",
    })
    .refine((value) => isValidCpf(value), {
      //refine eu uso para adicionar mais regrass
      message: "CPF inválido!",
    }),
});

type FormSchema = z.infer<typeof formSchema>;
//Cria a interface de formSchema

interface FinishOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinishOrderDialog = ({ open, onOpenChange }: FinishOrderDialogProps) => {
  //Pega o schema e usa como interface para eu usar na validação

  const { slug } = useParams<{ slug: string }>();

  const { products } = useContext(CartContext);
  //Vai no meu contexto e pega os produtos já salvos

  const searchParams = useSearchParams();

  const [isPeding, startTransition] = useTransition();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      //defaultValues diz com o que os campos irão começar
      name: "",
      cpf: "",
    },
    shouldUnregister: true,
    //shouldUnregister diz que quando parar de renderizar os campos para de funcionar
  });

  const onSubmit = async (data: FormSchema) => {
    //Só executa caso o formulário seja valido

    try {
      const consumptionMethod = searchParams.get(
        "consumptionMethod"
      ) as ConsumptionMethod;
      //Pega meu consumptionMethod da URL e trás para const

      startTransition(async () => {
        //Pega a const que possui useTransition e faz que enquanto esses dados é enviado ao servidor ela descreve como "está em transição"
        await createOrder({
          consumptionMethod,
          customerCpf: data.cpf,
          customerName: data.name,
          products,
          slug,
        });
        onOpenChange(false);
        toast.success("Pedido finalizado com sucesso!");
      });
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  };

  return (
    <div>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {/* asChild diz que não deve criar um novo elemento visual, apenas se crie dentro de Button */}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {isPeding && <Loader2Icon className="animate-spin " />}
              {/* && neste caso se diz o seguinte "se isPeding for verdadeiro faça isto" "se não for simplismente ele não executa" */}
              Finalizar pedido
            </DrawerTitle>
            <DrawerDescription>
              Insira suas informações abaixo para finalizar seu pedido
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-5 ">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu nome..." {...field} />
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu cpf</FormLabel>
                      <FormControl>
                        <PatternFormat
                          placeholder="Digite seu CPF..."
                          format="###.###.###-##"
                          customInput={Input} //Vai ter a customização do Input normal
                          {...field}
                        />
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />
                <DrawerFooter>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={isPeding}
                  >
                    Finalizar
                  </Button>

                  <DrawerClose asChild>
                    <Button className="w-full rounded-full" variant="outline">
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FinishOrderDialog;
