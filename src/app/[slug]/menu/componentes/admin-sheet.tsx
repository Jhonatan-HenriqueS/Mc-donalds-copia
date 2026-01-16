"use client";

import {
  CategoryAdditional,
  OrderStatus,
  Prisma,
  Product,
  RequiredAdditionalGroup,
  RequiredAdditionalItem,
} from "@prisma/client";
import {
  Bell,
  ClockIcon,
  Edit,
  ImageIcon,
  LogOut,
  Package,
  Plus,
  Trash2,
  Trash2Icon,
  Users,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createAdditional } from "@/app/[slug]/menu/actions/create-additional";
import { createCategory } from "@/app/[slug]/menu/actions/create-category";
import { createProduct } from "@/app/[slug]/menu/actions/create-product";
import { createRequiredAdditionalGroup } from "@/app/[slug]/menu/actions/create-required-additional-group";
import { createRequiredAdditionalItem } from "@/app/[slug]/menu/actions/create-required-additional-item";
import { deleteAdditional } from "@/app/[slug]/menu/actions/delete-additional";
import { deleteCategory } from "@/app/[slug]/menu/actions/delete-category";
import { deleteProduct } from "@/app/[slug]/menu/actions/delete-product";
import { deleteRequiredAdditionalGroup } from "@/app/[slug]/menu/actions/delete-required-additional-group";
import { deleteRequiredAdditionalItem } from "@/app/[slug]/menu/actions/delete-required-additional-item";
import { getCustomers } from "@/app/[slug]/menu/actions/get-customers";
import { getOrders } from "@/app/[slug]/menu/actions/get-orders";
import { getOrdersCount } from "@/app/[slug]/menu/actions/get-orders-count";
import { getProducts } from "@/app/[slug]/menu/actions/get-products";
import { updateAdditional } from "@/app/[slug]/menu/actions/update-additional";
import { updateRequiredAdditionalGroup } from "@/app/[slug]/menu/actions/update-required-additional-group";
import { updateRequiredAdditionalItem } from "@/app/[slug]/menu/actions/update-required-additional-item";
import { updateConsumptionMethods } from "@/app/[slug]/menu/actions/update-consumption-methods";
import { updateOrderStatus } from "@/app/[slug]/menu/actions/update-order-status";
import { updateProduct } from "@/app/[slug]/menu/actions/update-product";
import { updateRestaurantAvatar } from "@/app/[slug]/menu/actions/update-restaurant-avatar";
import { updateRestaurantCover } from "@/app/[slug]/menu/actions/update-restaurant-cover";
import { updateRestaurantDeliveryFee } from "@/app/[slug]/menu/actions/update-restaurant-delivery-fee";
import { updateRestaurantStatus } from "@/app/[slug]/menu/actions/update-restaurant-status";
import { formatCpf } from "@/app/[slug]/menu/helpers/format-cpf";
import { useOrderNotifications } from "@/app/[slug]/menu/hooks/use-order-notifications";
import { logout } from "@/app/actions/logout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/helpers/format-currency";

interface AdminSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      menuCategorias: {
        include: {
          additionals: true;
          requiredAdditionalGroups: {
            include: {
              items: true;
            };
          };
        };
      };
    };
  }>;
}

interface Customer {
  name: string;
  cpf: string;
  lastOrderDate: Date;
  totalSpent: number;
  totalSpentThisMonth: number;
}

type ProductWithCategory = Product & {
  menuCategory: {
    id: string;
    name: string;
  };
  sizes?: {
    id: string;
    name: string;
    price: number;
  }[];
};

