"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  email: z
    .string()
    .trim()
    .email({ message: "Digite um email válido!" }),
});

type FormSchema = z.infer<typeof formSchema>;

interface EmailFormProps {
  restaurantId?: string;
}

const EmailForm = ({ restaurantId }: EmailFormProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const [resolvedRestaurantId, setResolvedRestaurantId] = useState<
    string | null
  >(restaurantId || null);

  // Buscar restaurantId se não foi fornecido
  useEffect(() => {
    if (resolvedRestaurantId || !slug) return;

    const fetchRestaurantId = async () => {
      try {
        const response = await fetch(
          `/api/restaurant-by-slug?slug=${slug}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.restaurantId) {
            setResolvedRestaurantId(data.restaurantId);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar restaurantId:", error);
      }
    };

    fetchRestaurantId();
  }, [slug, resolvedRestaurantId]);

  const onSubmit = (data: FormSchema) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    setIsLoading(true);
    router.replace(`${pathname}?email=${encodeURIComponent(normalizedEmail)}`);
    //transforma a rota para o nome do restaurant junto com o email informado

    // Salvar email no localStorage se tiver restaurantId
    if (resolvedRestaurantId) {
      localStorage.setItem(
        `last_order_email_${resolvedRestaurantId}`,
        normalizedEmail
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Drawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Visualizar Pedidos</DrawerTitle>
          <DrawerDescription>
            Insira seu email abaixo para visualizar seus pedidos.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="p-5">
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
            <DrawerFooter>
              <Button className="w-full rounded-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Carregando...
                  </span>
                ) : (
                  "Confirmar"
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
};

export default EmailForm;
