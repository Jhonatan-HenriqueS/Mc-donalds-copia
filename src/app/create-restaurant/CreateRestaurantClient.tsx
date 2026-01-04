"use client";

import { ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createRestaurant } from "@/app/actions/create-restaurant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CreateRestaurantClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
    imageUrl?: string;
    coverImageUrl?: string;
  }>({});

  const generateSlugFromName = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlugFromName(name)) {
      setSlug(generateSlugFromName(value));
    }
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isCover = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("O arquivo deve ser uma imagem");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    if (isCover) {
      setIsUploadingCover(true);
    } else {
      setIsUploading(true);
    }

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

      if (isCover) {
        setCoverImageUrl(data.url);
        setCoverImagePreview(data.url);
        if (errors.coverImageUrl) {
          setErrors((prev) => ({ ...prev, coverImageUrl: undefined }));
        }
      } else {
        setImageUrl(data.url);
        setImagePreview(data.url);
        if (errors.imageUrl) {
          setErrors((prev) => ({ ...prev, imageUrl: undefined }));
        }
      }
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      if (isCover) {
        setIsUploadingCover(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: {
      name?: string;
      slug?: string;
      imageUrl?: string;
      coverImageUrl?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "O nome é obrigatório";
    }

    if (!slug.trim()) {
      newErrors.slug = "O slug é obrigatório";
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug =
        "O slug deve conter apenas letras minúsculas, números e hífens";
    }

    if (!imageUrl.trim()) {
      newErrors.imageUrl = "A imagem do avatar é obrigatória";
    }

    if (!coverImageUrl.trim()) {
      newErrors.coverImageUrl = "A imagem de capa é obrigatória";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!userId) {
      toast.error("Usuário não identificado. Faça login novamente.");
      router.push("/");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createRestaurant({
        name: name.trim(),
        slug: slug.trim(),
        imageUrl: imageUrl.trim(),
        coverImageUrl: coverImageUrl.trim(),
        userId: userId.trim(),
      });

      if (result.success) {
        toast.success("Restaurante criado com sucesso!");
        router.push(`/${slug.trim()}/menu?consumptionMethod=DINE_IN`);
      } else {
        toast.error(result.error || "Erro ao criar restaurante");
      }
    } catch (error) {
      console.log("Erro ao criar restaurante:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Criar Restaurante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Restaurante</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome do restaurante"
                className={`w-full ${errors.name ? "border-destructive" : ""}`}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                type="text"
                placeholder="slug-do-restaurante"
                className={`w-full ${errors.slug ? "border-destructive" : ""}`}
                value={slug}
                onChange={(e) => {
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "");
                  setSlug(value);
                  if (errors.slug) {
                    setErrors((prev) => ({ ...prev, slug: undefined }));
                  }
                }}
                disabled={isLoading}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O slug será usado na URL do seu restaurante
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagem do Avatar</Label>
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, false)}
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
                      className="h-48 w-full rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
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
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {isUploading ? "Carregando..." : "Selecionar da Galeria"}
                  </Button>
                )}
              </div>
              {errors.imageUrl && (
                <p className="text-sm text-destructive">{errors.imageUrl}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Imagem de Capa (Cover)</Label>
              <input
                ref={coverFileInputRef}
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, true)}
                className="hidden"
                disabled={isLoading || isUploadingCover}
              />
              <div className="space-y-2">
                {coverImagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImagePreview}
                      alt="Preview Cover"
                      className="h-48 w-full rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setCoverImageUrl("");
                        setCoverImagePreview(null);
                        if (coverFileInputRef.current) {
                          coverFileInputRef.current.value = "";
                        }
                      }}
                      disabled={isLoading || isUploadingCover}
                    >
                      Remover Imagem
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isLoading || isUploadingCover}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {isUploadingCover
                      ? "Carregando..."
                      : "Selecionar da Galeria"}
                  </Button>
                )}
              </div>
              {errors.coverImageUrl && (
                <p className="text-sm text-destructive">
                  {errors.coverImageUrl}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Restaurante"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRestaurantClient;
