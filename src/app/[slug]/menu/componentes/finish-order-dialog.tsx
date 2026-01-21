"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionMethod } from "@prisma/client";
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";

import { createOrder } from "../actions/create-order";
import { CartContext } from "../context/cart";
import { isValidCpf } from "../helpers/cpf";

const baseFormSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório!",
  }),
  email: z.string().trim().email({ message: "Digite um email válido!" }),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length === 10;
      },
      { message: "Digite um telefone válido (ex: (69) 9999-9999)" }
    ),
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
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    cpf: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingProfile, setEditingProfile] = useState(true);
  const [savedAddress, setSavedAddress] = useState<{
    deliveryStreet: string;
    deliveryNumber: string;
    deliveryComplement?: string;
    deliveryNeighborhood: string;
    deliveryCity: string;
    deliveryState: string;
  } | null>(null);
  const [editingAddress, setEditingAddress] = useState(true);
  const [showAddressDetails, setShowAddressDetails] = useState(false);

  const formSchema = isTakeaway ? takeawayFormSchema : baseFormSchema;
  type FormSchema = typeof isTakeaway extends true
    ? TakeawayFormSchema
    : BaseFormSchema;

  const defaultValues = isTakeaway
    ? ({
        name: "",
        email: "",
        phone: "",
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
        email: "",
        phone: "",
        cpf: "",
      } satisfies BaseFormSchema);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormSchema,
    // Mantém os valores mesmo quando inputs são ocultados (resumo de perfil/endereço)
    shouldUnregister: false,
  });

  const profileCompleted = Boolean(savedProfile) && !editingProfile;
  const addressCompleted =
    !isTakeaway || (Boolean(savedAddress) && !editingAddress);
  const needsProfileSave = !profileCompleted;
  const needsAddressSave = isTakeaway && profileCompleted && !addressCompleted;
  const canFinalize = !needsProfileSave && !needsAddressSave;

  const profileFieldNames = ["name", "email", "phone", "cpf"] as const;
  const addressFieldNames = [
    "deliveryStreet",
    "deliveryNumber",
    "deliveryNeighborhood",
    "deliveryCity",
    "deliveryState",
  ] as const;

  const handleSaveProfile = async () => {
    const isValid = await form.trigger(
      profileFieldNames as unknown as Array<keyof FormSchema>
    );
    if (!isValid) return;
    const values = form.getValues() as BaseFormSchema;
    setSavedProfile({
      name: values.name,
      email: values.email,
      phone: values.phone,
      cpf: values.cpf,
    });
    setEditingProfile(false);
    setShowDetails(false);
  };

  const handleSaveAddress = async () => {
    if (!isTakeaway) return;
    const isValid = await form.trigger(
      addressFieldNames as unknown as Array<keyof FormSchema>
    );
    if (!isValid) return;
    const values = form.getValues() as TakeawayFormSchema;
    setSavedAddress({
      deliveryStreet: values.deliveryStreet,
      deliveryNumber: values.deliveryNumber,
      deliveryComplement: values.deliveryComplement,
      deliveryNeighborhood: values.deliveryNeighborhood,
      deliveryCity: values.deliveryCity,
      deliveryState: values.deliveryState,
    });
    setEditingAddress(false);
    setShowAddressDetails(false);
  };

  const handleSaveStep = async () => {
    if (needsProfileSave) {
      await handleSaveProfile();
      return;
    }
    if (needsAddressSave) {
      await handleSaveAddress();
    }
  };

  // Buscar restaurantId para salvar perfil local
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (!slug) return;
      try {
        const response = await fetch(`/api/restaurant-by-slug?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.restaurantId) {
            setRestaurantId(data.restaurantId);
            let parsedProfile: Partial<FormSchema> | null = null;
            const saved = localStorage.getItem(
              `last_order_profile_${data.restaurantId}`
            );
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed.name && parsed.email && parsed.phone && parsed.cpf) {
                  parsedProfile = parsed;
                  setSavedProfile(parsed);
                  setEditingProfile(false);
                  form.reset({
                    ...(defaultValues as FormSchema),
                    name: parsed.name,
                    email: parsed.email,
                    phone: parsed.phone,
                    cpf: parsed.cpf,
                  });
                }
              } catch (error) {
                console.error("Erro ao ler perfil salvo:", error);
              }
            }

            if (isTakeaway) {
              const savedAddressRaw = localStorage.getItem(
                `last_order_address_${data.restaurantId}`
              );
              if (savedAddressRaw) {
                try {
                  const parsedAddress = JSON.parse(savedAddressRaw);
                  if (
                    parsedAddress.deliveryStreet &&
                    parsedAddress.deliveryNumber &&
                    parsedAddress.deliveryNeighborhood &&
                    parsedAddress.deliveryCity &&
                    parsedAddress.deliveryState
                  ) {
                    setSavedAddress(parsedAddress);
                    setEditingAddress(false);
                    form.reset({
                      ...(defaultValues as FormSchema),
                      ...(parsedProfile ?? {}),
                      ...parsedAddress,
                    });
                    setShowAddressDetails(false);
                  }
                } catch (error) {
                  console.error("Erro ao ler endereço salvo:", error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar restaurantId:", error);
      }
    };

    fetchRestaurantId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onSubmit = async (data: FormSchema) => {
    if (products.length === 0) {
      toast.error("O carrinho está vazio");
      return;
    }
    if (!canFinalize) {
      toast.error("Salve seus dados antes de finalizar o pedido.");
      return;
    }

    setIsLoading(true);

    try {
      const payloadBase = {
        consumptionMethod,
        customerCpf: data.cpf,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        products,
        slug,
      };

      if (isTakeaway) {
        const takeawayData = data as TakeawayFormSchema;
        await createOrder({
          ...payloadBase,
          products: products.map((p) => ({
            id: p.id,
            price: p.price,
            quantity: p.quantity,
            sizeId: p.sizeId || undefined,
            additionals:
              p.additionals?.map((additional) => ({
                id: additional.id,
                name: additional.name,
                price: additional.price,
                quantity: additional.quantity,
              })) || [],
            requiredAdditionals:
              p.requiredAdditionals?.map((required) => ({
                id: required.id,
                name: required.name,
                groupId: required.groupId,
                groupTitle: required.groupTitle,
                quantity: required.quantity,
              })) || [],
          })),
          deliveryStreet: takeawayData.deliveryStreet,
          deliveryNumber: takeawayData.deliveryNumber,
          deliveryComplement: takeawayData.deliveryComplement || "",
          deliveryNeighborhood: takeawayData.deliveryNeighborhood,
          deliveryCity: takeawayData.deliveryCity,
          deliveryState: takeawayData.deliveryState,
        });
      } else {
        await createOrder({
          ...payloadBase,
          products: products.map((p) => ({
            id: p.id,
            price: p.price,
            quantity: p.quantity,
            sizeId: p.sizeId || undefined,
            additionals:
              p.additionals?.map((additional) => ({
                id: additional.id,
                name: additional.name,
                price: additional.price,
                quantity: additional.quantity,
              })) || [],
            requiredAdditionals:
              p.requiredAdditionals?.map((required) => ({
                id: required.id,
                name: required.name,
                groupId: required.groupId,
                groupTitle: required.groupTitle,
                quantity: required.quantity,
              })) || [],
          })),
        });
      }

      toast.success("Pedido criado com sucesso!");
      setSavedProfile({
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
      });
      setEditingProfile(false);
      if (isTakeaway) {
        const takeawayData = data as TakeawayFormSchema;
        setSavedAddress({
          deliveryStreet: takeawayData.deliveryStreet,
          deliveryNumber: takeawayData.deliveryNumber,
          deliveryComplement: takeawayData.deliveryComplement,
          deliveryNeighborhood: takeawayData.deliveryNeighborhood,
          deliveryCity: takeawayData.deliveryCity,
          deliveryState: takeawayData.deliveryState,
        });
        setEditingAddress(false);
      }
      clearCart();
      form.reset(data as FormSchema);
      onOpenChange(false);

      // Buscar restaurantId e salvar CPF no localStorage
      try {
        const response = await fetch(`/api/restaurant-by-slug?slug=${slug}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.restaurantId) {
            const cpfWithoutPunctuation = data.cpf.replace(/\D/g, "");
            localStorage.setItem(
              `last_order_cpf_${result.restaurantId}`,
              cpfWithoutPunctuation
            );
            localStorage.setItem(
              `last_order_profile_${result.restaurantId}`,
              JSON.stringify({
                name: data.name,
                email: data.email,
                phone: data.phone,
                cpf: data.cpf,
              })
            );
            if (isTakeaway) {
              const takeawayData = data as TakeawayFormSchema;
              localStorage.setItem(
                `last_order_address_${result.restaurantId}`,
                JSON.stringify({
                  deliveryStreet: takeawayData.deliveryStreet,
                  deliveryNumber: takeawayData.deliveryNumber,
                  deliveryComplement: takeawayData.deliveryComplement,
                  deliveryNeighborhood: takeawayData.deliveryNeighborhood,
                  deliveryCity: takeawayData.deliveryCity,
                  deliveryState: takeawayData.deliveryState,
                })
              );
            }
          }
        }
      } catch (error) {
        console.error("Erro ao salvar CPF:", error);
      }

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
        <DrawerContent className="max-h-[96vh]">
          <ScrollArea className="h-full overflow-y-auto ">
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
                  {savedProfile && !editingProfile ? (
                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {savedProfile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {savedProfile.email}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProfile(true)}
                        >
                          Editar dados
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0"
                          onClick={() => setShowDetails((prev) => !prev)}
                        >
                          {showDetails ? (
                            <>
                              <ChevronUpIcon className="h-4 w-4" />
                              <span className="text-xs">Ocultar detalhes</span>
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="h-4 w-4" />
                              <span className="text-xs">Mostrar detalhes</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0 text-red-500"
                          onClick={() => {
                            setSavedProfile(null);
                            setEditingProfile(true);
                            setShowDetails(false);
                            setSavedAddress(null);
                            setEditingAddress(true);
                            setShowAddressDetails(false);
                            form.reset(defaultValues as FormSchema);
                            if (restaurantId) {
                              localStorage.removeItem(
                                `last_order_profile_${restaurantId}`
                              );
                              localStorage.removeItem(
                                `last_order_address_${restaurantId}`
                              );
                            }
                          }}
                        >
                          Pedir em outra conta
                        </Button>
                      </div>

                      {showDetails && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Telefone: {savedProfile.phone}</p>
                          <p>
                            CPF:{" "}
                            {`${savedProfile.cpf.slice(0, 3)}***.***-${savedProfile.cpf.slice(-2)}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seu nome</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Digite seu nome..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seu email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Digite seu email..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <PatternFormat
                                placeholder="(69) 99999-9999"
                                format="(##) #####-####"
                                customInput={Input}
                                {...field}
                              />
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
                    </>
                  )}

                  {isTakeaway && profileCompleted && (
                    <>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4">
                          Endereço de Entrega
                        </h3>
                      </div>

                      {isTakeaway && savedAddress && !editingAddress ? (
                        <div className="space-y-3 rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">
                                {savedAddress.deliveryStreet},{" "}
                                {savedAddress.deliveryNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {savedAddress.deliveryCity}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAddress(true)}
                            >
                              Atualizar endereço
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0"
                              onClick={() =>
                                setShowAddressDetails((prev) => !prev)
                              }
                            >
                              {showAddressDetails ? (
                                <>
                                  <ChevronUpIcon className="h-4 w-4" />
                                  <span className="text-xs">
                                    Ocultar detalhes
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="h-4 w-4" />
                                  <span className="text-xs">
                                    Mostrar detalhes
                                  </span>
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0 text-red-500"
                              onClick={() => {
                                setSavedAddress(null);
                                setEditingAddress(true);
                                setShowAddressDetails(false);
                                if (restaurantId) {
                                  localStorage.removeItem(
                                    `last_order_address_${restaurantId}`
                                  );
                                }
                                form.reset({
                                  ...(defaultValues as FormSchema),
                                  ...(savedProfile ?? {}),
                                });
                              }}
                            >
                              Usar outro endereço
                            </Button>
                          </div>

                          {showAddressDetails && (
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>
                                {savedAddress.deliveryStreet},{" "}
                                {savedAddress.deliveryNumber}
                              </p>
                              {savedAddress.deliveryComplement && (
                                <p>Compl: {savedAddress.deliveryComplement}</p>
                              )}
                              <p>{savedAddress.deliveryNeighborhood}</p>
                              <p>
                                {savedAddress.deliveryCity}/
                                {savedAddress.deliveryState}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
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
                                    <Input
                                      placeholder="Apto, bloco..."
                                      {...field}
                                    />
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
                                      placeholder="RO"
                                      maxLength={2}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value.toUpperCase()
                                        )
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
                    </>
                  )}
                  <DrawerFooter>
                    {canFinalize ? (
                      <Button
                        type="submit"
                        className="rounded-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando pedido..." : "Finalizar"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="rounded-full"
                        disabled={isLoading}
                        onClick={handleSaveStep}
                      >
                        Salvar
                      </Button>
                    )}

                    <DrawerClose asChild>
                      <Button className="w-full rounded-full" variant="outline">
                        Cancelar
                      </Button>
                    </DrawerClose>
                  </DrawerFooter>
                </form>
              </Form>
            </div>
            <ScrollBar orientation="vertical" className="hidden"></ScrollBar>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FinishOrderDialog;
