"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PatternFormat } from "react-number-format";
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
import { isValidCpf } from "../helpers/cpf";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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

  const onSubmit = (data: FormSchema) => {
    //Só executa caso o formulário seja valido
    console.log({ data });
  };

  return (
    <div>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {/* asChild diz que não deve criar um novo elemento visual, apenas se crie dentro de Button */}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Finalizar pedido</DrawerTitle>
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
                  <Button type="submit" className="rounded-full">
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
