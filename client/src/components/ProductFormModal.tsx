import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Product, productFormSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Link } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  storeId: number;
}

export default function ProductFormModal({ 
  isOpen, 
  onClose, 
  product, 
  storeId 
}: ProductFormModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl || null
  );
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || "");
  // Se o produto já tem uma URL de imagem, começamos com a aba URL selecionada
  const [activeImageTab, setActiveImageTab] = useState<string>(product?.imageUrl?.startsWith("http") ? "url" : "upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<typeof productFormSchema._type>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      price: product?.price || 0,
      description: product?.description || "",
      imageUrl: product?.imageUrl || "",
      storeId: storeId,
    },
  });

  const imageUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch("/api/products/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Falha ao fazer upload da imagem");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      form.setValue("imageUrl", data.imageUrl);
      setImagePreview(data.imageUrl);
    },
    onError: (error) => {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (values: typeof productFormSchema._type) => {
      const res = await apiRequest("POST", "/api/products", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onClose();
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number; values: typeof productFormSchema._type }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/products/${data.id}`,
        data.values
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      onClose();
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
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
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    imageUploadMutation.mutate(file);
  };
  
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    
    // Apenas atualize o preview e o formulário se a URL for válida
    if (url.trim() !== "" && (url.startsWith("http://") || url.startsWith("https://"))) {
      setImagePreview(url);
      form.setValue("imageUrl", url);
    }
  };
  
  const applyImageUrl = () => {
    if (imageUrl.trim() === "") {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para a imagem",
        variant: "destructive",
      });
      return;
    }

    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      toast({
        title: "URL inválida",
        description: "A URL deve começar com http:// ou https://",
        variant: "destructive",
      });
      return;
    }
    
    setImagePreview(imageUrl);
    form.setValue("imageUrl", imageUrl);
    
    toast({
      title: "URL aplicada",
      description: "A URL da imagem foi aplicada com sucesso",
    });
  };

  const onSubmit = (values: typeof productFormSchema._type) => {
    if (isEditing && product) {
      updateProductMutation.mutate({ id: product.id, values });
    } else {
      createProductMutation.mutate(values);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-gray-200 px-4 py-3">
          <h3 className="font-serif font-bold text-lg text-[#6B4E71]">
            {isEditing ? "Editar Produto" : "Adicionar Produto"}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-800 hover:text-red-500"
          >
            <X size={18} />
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do produto" 
                      rows={3}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label htmlFor="product-image">Imagem do Produto</Label>
              <div className="flex flex-col gap-3">
                <div className="w-full h-48 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview da imagem"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Selecione uma imagem</span>
                    </div>
                  )}
                </div>

                {/* Opções para upload ou URL */}
                <Tabs value={activeImageTab} onValueChange={setActiveImageTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload size={14} />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-1">
                      <Link size={14} />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-2 mt-2">
                    <input
                      type="file"
                      id="product-image"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploadMutation.isPending}
                      className="bg-[#FF66B2] text-white hover:bg-[#ff4da6] w-full"
                    >
                      {imageUploadMutation.isPending ? "Enviando..." : "Escolher Imagem"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-2 mt-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={imageUrl}
                        onChange={handleImageUrlChange}
                      />
                      <Button
                        type="button"
                        onClick={applyImageUrl}
                        className="bg-[#FF66B2] text-white hover:bg-[#ff4da6] whitespace-nowrap"
                      >
                        Aplicar
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Insira a URL completa da imagem (começando com http:// ou https://)
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#FF66B2] text-white hover:bg-[#ff4da6]"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending
                  ? "Salvando..."
                  : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
