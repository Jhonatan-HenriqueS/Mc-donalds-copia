"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionMethod } from "@prisma/client";
import {
  Check,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import type { Control } from "react-hook-form";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { isPushSupported, subscribeToPush } from "@/lib/push-client";

import { createOrder } from "../actions/create-order";
import { CartContext } from "../context/cart";

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
      { message: "Digite um telefone válido (ex: (69) 9999-9999)" },
    ),
  paymentMethodId: z.string().min(1, {
    message: "Selecione uma forma de pagamento.",
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
  paymentMethods: Array<{ id: string; name: string }>;
}

const FinishOrderDialog = ({
  open,
  onOpenChange,
  paymentMethods,
}: FinishOrderDialogProps) => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const { products, clearCart, isOpen, taggleCart } = useContext(CartContext);

  const searchParams = useSearchParams();
  const consumptionMethod = searchParams.get(
    "consumptionMethod",
  ) as ConsumptionMethod;
  const isTakeaway = consumptionMethod === "TAKEANAY";

  const [isLoading, setIsLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successOrderUrl, setSuccessOrderUrl] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
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
        paymentMethodId: "",
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
        paymentMethodId: "",
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
  const canSelectPayment = profileCompleted && addressCompleted;
  const selectedPaymentMethodId = form.watch("paymentMethodId");
  const isPaymentSelected = Boolean(selectedPaymentMethodId);
  const canFinalize = !needsProfileSave && !needsAddressSave && isPaymentSelected;

  const profileFieldNames = ["name", "email", "phone"] as const;
  const addressFieldNames = [
    "deliveryStreet",
    "deliveryNumber",
    "deliveryNeighborhood",
    "deliveryCity",
    "deliveryState",
  ] as const;

  const handleSaveProfile = async () => {
    const isValid = await form.trigger(
      profileFieldNames as unknown as Array<keyof FormSchema>,
    );
    if (!isValid) return;
    const values = form.getValues() as BaseFormSchema;
    setSavedProfile({
      name: values.name,
      email: values.email,
      phone: values.phone,
    });
    setEditingProfile(false);
    setShowDetails(false);
  };

  const handleSaveAddress = async () => {
    if (!isTakeaway) return;
    const isValid = await form.trigger(
      addressFieldNames as unknown as Array<keyof FormSchema>,
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

  const handleSubscribePush = async () => {
    if (!createdOrderId) {
      toast.error("Pedido não encontrado para ativar notificações.");
      return;
    }
    if (!isPushSupported()) {
      toast.error("Seu navegador não suporta notificações push.");
      return;
    }
    try {
      const subscription = await subscribeToPush();
      const subscriptionJson = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CUSTOMER",
          orderId: createdOrderId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: subscriptionJson.keys,
          },
        }),
      });
      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.error || "Erro ao salvar subscription");
      }
    } catch (error) {
      console.error("Erro ao ativar push do pedido:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao ativar notificações"
      );
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
              `last_order_profile_${data.restaurantId}`,
            );
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed.name && parsed.email && parsed.phone) {
                  parsedProfile = parsed;
                  setSavedProfile(parsed);
                  setEditingProfile(false);
                  form.reset({
                    ...(defaultValues as FormSchema),
                    name: parsed.name,
                    email: parsed.email,
                    phone: parsed.phone,
                  });
                }
              } catch (error) {
                console.error("Erro ao ler perfil salvo:", error);
              }
            }

            if (isTakeaway) {
              const savedAddressRaw = localStorage.getItem(
                `last_order_address_${data.restaurantId}`,
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

  useEffect(() => {
    if (!successDialogOpen) {
      setIsRedirecting(false);
      setCreatedOrderId(null);
    }
  }, [successDialogOpen]);

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
      const normalizedEmail = data.email.trim().toLowerCase();
      const payloadBase = {
        consumptionMethod,
        customerName: data.name,
        customerEmail: normalizedEmail,
        customerPhone: data.phone,
        paymentMethodId: data.paymentMethodId,
        products,
        slug,
      };

      let createdOrderIdLocal: number | null = null;

      if (isTakeaway) {
        const takeawayData = data as TakeawayFormSchema;
        const createdOrder = await createOrder({
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
        createdOrderIdLocal = createdOrder?.id ?? null;
      } else {
        const createdOrder = await createOrder({
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
        createdOrderIdLocal = createdOrder?.id ?? null;
      }

      toast.success("Pedido criado com sucesso!");
      setSuccessOrderUrl(
        `/${slug}/orders?email=${encodeURIComponent(normalizedEmail)}`,
      );
      setCreatedOrderId(createdOrderIdLocal);
      setSuccessDialogOpen(true);
      setSavedProfile({
        name: data.name,
        email: normalizedEmail,
        phone: data.phone,
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
      clearCart(false);
      form.reset(data as FormSchema);
      onOpenChange(false);

      // Buscar restaurantId e salvar email no localStorage
      try {
        const response = await fetch(`/api/restaurant-by-slug?slug=${slug}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.restaurantId) {
            localStorage.setItem(
              `last_order_email_${result.restaurantId}`,
              normalizedEmail,
            );
            localStorage.setItem(
              `last_order_profile_${result.restaurantId}`,
              JSON.stringify({
                name: data.name,
                email: normalizedEmail,
                phone: data.phone,
              }),
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
                }),
              );
            }
          }
        }
      } catch (error) {
        console.error("Erro ao salvar email:", error);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar pedido. Tente novamente.",
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
                                `last_order_profile_${restaurantId}`,
                              );
                              localStorage.removeItem(
                                `last_order_email_${restaurantId}`,
                              );
                              localStorage.removeItem(
                                `last_order_address_${restaurantId}`,
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
                                    `last_order_address_${restaurantId}`,
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
                                          e.target.value.toUpperCase(),
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
                  {canSelectPayment && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">
                        Forma de Pagamento
                      </h3>
                      {paymentMethods.length === 0 ? (
                        <p className="text-xs text-destructive">
                          Nenhuma forma de pagamento disponível. Contate o
                          restaurante.
                        </p>
                      ) : (
                        <FormField
                          control={form.control}
                          name="paymentMethodId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selecione uma opção</FormLabel>
                              <FormControl>
                                <select
                                  className="text-sm border rounded-md px-3 py-2 w-full bg-background"
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  <option value="">Selecione...</option>
                                  {paymentMethods.map((method) => (
                                    <option key={method.id} value={method.id}>
                                      {method.name}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage></FormMessage>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                  <DrawerFooter>
                    {needsProfileSave || needsAddressSave ? (
                      <Button
                        type="button"
                        className="rounded-full"
                        disabled={isLoading}
                        onClick={handleSaveStep}
                      >
                        Salvar
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="rounded-full"
                        disabled={isLoading || !isPaymentSelected}
                      >
                        {isLoading ? "Criando pedido..." : "Finalizar"}
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
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="w-[90%] rounded-lg ">
          <AlertDialogHeader className="text-center items-center">
            <AlertDialogTitle>Pedido finalizado!</AlertDialogTitle>
            <AlertDialogDescription className="text-center justify-center">
              Produto finalizado com sucesso! <br /> Para acompanhar cada
              detalhes de seu pedido veja na aba meus pedidos
            </AlertDialogDescription>
            <div className="bg-red-600 rounded-full p-4 ">
              <Check className="text-white" height={55} width={55} />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center flex flex-col gap-1">
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600 w-full"
              disabled={isRedirecting}
              onClick={() => {
                if (!successOrderUrl) return;
                if (createdOrderId) {
                  void handleSubscribePush();
                }
                setIsRedirecting(true);
                router.push(successOrderUrl);
              }}
            >
              {isRedirecting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Carregando...
                </span>
              ) : (
                "Ver pedido"
              )}
            </Button>
            <AlertDialogCancel
              className="bg-white w-full"
              disabled={isRedirecting}
              onClick={() => {
                if (createdOrderId) {
                  void handleSubscribePush();
                }
                if (isOpen) {
                  taggleCart();
                }
              }}
            >
              Continuar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FinishOrderDialog;