const AdminSheet = ({ isOpen, onOpenChange, restaurant }: AdminSheetProps) => {
  const router = useRouter();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddAdditional, setShowAddAdditional] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showManageProducts, setShowManageProducts] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showConsumptionMethods, setShowConsumptionMethods] = useState(false);
  const [showUpdateAvatar, setShowUpdateAvatar] = useState(false);
  const [showUpdateCover, setShowUpdateCover] = useState(false);
  const [showUpdateDeliveryFee, setShowUpdateDeliveryFee] = useState(false);
  const [ordersView, setOrdersView] = useState<"today" | "all">("today");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<
    OrderStatus | "ALL"
  >("ALL");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [orders, setOrders] = useState<
    Array<
      Prisma.OrderGetPayload<{
        include: {
          orderProducts: {
            include: {
              product: {
                select: {
                  name: true;
                  imageUrl: true;
                };
              };
              additionals: true;
              requiredAdditionals: true;
            };
          };
        };
      }>
    >
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [totalMonthRevenue, setTotalMonthRevenue] = useState(0);
  const [viewMode, setViewMode] = useState<"total" | "month">("total");
  const [categories, setCategories] = useState(restaurant.menuCategorias);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const requiredItemFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [allowDineIn, setAllowDineIn] = useState(
    restaurant.allowDineIn ?? true
  );
  const [allowTakeaway, setAllowTakeaway] = useState(
    restaurant.allowTakeaway ?? true
  );
  const [lastSavedAllowDineIn, setLastSavedAllowDineIn] = useState(
    restaurant.allowDineIn ?? true
  );
  const [lastSavedAllowTakeaway, setLastSavedAllowTakeaway] = useState(
    restaurant.allowTakeaway ?? true
  );

  // Hook de notificações para o painel admin
  const {
    newOrderCount,
    markAsSeen,
    hasNewOrders: hasNewOrdersFromHook,
  } = useOrderNotifications({
    restaurantId: restaurant.id,
    currentOrderCount: orderCount,
    currentOrderIds: orderIds,
    enabled: isOpen,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [menuCategoryId, setMenuCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizes, setSizes] = useState<
    { id?: string; name: string; price: string }[]
  >([]);
  const [enableSizes, setEnableSizes] = useState(false);
  const [avatarImageUrl, setAvatarImageUrl] = useState(
    restaurant.avatarImageUrl
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    restaurant.avatarImageUrl
  );
  const [lastSavedAvatar, setLastSavedAvatar] = useState(
    restaurant.avatarImageUrl
  );
  const [deliveryFee, setDeliveryFee] = useState(restaurant.deliveryFee ?? 0);
  const [lastSavedDeliveryFee, setLastSavedDeliveryFee] = useState(
    restaurant.deliveryFee ?? 0
  );
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(
    restaurant.isOpen ?? true
  );
  const [, setLastSavedStatus] = useState(restaurant.isOpen ?? true);
  const [coverImageUrl, setCoverImageUrl] = useState(restaurant.coverImageUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    restaurant.coverImageUrl
  );
  const [lastSavedCover, setLastSavedCover] = useState(
    restaurant.coverImageUrl
  );
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingDeliveryFee, setIsSavingDeliveryFee] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithCategory | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    price?: string;
    menuCategoryId?: string;
    imageUrl?: string;
    sizes?: string;
  }>({});
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const [additionalCategoryId, setAdditionalCategoryId] = useState<
    string | null
  >(null);
  const [additionalName, setAdditionalName] = useState("");
  const [additionalPrice, setAdditionalPrice] = useState("");
  const [additionalImageUrl, setAdditionalImageUrl] = useState("");
  const [additionalImagePreview, setAdditionalImagePreview] = useState<
    string | null
  >(null);
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [isSavingAdditional, setIsSavingAdditional] = useState(false);
  const [editingAdditionalId, setEditingAdditionalId] = useState<string | null>(
    null
  );
  const [isDeletingAdditional, setIsDeletingAdditional] = useState<
    string | null
  >(null);
  const [additionalError, setAdditionalError] = useState<string | null>(null);
  const [requiredCategoryId, setRequiredCategoryId] = useState<string | null>(
    null
  );
  const [requiredGroupTitle, setRequiredGroupTitle] = useState("");
  const [requiredGroupQuantity, setRequiredGroupQuantity] = useState("");
  const [editingRequiredGroupId, setEditingRequiredGroupId] = useState<
    string | null
  >(null);
  const [requiredGroupError, setRequiredGroupError] = useState<string | null>(
    null
  );
  const [isSavingRequiredGroup, setIsSavingRequiredGroup] = useState(false);
  const [isDeletingRequiredGroup, setIsDeletingRequiredGroup] = useState<
    string | null
  >(null);
  const [requiredItemGroupId, setRequiredItemGroupId] = useState<
    string | null
  >(null);
  const [requiredItemName, setRequiredItemName] = useState("");
  const [requiredItemImageUrl, setRequiredItemImageUrl] = useState("");
  const [requiredItemImagePreview, setRequiredItemImagePreview] = useState<
    string | null
  >(null);
  const [editingRequiredItemId, setEditingRequiredItemId] = useState<
    string | null
  >(null);
  const [requiredItemError, setRequiredItemError] = useState<string | null>(
    null
  );
  const [isUploadingRequiredItem, setIsUploadingRequiredItem] = useState(false);
  const [isSavingRequiredItem, setIsSavingRequiredItem] = useState(false);
  const [isDeletingRequiredItem, setIsDeletingRequiredItem] = useState<
    string | null
  >(null);
  const [isSavingConsumptionMethods, setIsSavingConsumptionMethods] =
    useState(false);
  const [consumptionError, setConsumptionError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setImageUrl(data.url);
      setImagePreview(data.url);
      if (errors.imageUrl) {
        setErrors((prev) => ({ ...prev, imageUrl: undefined }));
      }
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setAvatarImageUrl(data.url);
      setAvatarPreview(data.url);
      setAvatarError(null);
      toast.success("Logo carregado com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setCoverImageUrl(data.url);
      setCoverPreview(data.url);
      setCoverError(null);
      toast.success("Capa carregada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAdditionalImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploadingAdditional(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setAdditionalImageUrl(data.url);
      setAdditionalImagePreview(data.url);
      setAdditionalError(null);
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploadingAdditional(false);
    }
  };

  const handleRequiredItemImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setIsUploadingRequiredItem(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setRequiredItemImageUrl(data.url);
      setRequiredItemImagePreview(data.url);
      setRequiredItemError(null);
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploadingRequiredItem(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const newErrors: {
      name?: string;
      description?: string;
      price?: string;
      menuCategoryId?: string;
      imageUrl?: string;
      sizes?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "O nome é obrigatório";
    }

    if (!description.trim()) {
      newErrors.description = "A descrição é obrigatória";
    }

    if (!price.trim()) {
      newErrors.price = "O preço é obrigatório";
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = "O preço deve ser um número válido maior que zero";
    }

    if (!menuCategoryId) {
      newErrors.menuCategoryId = "A categoria é obrigatória";
    }

    if (!imageUrl.trim()) {
      newErrors.imageUrl = "A imagem é obrigatória";
    }

    if (enableSizes && sizes.some((s) => !s.name.trim() || !s.price.trim())) {
      newErrors.sizes = "Preencha nome e preço para todos os tamanhos.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const ingredientsArray = ingredients
        .split(",")
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0);

      let result;
      if (editingProduct) {
        // Atualizar produto existente
        result = await updateProduct({
          id: editingProduct.id,
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsArray,
          menuCategoryId,
          restaurantId: restaurant.id,
          sizes: enableSizes
            ? sizes.map((size) => ({
                name: size.name.trim(),
                price: Number(size.price),
              }))
            : [],
        });
      } else {
        // Criar novo produto
        result = await createProduct({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsArray,
          menuCategoryId,
          restaurantId: restaurant.id,
          sizes: enableSizes
            ? sizes.map((size) => ({
                name: size.name.trim(),
                price: Number(size.price),
              }))
            : [],
        });
      }

      if (result.success) {
        toast.success(
          editingProduct
            ? "Produto atualizado com sucesso!"
            : "Produto criado com sucesso!"
        );
        // Limpar formulário
        setName("");
        setDescription("");
        setPrice("");
        setIngredients("");
        setMenuCategoryId("");
        setImageUrl("");
        setImagePreview(null);
        setSizes([]);
        setEnableSizes(false);
        setEditingProduct(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowAddProduct(false);
        // Recarregar a página para mostrar as mudanças
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao criar produto");
      }
    } catch {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowCustomers = async () => {
    setShowCustomers(true);
    setIsLoadingCustomers(true);

    try {
      const result = await getCustomers(restaurant.id);
      if (result.success) {
        setCustomers(result.customers);
        setTotalMonthRevenue(result.totalMonthRevenue || 0);
      } else {
        toast.error(result.error || "Erro ao carregar clientes");
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao buscar clientes");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleShowProducts = async () => {
    setShowManageProducts(true);
    setIsLoadingProducts(true);

    try {
      const result = await getProducts(restaurant.id);
      if (result.success && result.products) {
        setProducts(result.products);
      } else {
        toast.error(result.error || "Erro ao carregar produtos");
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao buscar produtos");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setIngredients(product.ingredients.join(", "));
    setMenuCategoryId(product.menuCategoryId);
    setImageUrl(product.imageUrl);
    setImagePreview(product.imageUrl);
    if (product.sizes && product.sizes.length > 0) {
      setEnableSizes(true);
      setSizes(
        product.sizes.map((size) => ({
          id: size.id,
          name: size.name,
          price: size.price.toString(),
        }))
      );
    } else {
      setEnableSizes(false);
      setSizes([]);
    }
    setShowManageProducts(false);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;

    setIsDeletingProduct(true);
    try {
      const result = await deleteProduct(deleteProductId, restaurant.id);
      if (result.success) {
        toast.success("Produto excluído com sucesso!");
        setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
        setDeleteProductId(null);
        // Recarregar a página para atualizar o menu
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao excluir produto");
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;

    setIsDeletingCategory(true);
    try {
      const result = await deleteCategory(deleteCategoryId, restaurant.id);
      if (result.success) {
        toast.success("Categoria excluída com sucesso!");
        setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryId));
        setDeleteCategoryId(null);
        // Recarregar a página para atualizar o menu
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao excluir categoria");
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleSaveConsumptionMethods = async () => {
    setConsumptionError(null);

    if (!allowDineIn && !allowTakeaway) {
      setConsumptionError("Selecione ao menos um método de consumo.");
      return;
    }

    setIsSavingConsumptionMethods(true);
    try {
      const result = await updateConsumptionMethods({
        restaurantId: restaurant.id,
        allowDineIn,
        allowTakeaway,
      });

      if (result.success && result.restaurant) {
        // && result.restaurant adicionado
        toast.success("Métodos de consumo atualizados!");
        setLastSavedAllowDineIn(result.restaurant.allowDineIn);
        setLastSavedAllowTakeaway(result.restaurant.allowTakeaway);
        setAllowDineIn(result.restaurant.allowDineIn);
        setAllowTakeaway(result.restaurant.allowTakeaway);
        setShowConsumptionMethods(false);
      } else {
        toast.error(result.error || "Erro ao atualizar métodos de consumo.");
      }
    } catch (error) {
      console.error("Erro ao salvar métodos de consumo:", error);
      toast.error("Erro ao salvar métodos de consumo.");
    } finally {
      setIsSavingConsumptionMethods(false);
    }
  };

  const handleSaveAvatar = async () => {
    setAvatarError(null);

    if (!avatarImageUrl.trim()) {
      setAvatarError("Selecione uma imagem para o logo.");
      return;
    }

    setIsSavingAvatar(true);
    try {
      const result = await updateRestaurantAvatar({
        restaurantId: restaurant.id,
        avatarImageUrl,
      });

      if (result.success && result.restaurant) {
        toast.success("Logo atualizado com sucesso!");
        setAvatarPreview(result.restaurant.avatarImageUrl);
        setAvatarImageUrl(result.restaurant.avatarImageUrl);
        setLastSavedAvatar(result.restaurant.avatarImageUrl);
        setShowUpdateAvatar(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao atualizar logo.");
      }
    } catch (error) {
      console.error("Erro ao atualizar logo:", error);
      toast.error("Erro ao atualizar logo.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleSaveDeliveryFee = async () => {
    setDeliveryFeeError(null);
    if (deliveryFee < 0) {
      setDeliveryFeeError("A taxa deve ser maior ou igual a zero.");
      return;
    }

    setIsSavingDeliveryFee(true);
    try {
      const result = await updateRestaurantDeliveryFee(
        restaurant.id,
        Number(deliveryFee)
      );
      if (result.success && result.restaurant) {
        setLastSavedDeliveryFee(result.restaurant.deliveryFee);
        setDeliveryFee(result.restaurant.deliveryFee);
        setShowUpdateDeliveryFee(false);
        toast.success("Taxa de entrega atualizada!");
      } else {
        setDeliveryFeeError(result.error || "Erro ao atualizar taxa.");
      }
    } catch (error) {
      console.error("Erro ao atualizar taxa:", error);
      setDeliveryFeeError("Erro ao atualizar taxa.");
    } finally {
      setIsSavingDeliveryFee(false);
    }
  };

  const handleToggleRestaurantStatus = async () => {
    setStatusError(null);
    const nextStatus = !isRestaurantOpen;
    setIsSavingStatus(true);
    try {
      const result = await updateRestaurantStatus({
        restaurantId: restaurant.id,
        isOpen: nextStatus,
      });

      if (result.success && result.restaurant) {
        setIsRestaurantOpen(result.restaurant.isOpen);
        setLastSavedStatus(result.restaurant.isOpen);
        toast.success(
          result.restaurant.isOpen
            ? "Restaurante aberto!"
            : "Restaurante fechado!"
        );
      } else {
        setStatusError(result.error || "Erro ao atualizar status.");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setStatusError("Erro ao atualizar status.");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveCover = async () => {
    setCoverError(null);

    if (!coverImageUrl.trim()) {
      setCoverError("Selecione uma imagem para a capa.");
      return;
    }

    setIsSavingCover(true);
    try {
      const result = await updateRestaurantCover({
        restaurantId: restaurant.id,
        coverImageUrl,
      });

      if (result.success && result.restaurant) {
        toast.success("Capa atualizada com sucesso!");
        setCoverPreview(result.restaurant.coverImageUrl);
        setCoverImageUrl(result.restaurant.coverImageUrl);
        setLastSavedCover(result.restaurant.coverImageUrl);
        setShowUpdateCover(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao atualizar capa.");
      }
    } catch (error) {
      console.error("Erro ao atualizar capa:", error);
      toast.error("Erro ao atualizar capa.");
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCategoryError(undefined);

    if (!categoryName.trim()) {
      setCategoryError("O nome da categoria é obrigatório");
      return;
    }

    setIsLoadingCategory(true);

    try {
      const result = await createCategory({
        name: categoryName.trim(),
        restaurantId: restaurant.id,
      });

      if (result.success && result.category) {
        toast.success("Categoria criada com sucesso!");
        // Adicionar nova categoria à lista local
        setCategories((prev) => [
          ...prev,
          {
            ...result.category,
            additionals: [],
            requiredAdditionalGroups: [],
          },
        ]);
        setCategoryName("");
        setShowAddCategory(false);
      } else {
        toast.error(result.error || "Erro ao criar categoria");
      }
    } catch {
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const resetRequiredGroupForm = () => {
    setRequiredGroupTitle("");
    setRequiredGroupQuantity("");
    setEditingRequiredGroupId(null);
    setRequiredGroupError(null);
  };

  const resetRequiredItemForm = () => {
    setRequiredItemGroupId(null);
    setRequiredItemName("");
    setRequiredItemImageUrl("");
    setRequiredItemImagePreview(null);
    setEditingRequiredItemId(null);
    setRequiredItemError(null);
    if (requiredItemFileInputRef.current) {
      requiredItemFileInputRef.current.value = "";
    }
  };

  const resetRequiredForms = () => {
    setRequiredCategoryId(null);
    resetRequiredGroupForm();
    resetRequiredItemForm();
  };

  const resetAdditionalForm = () => {
    setAdditionalCategoryId(null);
    setAdditionalName("");
    setAdditionalPrice("");
    setAdditionalImageUrl("");
    setAdditionalImagePreview(null);
    setEditingAdditionalId(null);
    setAdditionalError(null);
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = "";
    }
  };

  const handleStartAdditional = (
    categoryId: string,
    additional?: CategoryAdditional
  ) => {
    setAdditionalCategoryId(categoryId);
    setEditingAdditionalId(additional?.id ?? null);
    setAdditionalName(additional?.name ?? "");
    setAdditionalPrice(additional ? String(additional.price) : "");
    setAdditionalImageUrl(additional?.imageUrl ?? "");
    setAdditionalImagePreview(additional?.imageUrl ?? null);
    setAdditionalError(null);
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = "";
    }
  };

  const handleSubmitAdditional = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setAdditionalError(null);

    if (!additionalCategoryId) {
      setAdditionalError("Selecione uma categoria.");
      return;
    }

    if (
      !additionalName.trim() ||
      !additionalPrice.trim() ||
      !additionalImageUrl.trim()
    ) {
      setAdditionalError("Nome, preço e imagem são obrigatórios.");
      return;
    }

    const parsedPrice = Number(additionalPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setAdditionalError("Informe um preço válido para o adicional.");
      return;
    }

    setIsSavingAdditional(true);
    try {
      if (editingAdditionalId) {
        const result = await updateAdditional({
          additionalId: editingAdditionalId,
          restaurantId: restaurant.id,
          name: additionalName.trim(),
          price: parsedPrice,
          imageUrl: additionalImageUrl.trim(),
        });
        if (result.success && result.additional) {
          toast.success("Adicional atualizado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === additionalCategoryId
                ? {
                    ...category,
                    additionals: category.additionals.map((item) =>
                      item.id === editingAdditionalId
                        ? result.additional!
                        : item
                    ),
                  }
                : category
            )
          );
          resetAdditionalForm();
        } else {
          toast.error(result.error || "Erro ao atualizar adicional");
        }
      } else {
        const result = await createAdditional({
          restaurantId: restaurant.id,
          menuCategoryId: additionalCategoryId,
          name: additionalName.trim(),
          price: parsedPrice,
          imageUrl: additionalImageUrl.trim(),
        });
        if (result.success && result.additional) {
          toast.success("Adicional criado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === additionalCategoryId
                ? {
                    ...category,
                    additionals: [
                      ...(category.additionals || []),
                      result.additional!,
                    ],
                  }
                : category
            )
          );
          resetAdditionalForm();
        } else {
          toast.error(result.error || "Erro ao criar adicional");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar adicional:", error);
      toast.error("Erro ao salvar adicional");
    } finally {
      setIsSavingAdditional(false);
    }
  };

  const handleDeleteAdditional = async (
    additionalId: string,
    categoryId: string
  ) => {
    setIsDeletingAdditional(additionalId);
    try {
      const result = await deleteAdditional(additionalId, restaurant.id);
      if (result.success) {
        toast.success("Adicional removido!");
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  additionals: category.additionals.filter(
                    (item) => item.id !== additionalId
                  ),
                }
              : category
          )
        );
        if (editingAdditionalId === additionalId) {
          resetAdditionalForm();
        }
      } else {
        toast.error(result.error || "Erro ao remover adicional");
      }
    } catch (error) {
      console.error("Erro ao remover adicional:", error);
      toast.error("Erro ao remover adicional");
    } finally {
      setIsDeletingAdditional(null);
    }
  };

  const handleStartRequiredGroup = (
    categoryId: string,
    group?: RequiredAdditionalGroup
  ) => {
    setRequiredCategoryId(categoryId);
    setEditingRequiredGroupId(group?.id ?? null);
    setRequiredGroupTitle(group?.title ?? "");
    setRequiredGroupQuantity(
      group?.requiredQuantity ? String(group.requiredQuantity) : ""
    );
    setRequiredGroupError(null);
  };

  const handleSubmitRequiredGroup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setRequiredGroupError(null);

    if (!requiredCategoryId) {
      setRequiredGroupError("Selecione uma categoria.");
      return;
    }

    if (!requiredGroupTitle.trim() || !requiredGroupQuantity.trim()) {
      setRequiredGroupError("Título e quantidade são obrigatórios.");
      return;
    }

    const parsedQuantity = Number(requiredGroupQuantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setRequiredGroupError("Informe uma quantidade obrigatória válida.");
      return;
    }

    setIsSavingRequiredGroup(true);
    try {
      if (editingRequiredGroupId) {
        const result = await updateRequiredAdditionalGroup({
          restaurantId: restaurant.id,
          groupId: editingRequiredGroupId,
          title: requiredGroupTitle.trim(),
          requiredQuantity: parsedQuantity,
        });
        if (result.success && result.group) {
          toast.success("Grupo obrigatório atualizado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === requiredCategoryId
                ? {
                    ...category,
                    requiredAdditionalGroups:
                      category.requiredAdditionalGroups.map((group) =>
                        group.id === editingRequiredGroupId
                          ? {
                              ...group,
                              title: result.group!.title,
                              requiredQuantity: result.group!.requiredQuantity,
                            }
                          : group
                      ),
                  }
                : category
            )
          );
          resetRequiredGroupForm();
        } else {
          toast.error(result.error || "Erro ao atualizar grupo obrigatório");
        }
      } else {
        const result = await createRequiredAdditionalGroup({
          restaurantId: restaurant.id,
          menuCategoryId: requiredCategoryId,
          title: requiredGroupTitle.trim(),
          requiredQuantity: parsedQuantity,
        });
        if (result.success && result.group) {
          toast.success("Grupo obrigatório criado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === requiredCategoryId
                ? {
                    ...category,
                    requiredAdditionalGroups: [
                      ...(category.requiredAdditionalGroups || []),
                      { ...result.group!, items: [] },
                    ],
                  }
                : category
            )
          );
          resetRequiredGroupForm();
        } else {
          toast.error(result.error || "Erro ao criar grupo obrigatório");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar grupo obrigatório:", error);
      toast.error("Erro ao salvar grupo obrigatório");
    } finally {
      setIsSavingRequiredGroup(false);
    }
  };

  const handleDeleteRequiredGroup = async (
    groupId: string,
    categoryId: string
  ) => {
    setIsDeletingRequiredGroup(groupId);
    try {
      const result = await deleteRequiredAdditionalGroup(groupId, restaurant.id);
      if (result.success) {
        toast.success("Grupo obrigatório removido!");
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  requiredAdditionalGroups:
                    category.requiredAdditionalGroups.filter(
                      (group) => group.id !== groupId
                    ),
                }
              : category
          )
        );
        if (editingRequiredGroupId === groupId) {
          resetRequiredGroupForm();
        }
        if (requiredItemGroupId === groupId) {
          resetRequiredItemForm();
        }
      } else {
        toast.error(result.error || "Erro ao remover grupo obrigatório");
      }
    } catch (error) {
      console.error("Erro ao remover grupo obrigatório:", error);
      toast.error("Erro ao remover grupo obrigatório");
    } finally {
      setIsDeletingRequiredGroup(null);
    }
  };

  const handleStartRequiredItem = (
    categoryId: string,
    groupId: string,
    item?: RequiredAdditionalItem
  ) => {
    setRequiredCategoryId(categoryId);
    setRequiredItemGroupId(groupId);
    setEditingRequiredItemId(item?.id ?? null);
    setRequiredItemName(item?.name ?? "");
    setRequiredItemImageUrl(item?.imageUrl ?? "");
    setRequiredItemImagePreview(item?.imageUrl ?? null);
    setRequiredItemError(null);
    if (requiredItemFileInputRef.current) {
      requiredItemFileInputRef.current.value = "";
    }
  };

  const handleSubmitRequiredItem = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setRequiredItemError(null);

    if (!requiredCategoryId) {
      setRequiredItemError("Selecione uma categoria.");
      return;
    }

    if (!requiredItemGroupId) {
      setRequiredItemError("Selecione um grupo obrigatório.");
      return;
    }

    if (!requiredItemName.trim() || !requiredItemImageUrl.trim()) {
      setRequiredItemError("Nome e imagem são obrigatórios.");
      return;
    }

    setIsSavingRequiredItem(true);
    try {
      if (editingRequiredItemId) {
        const result = await updateRequiredAdditionalItem({
          restaurantId: restaurant.id,
          itemId: editingRequiredItemId,
          name: requiredItemName.trim(),
          imageUrl: requiredItemImageUrl.trim(),
        });
        if (result.success && result.item) {
          toast.success("Item obrigatório atualizado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === requiredCategoryId
                ? {
                    ...category,
                    requiredAdditionalGroups:
                      category.requiredAdditionalGroups.map((group) =>
                        group.id === requiredItemGroupId
                          ? {
                              ...group,
                              items: group.items.map((item) =>
                                item.id === editingRequiredItemId
                                  ? result.item!
                                  : item
                              ),
                            }
                          : group
                      ),
                  }
                : category
            )
          );
          resetRequiredItemForm();
        } else {
          toast.error(result.error || "Erro ao atualizar item obrigatório");
        }
      } else {
        const result = await createRequiredAdditionalItem({
          restaurantId: restaurant.id,
          groupId: requiredItemGroupId,
          name: requiredItemName.trim(),
          imageUrl: requiredItemImageUrl.trim(),
        });
        if (result.success && result.item) {
          toast.success("Item obrigatório criado!");
          setCategories((prev) =>
            prev.map((category) =>
              category.id === requiredCategoryId
                ? {
                    ...category,
                    requiredAdditionalGroups:
                      category.requiredAdditionalGroups.map((group) =>
                        group.id === requiredItemGroupId
                          ? {
                              ...group,
                              items: [...group.items, result.item!],
                            }
                          : group
                      ),
                  }
                : category
            )
          );
          resetRequiredItemForm();
        } else {
          toast.error(result.error || "Erro ao criar item obrigatório");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar item obrigatório:", error);
      toast.error("Erro ao salvar item obrigatório");
    } finally {
      setIsSavingRequiredItem(false);
    }
  };

  const handleDeleteRequiredItem = async (
    itemId: string,
    categoryId: string,
    groupId: string
  ) => {
    setIsDeletingRequiredItem(itemId);
    try {
      const result = await deleteRequiredAdditionalItem(itemId, restaurant.id);
      if (result.success) {
        toast.success("Item obrigatório removido!");
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  requiredAdditionalGroups:
                    category.requiredAdditionalGroups.map((group) =>
                      group.id === groupId
                        ? {
                            ...group,
                            items: group.items.filter(
                              (item) => item.id !== itemId
                            ),
                          }
                        : group
                    ),
                }
              : category
          )
        );
        if (editingRequiredItemId === itemId) {
          resetRequiredItemForm();
        }
      } else {
        toast.error(result.error || "Erro ao remover item obrigatório");
      }
    } catch (error) {
      console.error("Erro ao remover item obrigatório:", error);
      toast.error("Erro ao remover item obrigatório");
    } finally {
      setIsDeletingRequiredItem(null);
    }
  };

  const handleShowOrders = async () => {
    // Marcar pedidos como vistos quando abrir a seção de pedidos
    markAsSeen();
    setShowOrders(true);
    setIsLoadingOrders(true);
    setHasNewOrders(false);

    try {
      const result = await getOrders(restaurant.id);
      if (result.success && result.orders) {
        setOrders(result.orders);
        setLastOrderCount(result.orders.length);
        // Atualizar IDs dos pedidos para o hook
        setOrderIds(result.orders.map((order) => order.id));
        setOrderCount(result.orders.length);
      } else {
        toast.error(result.error || "Erro ao carregar pedidos");
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast.error("Erro ao buscar pedidos");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: OrderStatus
  ) => {
    setIsUpdatingStatus(orderId);
    try {
      const result = await updateOrderStatus(orderId, restaurant.id, newStatus);
      if (result.success) {
        toast.success("Status do pedido atualizado com sucesso!");
        // Atualizar o pedido na lista local
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        toast.error(result.error || "Erro ao atualizar status do pedido");
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      toast.error("Erro ao atualizar status do pedido");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Buscar contador de pedidos quando o painel abrir
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrderCount = async () => {
      try {
        const result = await getOrdersCount(restaurant.id);
        if (result.success) {
          setOrderCount(result.count);
          setOrderIds(result.orderIds);
        }
      } catch (error) {
        console.error("Erro ao buscar contador de pedidos:", error);
      }
    };

    // Buscar imediatamente quando abrir
    fetchOrderCount();

    // Buscar a cada 30 segundos enquanto o painel estiver aberto
    const interval = setInterval(fetchOrderCount, 30000);

    return () => clearInterval(interval);
  }, [isOpen, restaurant.id]);

  // Polling para verificar novos pedidos (quando a seção de pedidos estiver aberta)
  useEffect(() => {
    if (!isOpen || !showOrders) return;

    const interval = setInterval(async () => {
      try {
        const result = await getOrders(restaurant.id);
        if (result.success && result.orders) {
          const newCount = result.orders.length;
          if (newCount > lastOrderCount) {
            setHasNewOrders(true);
            toast.info(`Novo pedido recebido! Total: ${newCount}`);
            setOrders(result.orders);
            setLastOrderCount(newCount);
            // Atualizar IDs dos pedidos para o hook
            setOrderIds(result.orders.map((order) => order.id));
            setOrderCount(result.orders.length);
          } else {
            setOrders(result.orders);
            // Atualizar IDs dos pedidos mesmo sem novos pedidos
            setOrderIds(result.orders.map((order) => order.id));
            setOrderCount(result.orders.length);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar novos pedidos:", error);
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  }, [isOpen, showOrders, restaurant.id, lastOrderCount]);

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "Pendente";
      case "IN_PREPARATION":
        return "Em Preparo";
      case "FINISHED":
        return "Finalizado";
      case "OUT_FOR_DELIVERY":
        return "Enviado para Entrega";
      default:
        return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "IN_PREPARATION":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "FINISHED":
        return "bg-green-100 text-green-800 border-green-300";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const isToday = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  const selectedAdditionalCategory = categories.find(
    (category) => category.id === additionalCategoryId
  );
  const selectedAdditionals = selectedAdditionalCategory?.additionals ?? [];
  const selectedRequiredCategory = categories.find(
    (category) => category.id === requiredCategoryId
  );
  const selectedRequiredGroups =
    selectedRequiredCategory?.requiredAdditionalGroups ?? [];
  const selectedRequiredGroup = selectedRequiredGroups.find(
    (group) => group.id === requiredItemGroupId
  );
  const selectedRequiredItems = selectedRequiredGroup?.items ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90%] lg:min-w-[40%]">
        <SheetHeader>
          <SheetTitle className="text-start text-lg sm:text-xl">
            Painel Admin
          </SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="py-4 sm:py-5 flex flex-col h-full">
          {!showAddProduct &&
          !showAddCategory &&
          !showAddAdditional &&
          !showCustomers &&
          !showManageProducts &&
          !showManageCategories &&
          !showOrders &&
          !showConsumptionMethods &&
          !showUpdateAvatar &&
          !showUpdateCover &&
          !showUpdateDeliveryFee ? (
            <div className="flex-auto flex flex-col gap-3 sm:gap-4">
              <Button
                onClick={() => setShowAddCategory(true)}
                className="w-full text-sm sm:text-base"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Categoria
              </Button>
              <Button
                onClick={() => setShowAddProduct(true)}
                className="w-full text-sm sm:text-base"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
              <Button
                onClick={() => {
                  resetAdditionalForm();
                  resetRequiredForms();
                  setShowAddAdditional(true);
                }}
                className="w-full text-sm sm:text-base"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Adicional
              </Button>
              <Button
                onClick={handleToggleRestaurantStatus}
                className={`w-full text-sm sm:text-base ${isRestaurantOpen ? "bg-green-500 hover:bg-green-400" : ""}`}
                variant={isRestaurantOpen ? "outline" : "destructive"}
                size="lg"
                disabled={isSavingStatus}
              >
                <ClockIcon className="mr-2 h-4 w-4" />
                {isSavingStatus
                  ? "Atualizando..."
                  : isRestaurantOpen
                    ? "Marcar como fechado"
                    : "Marcar como aberto"}
              </Button>
              {statusError && (
                <p className="text-xs text-destructive">{statusError}</p>
              )}
              <Button
                onClick={handleShowProducts}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                Gerenciar Produtos
              </Button>
              <Button
                onClick={() => setShowManageCategories(true)}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                Gerenciar Categorias
              </Button>
              <Button
                onClick={() => setShowConsumptionMethods(true)}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Métodos de Consumo
              </Button>
              <Button
                onClick={() => setShowUpdateAvatar(true)}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Alterar logo
              </Button>
              <Button
                onClick={() => setShowUpdateDeliveryFee(true)}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                Taxa de entrega
              </Button>

              <Button
                onClick={() => setShowUpdateCover(true)}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Alterar capa
              </Button>

              <Button
                onClick={handleShowCustomers}
                className="w-full text-sm sm:text-base"
                variant="outline"
                size="lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Clientes
              </Button>
              <Button
                onClick={handleShowOrders}
                className="w-full text-sm sm:text-base relative"
                variant="outline"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                Pedidos
                {hasNewOrdersFromHook && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {newOrderCount > 9 ? "9+" : newOrderCount}
                  </span>
                )}
              </Button>
              <div className="mt-auto pt-4 border-t">
                <Button
                  onClick={async () => {
                    const result = await logout();
                    if (result.success) {
                      router.push("/");
                    } else {
                      toast.error("Erro ao fazer logout");
                    }
                  }}
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          ) : showAddCategory ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">
                    Adicionar Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCategorySubmit}>
                    <div className="space-y-2">
                      <Label
                        htmlFor="categoryName"
                        className="text-sm sm:text-base"
                      >
                        Nome da Categoria
                      </Label>
                      <Input
                        id="categoryName"
                        type="text"
                        placeholder="Digite o nome da categoria"
                        className={`text-sm sm:text-base ${
                          categoryError ? "border-destructive" : ""
                        }`}
                        value={categoryName}
                        onChange={(e) => {
                          setCategoryName(e.target.value);
                          if (categoryError) {
                            setCategoryError(undefined);
                          }
                        }}
                        disabled={isLoadingCategory}
                      />
                      {categoryError && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {categoryError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-sm sm:text-base"
                        onClick={() => {
                          setShowAddCategory(false);
                          setCategoryName("");
                          setCategoryError(undefined);
                        }}
                        disabled={isLoadingCategory}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 text-sm sm:text-base"
                        disabled={isLoadingCategory}
                      >
                        {isLoadingCategory ? "Criando..." : "Criar Categoria"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : showUpdateAvatar ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Alterar logo
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowUpdateAvatar(false);
                        setAvatarError(null);
                        setAvatarImageUrl(lastSavedAvatar);
                        setAvatarPreview(lastSavedAvatar);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Atualize a logo (avatar) exibida nas telas do restaurante.
                    Use uma imagem quadrada para melhor resultado.
                  </p>

                  <input
                    ref={avatarFileInputRef}
                    id="restaurantAvatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                    disabled={isUploadingAvatar || isSavingAvatar}
                  />

                  {avatarPreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarPreview}
                        alt="Logo do restaurante"
                        className="h-32 sm:h-40 w-full rounded-md object-cover"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 text-sm sm:text-base"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar || isSavingAvatar}
                        >
                          {isUploadingAvatar
                            ? "Carregando..."
                            : "Trocar imagem"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="flex-1 text-sm sm:text-base"
                          onClick={() => {
                            setAvatarImageUrl("");
                            setAvatarPreview(null);
                            setAvatarError(null);
                            if (avatarFileInputRef.current) {
                              avatarFileInputRef.current.value = "";
                            }
                          }}
                          disabled={isUploadingAvatar || isSavingAvatar}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-sm sm:text-base"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar || isSavingAvatar}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {isUploadingAvatar ? "Carregando..." : "Selecionar logo"}
                    </Button>
                  )}

                  {avatarError && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {avatarError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-sm sm:text-base"
                      onClick={() => {
                        setAvatarImageUrl(lastSavedAvatar);
                        setAvatarPreview(lastSavedAvatar);
                        setAvatarError(null);
                      }}
                      disabled={isSavingAvatar}
                    >
                      Desfazer alterações
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 text-sm sm:text-base"
                      onClick={handleSaveAvatar}
                      disabled={isSavingAvatar || isUploadingAvatar}
                    >
                      {isSavingAvatar ? "Salvando..." : "Salvar logo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : showUpdateCover ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Alterar capa
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowUpdateCover(false);
                        setCoverError(null);
                        setCoverImageUrl(lastSavedCover);
                        setCoverPreview(lastSavedCover);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Atualize a imagem de capa exibida no topo do menu. Prefira
                    imagens horizontais.
                  </p>

                  <input
                    ref={coverFileInputRef}
                    id="restaurantCover"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                    disabled={isUploadingCover || isSavingCover}
                  />

                  {coverPreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview}
                        alt="Capa do restaurante"
                        className="h-40 sm:h-52 w-full rounded-md object-cover"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 text-sm sm:text-base"
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUploadingCover || isSavingCover}
                        >
                          {isUploadingCover ? "Carregando..." : "Trocar imagem"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="flex-1 text-sm sm:text-base"
                          onClick={() => {
                            setCoverImageUrl("");
                            setCoverPreview(null);
                            setCoverError(null);
                            if (coverFileInputRef.current) {
                              coverFileInputRef.current.value = "";
                            }
                          }}
                          disabled={isUploadingCover || isSavingCover}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-sm sm:text-base"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={isUploadingCover || isSavingCover}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {isUploadingCover ? "Carregando..." : "Selecionar capa"}
                    </Button>
                  )}

                  {coverError && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {coverError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-sm sm:text-base"
                      onClick={() => {
                        setCoverImageUrl(lastSavedCover);
                        setCoverPreview(lastSavedCover);
                        setCoverError(null);
                      }}
                      disabled={isSavingCover}
                    >
                      Desfazer alterações
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 text-sm sm:text-base"
                      onClick={handleSaveCover}
                      disabled={isSavingCover || isUploadingCover}
                    >
                      {isSavingCover ? "Salvando..." : "Salvar capa"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : showUpdateDeliveryFee ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Taxa de entrega
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowUpdateDeliveryFee(false);
                        setDeliveryFee(lastSavedDeliveryFee);
                        setDeliveryFeeError(null);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Defina a taxa de entrega aplicada a pedidos de entrega.
                  </p>
                  <div className="space-y-2">
                    <Label
                      htmlFor="deliveryFee"
                      className="text-sm sm:text-base"
                    >
                      Taxa (R$)
                    </Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      value={deliveryFee}
                      onChange={(e) => {
                        setDeliveryFee(Number(e.target.value));
                        setDeliveryFeeError(null);
                      }}
                      className={deliveryFeeError ? "border-destructive" : ""}
                      disabled={isSavingDeliveryFee}
                    />
                    {deliveryFeeError && (
                      <p className="text-xs sm:text-sm text-destructive">
                        {deliveryFeeError}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-sm sm:text-base"
                      onClick={() => {
                        setDeliveryFee(lastSavedDeliveryFee);
                        setDeliveryFeeError(null);
                      }}
                      disabled={isSavingDeliveryFee}
                    >
                      Desfazer alterações
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 text-sm sm:text-base"
                      onClick={handleSaveDeliveryFee}
                      disabled={isSavingDeliveryFee}
                    >
                      {isSavingDeliveryFee ? "Salvando..." : "Salvar taxa"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : showConsumptionMethods ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Métodos de Consumo
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowConsumptionMethods(false);
                        setConsumptionError(null);
                        setAllowDineIn(lastSavedAllowDineIn);
                        setAllowTakeaway(lastSavedAllowTakeaway);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-5">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Escolha quais métodos de consumo o restaurante aceita no
                      momento. Pelo menos um precisa estar habilitado.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Button
                        type="button"
                        variant={allowDineIn ? "default" : "outline"}
                        size="lg"
                        className="justify-start text-sm sm:text-base"
                        onClick={() => {
                          setAllowDineIn((prev) => !prev);
                          setConsumptionError(null);
                        }}
                        disabled={isSavingConsumptionMethods}
                      >
                        <UtensilsCrossed className="mr-2 h-4 w-4" />
                        Comer no local
                      </Button>
                      <Button
                        type="button"
                        variant={allowTakeaway ? "default" : "outline"}
                        size="lg"
                        className="justify-start text-sm sm:text-base"
                        onClick={() => {
                          setAllowTakeaway((prev) => !prev);
                          setConsumptionError(null);
                        }}
                        disabled={isSavingConsumptionMethods}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Entrega
                      </Button>
                    </div>
                    {consumptionError && (
                      <p className="text-xs sm:text-sm text-destructive">
                        {consumptionError}
                      </p>
                    )}
                    <div className="pt-2">
                      <Button
                        type="button"
                        className="flex-1 w-full text-sm sm:text-base"
                        onClick={handleSaveConsumptionMethods}
                        disabled={isSavingConsumptionMethods}
                      >
                        {isSavingConsumptionMethods
                          ? "Salvando..."
                          : "Salvar métodos"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : showCustomers ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Clientes
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowCustomers(false);
                        setCustomers([]);
                        setTotalMonthRevenue(0);
                        setViewMode("total");
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Carregando clientes...
                      </p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nenhum cliente encontrado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Seletor de visualização e total do mês */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-muted rounded-lg">
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant={
                              viewMode === "total" ? "default" : "outline"
                            }
                            size="sm"
                            className="flex-1 sm:flex-initial text-xs sm:text-sm"
                            onClick={() => setViewMode("total")}
                          >
                            Total Ganho
                          </Button>
                          <Button
                            type="button"
                            variant={
                              viewMode === "month" ? "default" : "outline"
                            }
                            size="sm"
                            className="flex-1 sm:flex-initial text-xs sm:text-sm"
                            onClick={() => setViewMode("month")}
                          >
                            Total do Mês
                          </Button>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="text-xs text-muted-foreground">
                            Total ganho
                            {viewMode === "month" ? " no mês" : ""}:
                          </p>
                          <p className="font-semibold text-base sm:text-lg">
                            {formatCurrency(totalMonthRevenue)}
                          </p>
                        </div>
                      </div>

                      {/* Lista de clientes */}
                      <div className="space-y-2 sm:space-y-3">
                        {customers.map((customer, index) => (
                          <div
                            key={`${customer.cpf}-${index}`}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 border rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {customer.name}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {formatCpf(customer.cpf)}
                              </p>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <p className="font-semibold text-sm sm:text-base">
                                {formatCurrency(
                                  viewMode === "total"
                                    ? customer.totalSpent
                                    : customer.totalSpentThisMonth
                                )}
                              </p>
                              {viewMode === "month" &&
                                customer.totalSpentThisMonth === 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    Sem pedidos este mês
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : showAddProduct ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      {editingProduct ? "Editar Produto" : "Adicionar Produto"}
                    </CardTitle>
                    {editingProduct && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          setEditingProduct(null);
                          setName("");
                          setDescription("");
                          setPrice("");
                          setIngredients("");
                          setMenuCategoryId("");
                          setImageUrl("");
                          setImagePreview(null);
                          setErrors({});
                        }}
                      >
                        Novo Produto
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-3 sm:space-y-4"
                    onSubmit={handleSubmit}
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="category"
                        className="text-sm sm:text-base"
                      >
                        Categoria
                      </Label>
                      <Select
                        value={menuCategoryId}
                        onValueChange={(value) => {
                          setMenuCategoryId(value);
                          if (errors.menuCategoryId) {
                            setErrors((prev) => ({
                              ...prev,
                              menuCategoryId: undefined,
                            }));
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger
                          className={`text-sm sm:text-base ${
                            errors.menuCategoryId ? "border-destructive" : ""
                          }`}
                        >
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.menuCategoryId && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {errors.menuCategoryId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm sm:text-base">
                        Nome
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Digite o nome do produto"
                        className={`text-sm sm:text-base ${
                          errors.name ? "border-destructive" : ""
                        }`}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) {
                            setErrors((prev) => ({ ...prev, name: undefined }));
                          }
                        }}
                        disabled={isLoading}
                      />
                      {errors.name && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm sm:text-base"
                      >
                        Descrição
                      </Label>
                      <Input
                        id="description"
                        type="text"
                        placeholder="Digite a descrição do produto"
                        className={`text-sm sm:text-base ${
                          errors.description ? "border-destructive" : ""
                        }`}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          if (errors.description) {
                            setErrors((prev) => ({
                              ...prev,
                              description: undefined,
                            }));
                          }
                        }}
                        disabled={isLoading}
                      />
                      {errors.description && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm sm:text-base">
                        Preço
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={`text-sm sm:text-base ${
                          errors.price ? "border-destructive" : ""
                        }`}
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          if (errors.price) {
                            setErrors((prev) => ({
                              ...prev,
                              price: undefined,
                            }));
                          }
                        }}
                        disabled={isLoading}
                      />
                      {errors.price && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="ingredients"
                        className="text-sm sm:text-base"
                      >
                        Ingredientes (separados por vírgula)
                      </Label>
                      <Input
                        id="ingredients"
                        type="text"
                        placeholder="Ex: tomate, alface, queijo"
                        className="text-sm sm:text-base"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">Opcional</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        Tamanhos (opcional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={enableSizes ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setEnableSizes((prev) => !prev);
                            setSizes([]);
                            setErrors((prev) => ({
                              ...prev,
                              sizes: undefined,
                            }));
                          }}
                          disabled={isLoading}
                        >
                          {enableSizes
                            ? "Remover tamanhos"
                            : "Adicionar tamanhos"}
                        </Button>
                        {errors.sizes && (
                          <p className="text-xs text-destructive">
                            {errors.sizes}
                          </p>
                        )}
                      </div>

                      {enableSizes && (
                        <div className="space-y-3">
                          {sizes.map((size, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-5 gap-2 items-center"
                            >
                              <Input
                                placeholder="Nome"
                                value={size.name}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSizes((prev) =>
                                    prev.map((s, i) =>
                                      i === index ? { ...s, name: value } : s
                                    )
                                  );
                                }}
                                className="col-span-2 text-sm sm:text-base"
                                disabled={isLoading}
                              />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Preço"
                                value={size.price}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSizes((prev) =>
                                    prev.map((s, i) =>
                                      i === index ? { ...s, price: value } : s
                                    )
                                  );
                                }}
                                className="col-span-2 text-sm sm:text-base"
                                disabled={isLoading}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setSizes((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                                disabled={isLoading}
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSizes((prev) => [
                                ...prev,
                                { name: "", price: "" },
                              ])
                            }
                            disabled={isLoading}
                          >
                            Adicionar tamanho
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="productImage"
                        className="text-sm sm:text-base"
                      >
                        Foto do Produto
                      </Label>
                      <input
                        ref={fileInputRef}
                        id="productImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isLoading || isUploading}
                      />
                      <div className="space-y-2">
                        {imagePreview ? (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-32 sm:h-40 w-full rounded-md object-cover"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full text-sm sm:text-base"
                              onClick={() => {
                                setImageUrl("");
                                setImagePreview(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              disabled={isLoading || isUploading}
                            >
                              Remover Imagem
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full text-sm sm:text-base"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {isUploading
                              ? "Carregando..."
                              : "Selecionar da Galeria"}
                          </Button>
                        )}
                      </div>
                      {errors.imageUrl && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {errors.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-sm sm:text-base"
                        onClick={() => {
                          setShowAddProduct(false);
                          setName("");
                          setDescription("");
                          setPrice("");
                          setIngredients("");
                          setMenuCategoryId("");
                          setImageUrl("");
                          setImagePreview(null);
                          setErrors({});
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? editingProduct
                            ? "Atualizando..."
                            : "Criando..."
                          : editingProduct
                            ? "Atualizar Produto"
                            : "Criar Produto"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : showAddAdditional ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      {editingAdditionalId
                        ? "Editar Adicional"
                        : "Adicionar Adicional"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {editingAdditionalId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={resetAdditionalForm}
                        >
                          Novo
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          resetAdditionalForm();
                          resetRequiredForms();
                          setShowAddAdditional(false);
                        }}
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-3 sm:space-y-4"
                    onSubmit={handleSubmitAdditional}
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="additional-category"
                        className="text-sm sm:text-base"
                      >
                        Categoria
                      </Label>
                      <Select
                        value={additionalCategoryId ?? ""}
                        onValueChange={(value) => {
                          setAdditionalCategoryId(value);
                          if (additionalError) {
                            setAdditionalError(null);
                          }
                        }}
                        disabled={isSavingAdditional || !!editingAdditionalId}
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="additional-name"
                        className="text-sm sm:text-base"
                      >
                        Nome
                      </Label>
                      <Input
                        id="additional-name"
                        placeholder="Nome do adicional"
                        value={additionalName}
                        onChange={(e) => {
                          setAdditionalName(e.target.value);
                          if (additionalError) {
                            setAdditionalError(null);
                          }
                        }}
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="additional-price"
                          className="text-sm sm:text-base"
                        >
                          Preço
                        </Label>
                        <Input
                          id="additional-price"
                          placeholder="0,00"
                          type="number"
                          step="0.01"
                          value={additionalPrice}
                          onChange={(e) => {
                            setAdditionalPrice(e.target.value);
                            if (additionalError) {
                              setAdditionalError(null);
                            }
                          }}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="additional-image-file"
                          className="text-sm sm:text-base"
                        >
                          Imagem
                        </Label>
                        <input
                          ref={additionalFileInputRef}
                          id="additional-image-file"
                          type="file"
                          accept="image/*"
                          onChange={handleAdditionalImageSelect}
                          className="hidden"
                          disabled={isSavingAdditional || isUploadingAdditional}
                        />
                        <div className="space-y-2">
                          {additionalImagePreview ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={additionalImagePreview}
                                alt="Preview"
                                className="h-24 w-full rounded-md object-cover"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full text-xs sm:text-sm"
                                onClick={() => {
                                  setAdditionalImageUrl("");
                                  setAdditionalImagePreview(null);
                                  if (additionalFileInputRef.current) {
                                    additionalFileInputRef.current.value = "";
                                  }
                                }}
                                disabled={
                                  isSavingAdditional || isUploadingAdditional
                                }
                              >
                                Remover Imagem
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full text-xs sm:text-sm"
                              onClick={() =>
                                additionalFileInputRef.current?.click()
                              }
                              disabled={
                                isSavingAdditional || isUploadingAdditional
                              }
                            >
                              <ImageIcon className="mr-2 h-4 w-4" />
                              {isUploadingAdditional
                                ? "Carregando..."
                                : "Selecionar da Galeria"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {additionalError && (
                      <p className="text-xs sm:text-sm text-destructive">
                        {additionalError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full rounded-full"
                      disabled={isSavingAdditional || isUploadingAdditional}
                    >
                      {isSavingAdditional
                        ? "Salvando..."
                        : editingAdditionalId
                          ? "Atualizar adicional"
                          : "Adicionar adicional"}
                    </Button>
                  </form>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm sm:text-base font-semibold">
                        Gerenciar adicionais
                      </p>
                    </div>

                    {!additionalCategoryId ? (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Selecione uma categoria para visualizar os adicionais.
                      </p>
                    ) : selectedAdditionals.length > 0 &&
                      selectedAdditionalCategory ? (
                      <div className="space-y-2">
                        {selectedAdditionals.map((additional) => (
                          <div
                            key={additional.id}
                            className="flex items-center justify-between gap-3 rounded-md border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={additional.imageUrl}
                                  alt={additional.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-medium">
                                  {additional.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatCurrency(additional.price)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-[11px]"
                                onClick={() => {
                                  if (!selectedAdditionalCategory) return;
                                  handleStartAdditional(
                                    selectedAdditionalCategory.id,
                                    additional
                                  );
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="text-[11px]"
                                disabled={
                                  isDeletingAdditional === additional.id
                                }
                                onClick={() => {
                                  if (!selectedAdditionalCategory) return;
                                  handleDeleteAdditional(
                                    additional.id,
                                    selectedAdditionalCategory.id
                                  );
                                }}
                              >
                                {isDeletingAdditional === additional.id
                                  ? "Removendo..."
                                  : "Remover"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nenhum adicional cadastrado nesta categoria.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 border-t pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm sm:text-base font-semibold">
                        Adicionais obrigatórios
                      </p>
                      {editingRequiredGroupId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={resetRequiredGroupForm}
                        >
                          Novo grupo
                        </Button>
                      )}
                    </div>

                    <form
                      className="space-y-3 sm:space-y-4"
                      onSubmit={handleSubmitRequiredGroup}
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="required-group-category"
                          className="text-sm sm:text-base"
                        >
                          Categoria
                        </Label>
                        <Select
                          value={requiredCategoryId ?? ""}
                          onValueChange={(value) => {
                            setRequiredCategoryId(value);
                            resetRequiredItemForm();
                            if (requiredGroupError) {
                              setRequiredGroupError(null);
                            }
                          }}
                          disabled={
                            isSavingRequiredGroup || !!editingRequiredGroupId
                          }
                        >
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="required-group-title"
                            className="text-sm sm:text-base"
                          >
                            Título do grupo
                          </Label>
                          <Input
                            id="required-group-title"
                            placeholder="Ex: Escolha o molho"
                            value={requiredGroupTitle}
                            onChange={(e) => {
                              setRequiredGroupTitle(e.target.value);
                              if (requiredGroupError) {
                                setRequiredGroupError(null);
                              }
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="required-group-quantity"
                            className="text-sm sm:text-base"
                          >
                            Quantidade obrigatória
                          </Label>
                          <Input
                            id="required-group-quantity"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={requiredGroupQuantity}
                            onChange={(e) => {
                              setRequiredGroupQuantity(e.target.value);
                              if (requiredGroupError) {
                                setRequiredGroupError(null);
                              }
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      {requiredGroupError && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {requiredGroupError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          className="text-xs sm:text-sm flex-1"
                          disabled={isSavingRequiredGroup}
                        >
                          {isSavingRequiredGroup
                            ? "Salvando..."
                            : editingRequiredGroupId
                              ? "Atualizar grupo"
                              : "Adicionar grupo"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={resetRequiredGroupForm}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      <p className="text-sm sm:text-base font-semibold">
                        Gerenciar grupos
                      </p>
                      {!requiredCategoryId ? (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Selecione uma categoria para visualizar os grupos.
                        </p>
                      ) : selectedRequiredGroups.length > 0 &&
                        selectedRequiredCategory ? (
                        <div className="space-y-2">
                          {selectedRequiredGroups.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center justify-between gap-3 rounded-md border p-2"
                            >
                              <div>
                                <p className="text-xs sm:text-sm font-medium">
                                  {group.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {group.requiredQuantity} obrigatório(s) •{" "}
                                  {group.items.length} item(ns)
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-[11px]"
                                  onClick={() => {
                                    if (!selectedRequiredCategory) return;
                                    handleStartRequiredGroup(
                                      selectedRequiredCategory.id,
                                      group
                                    );
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="text-[11px]"
                                  disabled={
                                    isDeletingRequiredGroup === group.id
                                  }
                                  onClick={() => {
                                    if (!selectedRequiredCategory) return;
                                    handleDeleteRequiredGroup(
                                      group.id,
                                      selectedRequiredCategory.id
                                    );
                                  }}
                                >
                                  {isDeletingRequiredGroup === group.id
                                    ? "Removendo..."
                                    : "Remover"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Nenhum grupo obrigatório cadastrado.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm sm:text-base font-semibold">
                          Itens obrigatórios
                        </p>
                        {editingRequiredItemId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={resetRequiredItemForm}
                          >
                            Novo item
                          </Button>
                        )}
                      </div>

                      <form
                        className="space-y-3 sm:space-y-4"
                        onSubmit={handleSubmitRequiredItem}
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="required-item-group"
                            className="text-sm sm:text-base"
                          >
                            Grupo obrigatório
                          </Label>
                          <Select
                            value={requiredItemGroupId ?? ""}
                            onValueChange={(value) => {
                              setRequiredItemGroupId(value);
                              setRequiredItemName("");
                              setRequiredItemImageUrl("");
                              setRequiredItemImagePreview(null);
                              setEditingRequiredItemId(null);
                              if (requiredItemFileInputRef.current) {
                                requiredItemFileInputRef.current.value = "";
                              }
                              if (requiredItemError) {
                                setRequiredItemError(null);
                              }
                            }}
                            disabled={
                              isSavingRequiredItem ||
                              !!editingRequiredItemId ||
                              selectedRequiredGroups.length === 0
                            }
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue
                                placeholder={
                                  selectedRequiredGroups.length > 0
                                    ? "Selecione o grupo"
                                    : "Cadastre um grupo primeiro"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedRequiredGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="required-item-name"
                            className="text-sm sm:text-base"
                          >
                            Nome do item
                          </Label>
                          <Input
                            id="required-item-name"
                            placeholder="Ex: Maionese verde"
                            value={requiredItemName}
                            onChange={(e) => {
                              setRequiredItemName(e.target.value);
                              if (requiredItemError) {
                                setRequiredItemError(null);
                              }
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="required-item-image"
                            className="text-sm sm:text-base"
                          >
                            Imagem
                          </Label>
                          <input
                            ref={requiredItemFileInputRef}
                            id="required-item-image"
                            type="file"
                            accept="image/*"
                            onChange={handleRequiredItemImageSelect}
                            className="hidden"
                            disabled={
                              isSavingRequiredItem || isUploadingRequiredItem
                            }
                          />
                          <div className="space-y-2">
                            {requiredItemImagePreview ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={requiredItemImagePreview}
                                  alt="Preview"
                                  className="h-24 w-full rounded-md object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 w-full text-xs sm:text-sm"
                                  onClick={() => {
                                    setRequiredItemImageUrl("");
                                    setRequiredItemImagePreview(null);
                                    if (requiredItemFileInputRef.current) {
                                      requiredItemFileInputRef.current.value =
                                        "";
                                    }
                                  }}
                                  disabled={
                                    isSavingRequiredItem ||
                                    isUploadingRequiredItem
                                  }
                                >
                                  Remover Imagem
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full text-xs sm:text-sm"
                                onClick={() =>
                                  requiredItemFileInputRef.current?.click()
                                }
                                disabled={
                                  isSavingRequiredItem ||
                                  isUploadingRequiredItem
                                }
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {isUploadingRequiredItem
                                  ? "Carregando..."
                                  : "Selecionar da Galeria"}
                              </Button>
                            )}
                          </div>
                        </div>

                        {requiredItemError && (
                          <p className="text-xs sm:text-sm text-destructive">
                            {requiredItemError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="text-xs sm:text-sm flex-1"
                            disabled={
                              isSavingRequiredItem || isUploadingRequiredItem
                            }
                          >
                            {isSavingRequiredItem
                              ? "Salvando..."
                              : editingRequiredItemId
                                ? "Atualizar item"
                                : "Adicionar item"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={resetRequiredItemForm}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-2">
                        {!requiredItemGroupId ||
                        !selectedRequiredGroup ||
                        !selectedRequiredCategory ? (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Selecione um grupo para visualizar os itens.
                          </p>
                        ) : selectedRequiredItems.length > 0 ? (
                          <div className="space-y-2">
                            {selectedRequiredItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-md border p-2"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      Gratuito
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px]"
                                    onClick={() =>
                                      handleStartRequiredItem(
                                        selectedRequiredCategory.id,
                                        selectedRequiredGroup.id,
                                        item
                                      )
                                    }
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="text-[11px]"
                                    disabled={
                                      isDeletingRequiredItem === item.id
                                    }
                                    onClick={() =>
                                      handleDeleteRequiredItem(
                                        item.id,
                                        selectedRequiredCategory.id,
                                        selectedRequiredGroup.id
                                      )
                                    }
                                  >
                                    {isDeletingRequiredItem === item.id
                                      ? "Removendo..."
                                      : "Remover"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Nenhum item obrigatório cadastrado neste grupo.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : showManageProducts ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Gerenciar Produtos
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowManageProducts(false);
                        setProducts([]);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Carregando produtos...
                      </p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nenhum produto encontrado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        // Agrupar produtos por categoria
                        const productsByCategory = products.reduce(
                          (acc, product) => {
                            const categoryId = product.menuCategory.id;
                            const categoryName = product.menuCategory.name;

                            if (!acc[categoryId]) {
                              acc[categoryId] = {
                                id: categoryId,
                                name: categoryName,
                                products: [],
                              };
                            }

                            acc[categoryId].products.push(product);
                            return acc;
                          },
                          {} as Record<
                            string,
                            {
                              id: string;
                              name: string;
                              products: ProductWithCategory[];
                            }
                          >
                        );

                        // Converter para array e ordenar por nome da categoria
                        const categoriesArray = Object.values(
                          productsByCategory
                        ).sort((a, b) => a.name.localeCompare(b.name));

                        return categoriesArray.map((category) => (
                          <div key={category.id} className="space-y-3">
                            <div className="border-b pb-2">
                              <h3 className="font-semibold text-base sm:text-lg">
                                {category.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {category.products.length}{" "}
                                {category.products.length === 1
                                  ? "produto"
                                  : "produtos"}
                              </p>
                            </div>
                            <div className="space-y-2 pl-2 sm:pl-4">
                              {category.products.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm sm:text-base truncate">
                                      {product.name}
                                    </p>
                                    <p className="text-xs sm:text-sm font-semibold mt-1">
                                      {formatCurrency(product.price)}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 sm:flex-initial text-xs sm:text-sm"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                      Editar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="flex-1 sm:flex-initial text-xs sm:text-sm"
                                      onClick={() =>
                                        setDeleteProductId(product.id)
                                      }
                                    >
                                      <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                      Excluir
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : showManageCategories ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Gerenciar Categorias
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        resetAdditionalForm();
                        setShowManageCategories(false);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nenhuma categoria encontrada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="space-y-3 p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm sm:text-base">
                              {category.name}
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => setDeleteCategoryId(category.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                              Excluir
                            </Button>
                          </div>

                          <div className="space-y-2 rounded-md bg-muted/40 p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs sm:text-sm font-semibold">
                                Adicionais
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-[11px]"
                                onClick={() =>
                                  handleStartAdditional(category.id)
                                }
                              >
                                Novo
                              </Button>
                            </div>

                            {category.additionals &&
                            category.additionals.length > 0 ? (
                              <div className="space-y-2">
                                {category.additionals.map((additional) => (
                                  <div
                                    key={additional.id}
                                    className="flex items-center justify-between rounded-md bg-background p-2"
                                  >
                                    <div>
                                      <p className="text-xs sm:text-sm font-medium">
                                        {additional.name}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {formatCurrency(additional.price)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[11px]"
                                        onClick={() =>
                                          handleStartAdditional(
                                            category.id,
                                            additional
                                          )
                                        }
                                      >
                                        Editar
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="text-[11px]"
                                        disabled={
                                          isDeletingAdditional === additional.id
                                        }
                                        onClick={() =>
                                          handleDeleteAdditional(
                                            additional.id,
                                            category.id
                                          )
                                        }
                                      >
                                        {isDeletingAdditional === additional.id
                                          ? "Removendo..."
                                          : "Remover"}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                Nenhum adicional cadastrado
                              </p>
                            )}

                            {additionalCategoryId === category.id && (
                              <form
                                className="space-y-2 rounded-md border bg-background p-2"
                                onSubmit={handleSubmitAdditional}
                              >
                                <Input
                                  placeholder="Nome do adicional"
                                  value={additionalName}
                                  onChange={(e) =>
                                    setAdditionalName(e.target.value)
                                  }
                                  className="text-xs sm:text-sm"
                                />
                                <Input
                                  placeholder="Preço"
                                  type="number"
                                  step="0.01"
                                  value={additionalPrice}
                                  onChange={(e) =>
                                    setAdditionalPrice(e.target.value)
                                  }
                                  className="text-xs sm:text-sm"
                                />
                                <div className="space-y-2">
                                  <input
                                    ref={additionalFileInputRef}
                                    id="additional-image-inline"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAdditionalImageSelect}
                                    className="hidden"
                                    disabled={
                                      isSavingAdditional ||
                                      isUploadingAdditional
                                    }
                                  />
                                  {additionalImagePreview ? (
                                    <div className="relative">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={additionalImagePreview}
                                        alt="Preview"
                                        className="h-20 w-full rounded-md object-cover"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full text-xs"
                                        onClick={() => {
                                          setAdditionalImageUrl("");
                                          setAdditionalImagePreview(null);
                                          if (additionalFileInputRef.current) {
                                            additionalFileInputRef.current.value =
                                              "";
                                          }
                                        }}
                                        disabled={
                                          isSavingAdditional ||
                                          isUploadingAdditional
                                        }
                                      >
                                        Remover Imagem
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() =>
                                        additionalFileInputRef.current?.click()
                                      }
                                      disabled={
                                        isSavingAdditional ||
                                        isUploadingAdditional
                                      }
                                    >
                                      <ImageIcon className="mr-2 h-3 w-3" />
                                      {isUploadingAdditional
                                        ? "Carregando..."
                                        : "Selecionar imagem"}
                                    </Button>
                                  )}
                                </div>
                                {additionalError && (
                                  <p className="text-[11px] text-destructive">
                                    {additionalError}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="text-xs sm:text-sm flex-1"
                                    disabled={
                                      isSavingAdditional ||
                                      isUploadingAdditional
                                    }
                                  >
                                    {isSavingAdditional
                                      ? "Salvando..."
                                      : editingAdditionalId
                                        ? "Atualizar"
                                        : "Adicionar"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                    onClick={resetAdditionalForm}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : showOrders ? (
            <div className="flex-auto overflow-y-auto pr-1">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Pedidos
                      {hasNewOrders && (
                        <Bell className="ml-2 inline h-4 w-4 text-yellow-500 animate-pulse" />
                      )}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        setShowOrders(false);
                        setOrders([]);
                        setHasNewOrders(false);
                        setLastOrderCount(0);
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <Button
                      type="button"
                      variant={ordersView === "today" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setOrdersView("today");
                        setOrdersStatusFilter("ALL");
                      }}
                    >
                      Pedidos de hoje
                    </Button>
                    <Button
                      type="button"
                      variant={ordersView === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setOrdersView("all");
                        setOrdersStatusFilter("ALL");
                      }}
                    >
                      Todos os pedidos
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(
                      [
                        "ALL",
                        "PENDING",
                        "IN_PREPARATION",
                        "OUT_FOR_DELIVERY",
                        "FINISHED",
                      ] as const
                    ).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={
                          ordersStatusFilter === status ? "default" : "outline"
                        }
                        onClick={() => setOrdersStatusFilter(status)}
                      >
                        {status === "ALL"
                          ? "Todos status"
                          : getStatusLabel(status as OrderStatus)}
                      </Button>
                    ))}
                  </div>

                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Carregando pedidos...
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const filteredOrders =
                        ordersView === "today"
                          ? orders.filter((order) => isToday(order.createdAt))
                          : orders;

                      const orderedFilteredOrders =
                        ordersView === "today"
                          ? [...filteredOrders].sort(
                              (a, b) =>
                                new Date(a.createdAt).getTime() -
                                new Date(b.createdAt).getTime()
                            )
                          : filteredOrders;

                      const statusFilteredOrders =
                        ordersStatusFilter === "ALL"
                          ? orderedFilteredOrders
                          : orderedFilteredOrders.filter(
                              (order) => order.status === ordersStatusFilter
                            );

                      if (statusFilteredOrders.length === 0) {
                        return (
                          <div className="flex items-center justify-center py-10">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Nenhum pedido encontrado
                            </p>
                          </div>
                        );
                      }

                      const renderOrderCard = (
                        order: (typeof orders)[number]
                      ) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-3 sm:p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-sm sm:text-base">
                                Pedido #{order.id}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded border text-xs sm:text-sm font-medium ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </div>
                          </div>

                          <div className="border-t pt-3 space-y-2">
                            <div>
                              <p className="text-xs sm:text-sm font-medium">
                                Cliente
                              </p>
                              <p className="text-sm sm:text-base">
                                {order.customerName}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                CPF: {formatCpf(order.customerCpf)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium">
                                Método de Consumo
                              </p>
                              <p className="text-sm sm:text-base">
                                {order.consumptionMethod === "TAKEANAY"
                                  ? "Entrega"
                                  : "Comer no Local"}
                              </p>
                            </div>
                          </div>

                          {order.consumptionMethod === "TAKEANAY" &&
                            order.deliveryStreet && (
                              <div className="border-t pt-3 space-y-1">
                                <p className="text-xs sm:text-sm font-medium">
                                  Endereço de Entrega
                                </p>
                                <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                                  <p>
                                    {order.deliveryStreet},{" "}
                                    {order.deliveryNumber}
                                  </p>
                                  {order.deliveryComplement && (
                                    <p>
                                      Complemento: {order.deliveryComplement}
                                    </p>
                                  )}
                                  <p>
                                    {order.deliveryNeighborhood} -{" "}
                                    {order.deliveryCity}/{order.deliveryState}
                                  </p>
                                </div>
                              </div>
                            )}

                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs sm:text-sm font-medium">
                              Produtos
                            </p>
                            <div className="space-y-2">
                              {order.orderProducts.map((orderProduct) => {
                                const additionalsTotal = (
                                  orderProduct.additionals || []
                                ).reduce(
                                  (acc, item) =>
                                    acc + item.price * item.quantity,
                                  0
                                );
                                const productTotal =
                                  orderProduct.price * orderProduct.quantity +
                                  additionalsTotal * orderProduct.quantity;
                                return (
                                  <div
                                    key={orderProduct.id}
                                    className="flex items-center gap-2 sm:gap-3 p-2 bg-muted rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="text-xs sm:text-sm font-medium">
                                        {orderProduct.product.name} x
                                        {orderProduct.quantity}
                                      </p>
                                      {orderProduct.sizeName && (
                                        <p className="text-[11px] text-muted-foreground">
                                          Tam: {orderProduct.sizeName}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {formatCurrency(orderProduct.price)}{" "}
                                        cada
                                      </p>
                                      {orderProduct.additionals &&
                                        orderProduct.additionals.length > 0 && (
                                          <div className="mt-1 space-y-0.5">
                                            <p className="text-[11px] font-medium">
                                              Adicionais
                                            </p>
                                            <ul className="text-[11px] text-muted-foreground space-y-0.5">
                                              {orderProduct.additionals.map(
                                                (additional) => (
                                                  <li key={additional.id}>
                                                    {additional.quantity}x{" "}
                                                    {additional.name} (
                                                    {formatCurrency(
                                                      additional.price
                                                    )}
                                                    )
                                                  </li>
                                                )
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                      {orderProduct.requiredAdditionals &&
                                        orderProduct.requiredAdditionals
                                          .length > 0 && (
                                          <div className="mt-1 space-y-0.5">
                                            <p className="text-[11px] font-medium">
                                              Obrigatórios
                                            </p>
                                            <ul className="text-[11px] text-muted-foreground space-y-0.5">
                                              {orderProduct.requiredAdditionals.map(
                                                (required) => (
                                                  <li key={required.id}>
                                                    {required.quantity}x{" "}
                                                    {required.name} (
                                                    {required.groupTitle})
                                                  </li>
                                                )
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs sm:text-sm font-semibold">
                                        {formatCurrency(productTotal)}
                                      </p>
                                      {additionalsTotal > 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                          +{" "}
                                          {formatCurrency(
                                            additionalsTotal *
                                              orderProduct.quantity
                                          )}{" "}
                                          adicionais
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="grid grid-cols-2 gap-y-1 pt-2 border-t text-xs sm:text-sm">
                              <span>Produtos</span>
                              <span className="text-right font-semibold text-foreground">
                                {formatCurrency(order.productsSubtotal)}
                              </span>
                              {order.sizesSubtotal !== 0 && (
                                <>
                                  <span>Tamanhos</span>
                                  <span className="text-right font-semibold text-foreground">
                                    {formatCurrency(order.sizesSubtotal)}
                                  </span>
                                </>
                              )}
                              {order.additionalsSubtotal > 0 && (
                                <>
                                  <span>Adicionais</span>
                                  <span className="text-right font-semibold text-foreground">
                                    {formatCurrency(order.additionalsSubtotal)}
                                  </span>
                                </>
                              )}
                              <span className="font-semibold text-foreground">
                                Total
                              </span>
                              <span className="text-right font-bold text-base sm:text-lg">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs sm:text-sm font-medium">
                              Atualizar Status
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant={
                                  order.status === "PENDING"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="text-xs sm:text-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "PENDING")
                                }
                                disabled={
                                  isUpdatingStatus === order.id ||
                                  order.status === "PENDING"
                                }
                              >
                                Pendente
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  order.status === "IN_PREPARATION"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="text-xs sm:text-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    "IN_PREPARATION"
                                  )
                                }
                                disabled={
                                  isUpdatingStatus === order.id ||
                                  order.status === "IN_PREPARATION"
                                }
                              >
                                Em Preparo
                              </Button>
                              {order.consumptionMethod === "TAKEANAY" && (
                                <Button
                                  type="button"
                                  variant={
                                    order.status === "OUT_FOR_DELIVERY"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "OUT_FOR_DELIVERY"
                                    )
                                  }
                                  disabled={
                                    isUpdatingStatus === order.id ||
                                    order.status === "OUT_FOR_DELIVERY"
                                  }
                                >
                                  Enviado para Entrega
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant={
                                  order.status === "FINISHED"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="text-xs sm:text-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "FINISHED")
                                }
                                disabled={
                                  isUpdatingStatus === order.id ||
                                  order.status === "FINISHED"
                                }
                              >
                                Finalizado
                              </Button>
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <div className="space-y-4">
                          {statusFilteredOrders.map((order) =>
                            renderOrderCard(order)
                          )}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </SheetContent>

      {/* Modal de confirmação para excluir produto */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={(open) => {
          if (!open) setDeleteProductId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProduct}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeletingProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingProduct ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação para excluir categoria */}
      <AlertDialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode
              ser desfeita. Categorias com produtos não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCategory ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};

export default AdminSheet;
