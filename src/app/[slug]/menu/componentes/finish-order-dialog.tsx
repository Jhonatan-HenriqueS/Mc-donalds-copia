"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionMethod } from "@prisma/client";
import { Loader2Icon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import type { Control } from "react-hook-form";
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

const baseFormSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório!",
  }),
  cpf: z
    .string()
    .trim()
    .min(11, {
      message: "O CPF é obrigatório!",
    })
    .refine((value) => isValidCpf(value), {
      message: "CPF inválido!",
    }),
});

const takeawayFormSchema = baseFormSchema.extend({
  deliveryStreet: z.string().trim().min(1, {
    message: "A rua é obrigatória!",
  }),
  deliveryNumber: z.string().trim().min(1, {
    message: "O número é obrigatório!",
  }),
  deliveryComplement: z.string().trim().optional(),
  deliveryNeighborhood: z.string().trim().min(1, {
    message: "O bairro é obrigatório!",
  }),
  deliveryCity: z.string().trim().min(1, {
    message: "A cidade é obrigatória!",
  }),
  deliveryState: z.string().trim().min(2, {
    message: "O estado é obrigatório!",
  }),
});

type BaseFormSchema = z.infer<typeof baseFormSchema>;
type TakeawayFormSchema = z.infer<typeof takeawayFormSchema>;

interface FinishOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinishOrderDialog = ({ open, onOpenChange }: FinishOrderDialogProps) => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const { products, clearCart } = useContext(CartContext);

  const searchParams = useSearchParams();
  const consumptionMethod = searchParams.get(
    "consumptionMethod"
  ) as ConsumptionMethod;
  const isTakeaway = consumptionMethod === "TAKEANAY";

  const [isLoading, setIsLoading] = useState(false);

  const formSchema = isTakeaway ? takeawayFormSchema : baseFormSchema;
  type FormSchema = typeof isTakeaway extends true
    ? TakeawayFormSchema
    : BaseFormSchema;

  const defaultValues = isTakeaway
    ? ({
        name: "",
        cpf: "",
        deliveryStreet: "",
        deliveryNumber: "",
        deliveryComplement: "",
        deliveryNeighborhood: "",
        deliveryCity: "",
        deliveryState: "",
      } satisfies TakeawayFormSchema)
    : ({
        name: "",
        cpf: "",
      } satisfies BaseFormSchema);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormSchema,
    shouldUnregister: true,
  });

  const onSubmit = async (data: FormSchema) => {
    if (products.length === 0) {
      toast.error("O carrinho está vazio");
      return;
    }

    setIsLoading(true);

    try {
      if (isTakeaway) {
        const takeawayData = data as TakeawayFormSchema;
        await createOrder({
          consumptionMethod,
          customerCpf: takeawayData.cpf,
          customerName: takeawayData.name,
          products,
          slug,
          deliveryStreet: takeawayData.deliveryStreet,
          deliveryNumber: takeawayData.deliveryNumber,
          deliveryComplement: takeawayData.deliveryComplement || "",
          deliveryNeighborhood: takeawayData.deliveryNeighborhood,
          deliveryCity: takeawayData.deliveryCity,
          deliveryState: takeawayData.deliveryState,
        });
      } else {
        const baseData = data as BaseFormSchema;
        await createOrder({
          consumptionMethod,
          customerCpf: baseData.cpf,
          customerName: baseData.name,
          products,
          slug,
        });
      }

      toast.success("Pedido criado com sucesso!");
      clearCart();
      form.reset();
      onOpenChange(false);

      // Redirecionar para a página de pedidos
      router.push(`/${slug}/orders?cpf=${data.cpf.replace(/\D/g, "")}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar pedido. Tente novamente."
      );
    } finally {
      setIsLoading(false);
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
            <DrawerTitle className="flex items-center justify-center gap-2">
              {isLoading && <Loader2Icon className="animate-spin h-4 w-4" />}
              {/* && neste caso se diz o seguinte "se isLoading for verdadeiro faça isto" "se não for simplismente ele não executa" */}
              Finalizar pedido
            </DrawerTitle>
            <DrawerDescription className="flex justify-center">
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
                          customInput={Input}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />

                {isTakeaway && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">
                        Endereço de Entrega
                      </h3>
                    </div>

                    <FormField
                      control={
                        form.control as unknown as Control<TakeawayFormSchema>
                      }
                      name="deliveryStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o nome da rua..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage></FormMessage>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={
                          form.control as unknown as Control<TakeawayFormSchema>
                        }
                        name="deliveryNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Número..." {...field} />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={
                          form.control as unknown as Control<TakeawayFormSchema>
                        }
                        name="deliveryComplement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apto, bloco..." {...field} />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={
                        form.control as unknown as Control<TakeawayFormSchema>
                      }
                      name="deliveryNeighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o bairro..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage></FormMessage>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={
                          form.control as unknown as Control<TakeawayFormSchema>
                        }
                        name="deliveryCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Digite a cidade..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={
                          form.control as unknown as Control<TakeawayFormSchema>
                        }
                        name="deliveryState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="UF"
                                maxLength={2}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                              />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <DrawerFooter>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando pedido..." : "Finalizar"}
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
