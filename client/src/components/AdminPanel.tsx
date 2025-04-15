import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, storeFormSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AdminPanelProps {
  store: Store;
  productCount: number;
  onAddProduct: () => void;
}

export default function AdminPanel({ store, productCount, onAddProduct }: AdminPanelProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logoUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(store.bannerUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  type StoreFormValues = {
    name: string;
    whatsappNumber: string;
    logoUrl?: string;
  };
  
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: store.name,
      whatsappNumber: store.whatsappNumber,
      logoUrl: store.logoUrl || '',
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (values: Partial<Store>) => {
      const res = await apiRequest("PATCH", "/api/store", values);
      return res.json();
    },
    onSuccess: (updatedStore) => {
      // Atualiza o cache imediatamente com os novos dados
      queryClient.setQueryData(['/api/store'], updatedStore);
      
      // Force refresh para garantir que os dados estejam atualizados
      queryClient.invalidateQueries({ queryKey: ['/api/store'] });
      
      toast({
        title: "Loja atualizada",
        description: "As informações da loja foram atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar loja",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bannerUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("banner", file);
      
      const res = await fetch("/api/store/banner", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Falha ao fazer upload do banner");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setBannerPreview(data.bannerUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/store'] });
      toast({
        title: "Banner atualizado",
        description: "O banner da loja foi atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 800 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo do arquivo é 800KB",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie apenas imagens",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    bannerUploadMutation.mutate(file);
  };

  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch("/api/store/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Falha ao fazer upload do logo");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue("logoUrl", data.logoUrl);
      
      // Force refresh the store data to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/store'] });
      
      // Atualiza imediatamente o store no cache para refletir a mudança de logo
      queryClient.setQueryData(['/api/store'], (oldData: any) => {
        return {
          ...oldData,
          logoUrl: data.logoUrl
        };
      });
      
      toast({
        title: "Logo atualizado",
        description: "O logo da loja foi atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size and type
    if (file.size > 800 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo do arquivo é 800KB",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie apenas imagens",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    logoUploadMutation.mutate(file);
  };

  const onSubmit = (values: StoreFormValues) => {
    updateStoreMutation.mutate(values);
  };

  return (
    <div className="admin-panel mb-8 bg-white rounded-lg shadow-md p-4">
      <h2 className="font-serif text-xl font-bold text-[#6B4E71] mb-4">Painel Administrativo</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium mb-2">Informações da Loja</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de WhatsApp</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                          +55
                        </span>
                        <Input
                          {...field}
                          className="rounded-l-none"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Logo do Consultor</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Preview da logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-500 text-xl font-bold">
                          {store.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo-upload"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoUploadMutation.isPending}
                    >
                      {logoUploadMutation.isPending ? "Enviando..." : "Escolher arquivo"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-upload">Banner da Loja</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-16 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                      {bannerPreview ? (
                        <img
                          src={bannerPreview}
                          alt="Preview do banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-500 text-sm">
                          Sem banner
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="banner-upload"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerChange}
                    />
                    <Button
                      type="button"  
                      variant="secondary"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={bannerUploadMutation.isPending}
                    >
                      {bannerUploadMutation.isPending ? "Enviando..." : "Escolher banner"}
                    </Button>
                  </div>
                </div>
              </div>


            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium mb-2">Gerenciar Produtos</h3>
              <p className="text-sm text-gray-800 mb-4">
                Total: <span>{productCount}</span>/30 produtos
              </p>
              <Button
                type="button"
                className="w-full py-2 bg-[#FF66B2] text-white"
                onClick={onAddProduct}
                disabled={productCount >= 30}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Adicionar Novo Produto
              </Button>
              {productCount >= 30 && (
                <p className="text-xs text-red-500">
                  Limite de 30 produtos atingido
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              type="submit" 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={updateStoreMutation.isPending}
            >
              {updateStoreMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
