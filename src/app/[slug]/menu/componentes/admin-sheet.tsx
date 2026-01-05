'use client';

import { Prisma } from '@prisma/client';
import { ImageIcon, LogOut, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { createCategory } from '@/app/[slug]/menu/actions/create-category';
import { createProduct } from '@/app/[slug]/menu/actions/create-product';
import { getCustomers } from '@/app/[slug]/menu/actions/get-customers';
import { formatCpf } from '@/app/[slug]/menu/helpers/format-cpf';
import { logout } from '@/app/actions/logout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatCurrency } from '@/helpers/format-currency';

interface AdminSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      menuCategorias: true;
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

const AdminSheet = ({ isOpen, onOpenChange, restaurant }: AdminSheetProps) => {
  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [totalMonthRevenue, setTotalMonthRevenue] = useState(0);
  const [viewMode, setViewMode] = useState<'total' | 'month'>('total');
  const [categories, setCategories] = useState(restaurant.menuCategorias);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [menuCategoryId, setMenuCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    price?: string;
    menuCategoryId?: string;
    imageUrl?: string;
  }>({});
  const [categoryError, setCategoryError] = useState<string | undefined>();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('O arquivo deve ser uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      setImageUrl(data.url);
      setImagePreview(data.url);
      if (errors.imageUrl) {
        setErrors((prev) => ({ ...prev, imageUrl: undefined }));
      }
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao fazer upload'
      );
    } finally {
      setIsUploading(false);
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
    } = {};

    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (!description.trim()) {
      newErrors.description = 'A descrição é obrigatória';
    }

    if (!price.trim()) {
      newErrors.price = 'O preço é obrigatório';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'O preço deve ser um número válido maior que zero';
    }

    if (!menuCategoryId) {
      newErrors.menuCategoryId = 'A categoria é obrigatória';
    }

    if (!imageUrl.trim()) {
      newErrors.imageUrl = 'A imagem é obrigatória';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const ingredientsArray = ingredients
        .split(',')
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0);

      const result = await createProduct({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim(),
        ingredients: ingredientsArray,
        menuCategoryId,
        restaurantId: restaurant.id,
      });

      if (result.success) {
        toast.success('Produto criado com sucesso!');
        // Limpar formulário
        setName('');
        setDescription('');
        setPrice('');
        setIngredients('');
        setMenuCategoryId('');
        setImageUrl('');
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setShowAddProduct(false);
        // Recarregar a página para mostrar o novo produto
        window.location.reload();
      } else {
        toast.error(result.error || 'Erro ao criar produto');
      }
    } catch {
      toast.error('Erro ao processar solicitação');
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
        toast.error(result.error || 'Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao buscar clientes');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCategoryError(undefined);

    if (!categoryName.trim()) {
      setCategoryError('O nome da categoria é obrigatório');
      return;
    }

    setIsLoadingCategory(true);

    try {
      const result = await createCategory({
        name: categoryName.trim(),
        restaurantId: restaurant.id,
      });

      if (result.success && result.category) {
        toast.success('Categoria criada com sucesso!');
        // Adicionar nova categoria à lista local
        setCategories((prev) => [...prev, result.category!]);
        setCategoryName('');
        setShowAddCategory(false);
      } else {
        toast.error(result.error || 'Erro ao criar categoria');
      }
    } catch {
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoadingCategory(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90%] sm:max-w-[90%]">
        <SheetHeader>
          <SheetTitle className="text-start">Painel Admin</SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>
        <div className="py-5 flex flex-col h-full">
          {!showAddProduct && !showAddCategory && !showCustomers ? (
            <div className="flex-auto flex flex-col gap-4">
              <Button
                onClick={() => setShowAddCategory(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Categoria
              </Button>
              <Button
                onClick={() => setShowAddProduct(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
              <Button
                onClick={handleShowCustomers}
                className="w-full"
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Clientes
              </Button>
              <div className="mt-auto pt-4 border-t">
                <Button
                  onClick={async () => {
                    const result = await logout();
                    if (result.success) {
                      router.push('/');
                    } else {
                      toast.error('Erro ao fazer logout');
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          ) : showAddCategory ? (
            <div className="flex-auto overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCategorySubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Nome da Categoria</Label>
                      <Input
                        id="categoryName"
                        type="text"
                        placeholder="Digite o nome da categoria"
                        className={categoryError ? 'border-destructive' : ''}
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
                        <p className="text-sm text-destructive">
                          {categoryError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAddCategory(false);
                          setCategoryName('');
                          setCategoryError(undefined);
                        }}
                        disabled={isLoadingCategory}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoadingCategory}
                      >
                        {isLoadingCategory ? 'Criando...' : 'Criar Categoria'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : showCustomers ? (
            <div className="flex-auto overflow-y-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Clientes</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCustomers(false);
                        setCustomers([]);
                        setTotalMonthRevenue(0);
                        setViewMode('total');
                      }}
                    >
                      Voltar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm text-muted-foreground">
                        Carregando clientes...
                      </p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm text-muted-foreground">
                        Nenhum cliente encontrado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Seletor de visualização e total do mês */}
                      <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              viewMode === 'total' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => setViewMode('total')}
                          >
                            Total Gasto
                          </Button>
                          <Button
                            type="button"
                            variant={
                              viewMode === 'month' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => setViewMode('month')}
                          >
                            Total do Mês
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Total ganho no mês
                          </p>
                          <p className="font-semibold text-lg">
                            {formatCurrency(totalMonthRevenue)}
                          </p>
                        </div>
                      </div>

                      {/* Lista de clientes */}
                      <div className="space-y-3">
                        {customers.map((customer, index) => (
                          <div
                            key={`${customer.cpf}-${index}`}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCpf(customer.cpf)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(
                                  viewMode === 'total'
                                    ? customer.totalSpent
                                    : customer.totalSpentThisMonth
                                )}
                              </p>
                              {viewMode === 'month' &&
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
          ) : (
            <div className="flex-auto overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
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
                          className={
                            errors.menuCategoryId ? 'border-destructive' : ''
                          }
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
                        <p className="text-sm text-destructive">
                          {errors.menuCategoryId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Digite o nome do produto"
                        className={errors.name ? 'border-destructive' : ''}
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
                        <p className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        type="text"
                        placeholder="Digite a descrição do produto"
                        className={
                          errors.description ? 'border-destructive' : ''
                        }
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
                        <p className="text-sm text-destructive">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={errors.price ? 'border-destructive' : ''}
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
                        <p className="text-sm text-destructive">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ingredients">
                        Ingredientes (separados por vírgula)
                      </Label>
                      <Input
                        id="ingredients"
                        type="text"
                        placeholder="Ex: tomate, alface, queijo"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">Opcional</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productImage">Foto do Produto</Label>
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
                              className="h-32 w-full rounded-md object-cover"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 w-full"
                              onClick={() => {
                                setImageUrl('');
                                setImagePreview(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
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
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {isUploading
                              ? 'Carregando...'
                              : 'Selecionar da Galeria'}
                          </Button>
                        )}
                      </div>
                      {errors.imageUrl && (
                        <p className="text-sm text-destructive">
                          {errors.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAddProduct(false);
                          setName('');
                          setDescription('');
                          setPrice('');
                          setIngredients('');
                          setMenuCategoryId('');
                          setImageUrl('');
                          setImagePreview(null);
                          setErrors({});
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Criando...' : 'Criar Produto'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminSheet;
