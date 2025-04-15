// src/pages/ShopOwnerDashboard.tsx

import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Certifique-se de incluir o CSS
import { useQuery } from "@tanstack/react-query";

// Importando as funções fetchData e postData do arquivo request.ts
import { fetchData, postData } from '@/request'; // Caminho correto para o arquivo request.ts

type StoreFormValues = {
  name: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  showSocialMedia: boolean;
  slug: string;
};

type ProductFormValues = {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  active: boolean;
};

type Store = {
  id: number;
  name: string;
  logoUrl: string | null;
  whatsappNumber: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  showSocialMedia: boolean;
  active: boolean;
  slug: string | null;
  description: string | null;
  theme?: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  bannerUrl: string | null;
  companyLogoUrl: string | null;
};


export default function ShopOwnerDashboard() {
  const { toast } = useToast();
  
  const [storeForm, setStoreForm] = useState<StoreFormValues>({
    name: "",
    whatsappNumber: "",
    instagramUrl: "",
    facebookUrl: "",
    showSocialMedia: false,
    slug: "",
  });
  const [productForm, setProductForm] = useState<ProductFormValues>({
    name: "",
    price: 0,
    description: "",
    imageUrl: "",
    active: true,
  });
  
  // ... outros estados omitidos por brevidade ...

  // Fetch store data
  const { 
    data: store, 
    isLoading: isLoadingStore 
  } = useQuery<Store>({
    queryKey: ["/api/store"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store");
      return res.json();
    },
  });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connectWebSocket = () => {
      try {
        if (store) {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = "katalogo.shop"; // Usando seu domínio
          const wsUrl = `${protocol}//${host}/ws`;

          console.log("Tentando conectar WebSocket:", wsUrl);

          socket = new WebSocket(wsUrl);

          socket.onopen = () => {
            console.log("WebSocket conectado com sucesso");
            if (socket && store) {
              socket.send(JSON.stringify({ storeId: store.id }));
            }
          };

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'new_order') {
                console.log('Novo pedido recebido via WebSocket:', data.order);
                // Notificar usuário sobre novo pedido
                toast({
                  title: "Novo pedido recebido!",
                  description: `Pedido #${data.order.id} de ${data.order.customerName}`,
                });
                // Atualizar a lista de pedidos
                refetchOrders();
              } else if (data.type === 'subscription_updated') {
                console.log('Atualização de assinatura recebida via WebSocket:', data.data);
                // Notificar usuário sobre atualização do limite de produtos
                toast({
                  title: "Limite de produtos atualizado!",
                  description: `Seu limite de produtos foi alterado para ${data.data.productLimit}`,
                });
                // Forçar atualização dos dados do lojista
                refetchShopOwner();
              }
            } catch (error) {
              console.error('Erro ao processar mensagem WebSocket:', error);
            }
          };

          socket.onerror = (error) => {
            console.error('Erro WebSocket:', error);
          };

          socket.onclose = (event) => {
            console.log('WebSocket desconectado. Código:', event.code);
            
            // Tentar reconectar após 3 segundos
            if (reconnectTimer) {
              window.clearTimeout(reconnectTimer);
            }
            
            reconnectTimer = window.setTimeout(() => {
              console.log('Tentando reconectar WebSocket...');
              connectWebSocket();
            }, 3000);
          };
        }
      } catch (error) {
        console.error("Erro ao criar conexão WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [store, refetchOrders, refetchShopOwner, toast]);

  // Update store info mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (storeData: StoreFormValues) => {
      const res = await apiRequest("PATCH", "/api/store", storeData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/store"], data);
      toast({
        title: "Loja atualizada",
        description: "As informações da loja foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar as informações da loja",
        variant: "destructive",
      });
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/store/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Erro ao enviar logo");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/store"], {
        ...store,
        logoUrl: data.logoUrl,
      });
      setLogoFile(null);
      toast({
        title: "Logo atualizado",
        description: "O logo da loja foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o logo",
        variant: "destructive",
      });
    },
  });

  // Upload product image mutation
  const uploadProductImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/products/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Erro ao enviar imagem");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setProductForm((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
      }));
      setProductImageFile(null);
      toast({
        title: "Imagem enviada",
        description: "A imagem do produto foi enviada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a imagem",
        variant: "destructive",
      });
    },
  });

  // Create/Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (product: ProductFormValues) => {
      const productData = {
        ...product,
        categoryId: product.categoryId === undefined ? null : product.categoryId
      };

      if (product.id) {
        // Update existing product
        const res = await apiRequest("PATCH", `/api/products/${product.id}`, productData);
        return res.json();
      } else {
        // Create new product
        const res = await apiRequest("POST", "/api/products", productData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setProductForm({
        name: "",
        price: 0,
        description: "",
        imageUrl: "",
        active: true,
      });
      toast({
        title: selectedProduct ? "Produto atualizado" : "Produto criado",
        description: selectedProduct 
          ? "O produto foi atualizado com sucesso" 
          : "O produto foi criado com sucesso",
      });
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o produto",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o produto",
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string }) => {
      if (!store) throw new Error("Loja não encontrada");
      const res = await apiRequest("POST", "/api/categories", {
        ...categoryData,
        storeId: store.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: "" });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso",
      });
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a categoria",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest("DELETE", `/api/categories/${categoryId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteCategoryDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a categoria",
        variant: "destructive",
      });
    },
  });

  // Handle store form update
  const handleStoreFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle store form submit
  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log de depuração
    console.log("Enviando formulário de atualização da loja:", storeForm);

    // Criar uma cópia nova do objeto para evitar problemas de referência
    const storeData = { ...storeForm };

    // Garantir que os campos não estão undefined
    if (storeData.instagramUrl === undefined || storeData.instagramUrl === "") storeData.instagramUrl = "";
    if (storeData.facebookUrl === undefined || storeData.facebookUrl === "") storeData.facebookUrl = "";
    if (storeData.description === undefined) storeData.description = "";
    if (storeData.showSocialMedia === undefined) storeData.showSocialMedia = true;

    // Log adicional para depuração
    console.log("Dados formatados para envio:", storeData);

    // Enviar o formulário
    updateStoreMutation.mutate(storeData);
  };

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLogoFile(files[0]);
      uploadLogoMutation.mutate(files[0]);
    }
  };

  // Handle product image file change
  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setProductImageFile(files[0]);
      uploadProductImageMutation.mutate(files[0]);
    }
  };

  // Handle product form change
  const handleProductFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  // Handle product form submit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log de depuração
    console.log("Enviando formulário de produto:", productForm);

    // Criar uma cópia nova do objeto para evitar problemas de referência
    const productData = { ...productForm };

    // Garantir que os campos não estão undefined
    if (productData.description === undefined || productData.description === "") productData.description = "";
    if (productData.imageUrl === undefined || productData.imageUrl === "") productData.imageUrl = "";
    // Mantém o categoryId como null se não estiver definido
    if (productData.categoryId === undefined) productData.categoryId = null;

    // Enviar o formulário
    saveProductMutation.mutate(productData);
  };

  // Handle category selection 
  const handleCategoryChange = (value: string) => {
    setProductForm((prev) => ({
      ...prev,
      categoryId: value && value !== "0" ? parseInt(value) : null
    }));
  };

  // Open product dialog for editing
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      active: product.active,
      categoryId: product.categoryId,
    });
    setIsProductDialogOpen(true);
  };

  // Open product dialog for creating
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductForm({
      name: "",
      price: 0,
      description: "",
      imageUrl: "",
      active: true,
      categoryId: null,
    });
    setIsProductDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handle category form change
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCategoryForm({ name: value });
  };

  // Handle category form submit
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryForm.name.trim() === "") {
      toast({
        title: "Erro",
        description: "O nome da categoria não pode estar vazio",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(categoryForm);
  };

  // Open category dialog for adding
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: "" });
    setIsCategoryDialogOpen(true);
  };

  // Open category delete dialog
  const handleDeleteCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Check if subscription is active
  const isSubscriptionActive = () => {
    if (!shopOwner) return false;
    return ["active", "trial"].includes(shopOwner.subscriptionStatus);
  };

  // Get subscription status message
  const getSubscriptionMessage = () => {
    if (!shopOwner) return "Carregando...";

    switch (shopOwner.subscriptionStatus) {
      case "active":
        return "Sua assinatura está ativa.";
      case "trial":
        return `Você está no período de trial${shopOwner.subscriptionExpiresAt ? ` que expira em ${formatDate(shopOwner.subscriptionExpiresAt).split(" ")[0]}` : ""}.`;
      case "expired":
        return "Seu período de trial expirou. Por favor, assine um plano para continuar.";
      case "inactive":
        return "Sua assinatura está inativa. Por favor, atualize seu pagamento.";
      default:
        return "Status de assinatura desconhecido.";
    }
  };

  // If store or products are loading, show loading state
  if (isLoadingStore || isLoadingProducts || isLoadingShopOwner || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If store data is loaded, update form values
  if (store && storeForm.name === "") {
    setStoreForm({
      name: store.name,
      description: store.description || "",
      whatsappNumber: store.whatsappNumber,
      instagramUrl: store.instagramUrl || "",
      facebookUrl: store.facebookUrl || "",
      showSocialMedia: store.showSocialMedia || false,
      slug: store.slug || "",
      theme: store.theme || {
        primary: "#FF0000",
        background: "#FFFFFF",
        text: "#1A1A1A",
        accent: "#FFD1E6",
      },
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-bold">Painel do Lojista</h1>
          <p className="text-gray-500">Gerencie sua loja e seus produtos</p>
        </div>
        <div className="flex items-center gap-2">
          {store && (
            <a href={store.slug ? `/loja/${store.slug}` : `/store/${store.id}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Store className="h-4 w-4" />
                Ver minha loja
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Subscription Warning Banner */}
      {!isSubscriptionActive() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Atenção:</strong> {getSubscriptionMessage()} Algumas funcionalidades podem estar limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="store">
        <TabsList className="mb-8">
          <TabsTrigger value="store">
            <Store className="w-4 h-4 mr-2" />
            Minha Loja
          </TabsTrigger>
          <TabsTrigger value="products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package2 className="w-4 h-4 mr-2" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <Banknote className="w-4 h-4 mr-2" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        {/* Store Tab */}
        <TabsContent value="store">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Atualize as informações básicas da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStoreSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome da Loja</Label>
                      <Input
                        id="name"
                        name="name"
                        value={storeForm.name}
                        onChange={handleStoreFormChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        name="description"
                        value={storeForm.description || ''}
                        onChange={handleStoreFormChange}
                        maxLength={100}
                        placeholder="Adicione uma breve descrição da sua loja"
                      />
                      <p className="text-sm text-gray-500">
                        {((storeForm.description?.length || 0) + '/100 caracteres')}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
                      <Input
                        id="whatsappNumber"
                        name="whatsappNumber"
                        placeholder="Somente números (ex: 11999999999)"
                        value={storeForm.whatsappNumber}
                        onChange={handleStoreFormChange}
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Este número será usado para recebimento de pedidos
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagramUrl">Instagram</Label>
                      <Input
                        id="instagramUrl"
                        name="instagramUrl"
                        placeholder="URL do Instagram (ex: https://instagram.com/sua_loja)"
                        value={storeForm.instagramUrl}
                        onChange={handleStoreFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="facebookUrl">Facebook</Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        placeholder="URL do Facebook (ex: https://facebook.com/sua_loja)"
                        value={storeForm.facebookUrl}
                        onChange={handleStoreFormChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">URL Personalizada</Label>
                      <Input
                        id="slug"
                        name="slug"
                        placeholder="URL amigável da sua loja (ex: minha-loja)"
                        value={storeForm.slug}
                        onChange={handleStoreFormChange}
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Este será o endereço personalizado da sua loja: grupocatalogos.com/loja/<span className="font-mono">{storeForm.slug}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showSocialMedia"
                        name="showSocialMedia"
                        checked={storeForm.showSocialMedia}
                        onCheckedChange={(checked) => {
                          setStoreForm(prev => ({
                            ...prev,
                            showSocialMedia: checked === true
                          }));
                        }}
                      />
                      <Label htmlFor="showSocialMedia" className="text-sm font-normal">
                        Exibir ícones de redes sociais na loja
                      </Label>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={updateStoreMutation.isPending || !isSubscriptionActive()}
                      className="mt-2"
                    >
                      {updateStoreMutation.isPending ? "Salvando..." : "Salvar Informações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo do Consultor</CardTitle>
                <CardDescription>
                  Adicione uma identidade visual à sua loja
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {store?.logoUrl ? (
                  <div className="mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={store.logoUrl}
                        alt="Logo do consultor"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", "/api/store", { logoUrl: null });
                          queryClient.setQueryData(["/api/store"], (oldData: any) => ({
                            ...oldData,
                            logoUrl: null
                          }));
                          toast({
                            title: "Logo removido",
                            description: "O logo foi removido com sucesso"
                          });
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Não foi possível remover o logo",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Remover Logo
                    </Button>
                  </div>
                ) : (
                  <div className="mb-4 w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <label
                  htmlFor="logo-upload"
                  className={`w-full ${
                    isSubscriptionActive()
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadLogoMutation.isPending
                      ? "Enviando..."
                      : "Carregar Novo Logo"}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={uploadLogoMutation.isPending || !isSubscriptionActive()}
                  />
                </label>
                {logoFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    {logoFile.name}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Company Logo Card */}
            <Card>
              <CardHeader>
                <CardTitle>Logo da Empresa</CardTitle>
                <CardDescription>
                  Adicione um logo da empresa (PNG sem fundo)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {store?.companyLogoUrl ? (
                  <div className="mb-4">
                    <div className="w-64 h-64 rounded bg-white flex items-center justify-center p-2 border">
                      <img
                        src={store.companyLogoUrl}
                        alt="Logo da empresa"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", "/api/store", { companyLogoUrl: null });
                          queryClient.setQueryData(["/api/store"], (oldData: any) => ({
                            ...oldData,
                            companyLogoUrl: null
                          }));
                          toast({
                            title: "Logo removido",
                            description: "O logo da empresa foi removido com sucesso"
                          });
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Não foi possível remover o logo da empresa",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Remover Logo da Empresa
                    </Button>
                  </div>
                ) : (
                  <div className="mb-4 w-64 h-64 rounded bg-white flex items-center justify-center border">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Recomendado: PNG sem fundo</p>
                    </div>
                  </div>
                )}
                <label
                  htmlFor="company-logo-upload"
                  className={`w-full ${
                    isSubscriptionActive()
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Logo da Empresa
                  </div>
                  <input
                    id="company-logo-upload"
                    type="file"
                    className="sr-only"
                    accept="image/png"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const file = files[0];
                        if (file.size > 800 * 1024) {
                          toast({
                            title: "Erro",
                            description: "O arquivo é muito grande. Máximo de 800KB.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (file.type !== 'image/png') {
                          toast({
                            title: "Formato inválido",
                            description: "Por favor, envie apenas arquivos PNG",
                            variant: "destructive"
                          });
                          return;
                        }

                        const formData = new FormData();
                        formData.append("companyLogo", file);

                        try {
                          console.log("Enviando formData com companyLogo:", file.name, file.type, file.size);
                          
                          const res = await fetch("/api/store/company-logo", {
                            method: "POST",
                            body: formData,
                            credentials: "include",
                          });

                          console.log("Resposta do servidor:", res.status, res.statusText);
                          
                          if (!res.ok) throw new Error("Erro ao enviar logo da empresa");

                          const data = await res.json();
                          queryClient.setQueryData(["/api/store"], (oldData: any) => ({
                            ...oldData,
                            companyLogoUrl: data.companyLogoUrl
                          }));
                          toast({
                            title: "Logo atualizado",
                            description: "O logo da empresa foi atualizado com sucesso!"
                          });
                        } catch (error) {
                          console.error("Erro ao enviar logo da empresa:", error);
                          toast({
                            title: "Erro",
                            description: "Não foi possível enviar o logo da empresa",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    disabled={!isSubscriptionActive()}
                  />
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categorias */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl">Categorias</CardTitle>
                  <CardDescription>
                    Gerencie suas categorias
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddCategory}
                  disabled={!isSubscriptionActive()}
                  variant="outline"
                  size="icon"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {categories?.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-2">
                      Sem categorias
                    </p>
                    <Button
                      onClick={handleAddCategory}
                      disabled={!isSubscriptionActive()}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Adicionar categoria
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories?.map((category) => (
                      <div 
                        key={category.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent group"
                      >
                        <span className="text-sm">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteCategoryClick(category)}
                          disabled={!isSubscriptionActive()}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produtos */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Meus Produtos</CardTitle>
                  <CardDescription>
                    Gerencie os produtos disponíveis em sua loja
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddProduct}
                  disabled={!isSubscriptionActive() || (products && products.length >= 30)}
                  variant="outline"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {product.imageUrl && (
                                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 mr-3">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div>{product.name}</div>
                                {product.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                product.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {product.active ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                                disabled={!isSubscriptionActive()}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(product)}
                                disabled={!isSubscriptionActive()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Nenhum produto cadastrado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Comece adicionando seu primeiro produto à loja
                  </p>
                  <Button
                    onClick={handleAddProduct}
                    disabled={!isSubscriptionActive()}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              )}
            </CardContent>
            {products && products.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="text-sm text-gray-500">
                  {products.length} produto(s) de {shopOwner?.productLimit ?? 30} permitidos
                </div>
              </CardFooter>
            )}
          </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recebidos</CardTitle>
              <CardDescription>
                Visualize e gerencie os pedidos da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-500">
                              Pedido #{order.id}
                            </div>
                            <CardTitle className="text-lg">
                              {order.customerName}
                            </CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="font-bold text-lg">
                              {formatCurrency(order.total)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">
                              Itens
                            </h4>
                            <ul className="space-y-1">
                              {order.items.map((item) => (
                                <li key={item.id} className="text-sm flex justify-between">
                                  <span>
                                    {item.quantity}x {item.productName}
                                  </span>
                                  <span className="text-gray-600">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Entrega
                              </h4>
                              <p className="text-sm">
                                {order.deliveryMethod === "delivery"
                                  ? "Entrega"
                                  : "Retirada"}
                              </p>
                              {order.customerAddress && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.customerAddress}
                                </p>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Contato
                              </h4>
                              <p className="text-sm">{order.customerName}</p>
                              {order.customerPhone && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>

                          {order.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">
                                Observações
                              </h4>
                              <p className="text-sm text-gray-600">
                                {order.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 flex justify-end border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${store?.whatsappNumber}?text=${encodeURIComponent(
                              `Olá ${order.customerName}! Estou entrando em contato sobre seu pedido #${order.id}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Contatar Cliente
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Nenhum pedido recebido
                  </h3>
                  <p className="text-gray-500">
                    Os pedidos dos clientes aparecerão aqui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Minha Assinatura</CardTitle>
              <CardDescription>
                Gerencie sua assinatura e forma de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Plano Moments Paris
                </h3>
                <p className="text-gray-500 mb-4">
                  Acesso completo a todas as funcionalidades da plataforma
                </p>

                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">R$ 29,90</span>
                  <span className="text-gray-500 ml-1">/mês</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Até {shopOwner?.productLimit ?? 30} produtos</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">AtÃ© {shopOwner?.productLimit ?? 30} produtos</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">PersonalizaÃ§Ã£o da loja</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">IntegraÃ§Ã£o com WhatsApp</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Gerenciamento de pedidos</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Status da Assinatura
                  </h4>
                  <div className="flex items-center mb-1">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        isSubscriptionActive()
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={
                        isSubscriptionActive()
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {shopOwner?.subscriptionStatus === "active"
                        ? "Ativa"
                        : shopOwner?.subscriptionStatus === "trial"
                        ? "PerÃ­odo de Trial"
                        : shopOwner?.subscriptionStatus === "expired"
                        ? "Expirada"
                        : "Inativa"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getSubscriptionMessage()}</p>
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-sm flex justify-between">
                      <span className="font-medium text-gray-700">Limite de produtos:</span>
                      <span className="text-indigo-600 font-medium">
                        {shopOwner?.productLimit ?? 30} produtos
                      </span>
                    </p>
                  </div>
                </div>

                {!isSubscriptionActive() && (
                  <Button className="w-full">
                    Assinar Agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Product Add/Edit Dialog */}
      <Dialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Editar Produto" : "Adicionar Produto"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? "Atualize as informaÃ§Ãµes do produto"
                : "Preencha as informaÃ§Ãµes do novo produto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productName">Nome do Produto</Label>
                <Input
                  id="productName"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productPrice">PreÃ§o (R$)</Label>
                <Input
                  id="productPrice"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={handleProductFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productCategory">Categoria</Label>
                <Select
                  value={productForm.categoryId?.toString() || ""}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem categoria</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productDescription">DescriÃ§Ã£o</Label>
                <Textarea
                  id="productDescription"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Imagem do Produto</Label>
                <div className="flex items-center space-x-4">
                  {productForm.imageUrl ? (
                    <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="product-image-upload"
                    className="cursor-pointer"
                  >
                    <div className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      {uploadProductImageMutation.isPending
                        ? "Enviando..."
                        : "Carregar Imagem"}
                    </div>
                    <input
                      id="product-image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      disabled={uploadProductImageMutation.isPending}
                    />
                  </label>
                </div>
                {productImageFile && (
                  <p className="text-sm text-gray-500">
                    {productImageFile.name}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="productActive"
                  checked={productForm.active}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="productActive" className="cursor-pointer">
                  Produto ativo (visÃ­vel na loja)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={saveProductMutation.isPending}
              >
                {saveProductMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Salvando...
                  </span>
                ) : (
                  "Salvar Produto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar ExclusÃ£o</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto{" "}
              <strong>{selectedProduct?.name}</strong>? Esta aÃ§Ã£o nÃ£o pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedProduct && deleteProductMutation.mutate(selectedProduct.id)}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Excluindo...
                </span>
              ) : (
                "Sim, Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Adicionar Categoria
            </DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar seus produtos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input
                  id="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  placeholder="Ex: Perfumes, Skincare, etc."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog
        open={isDeleteCategoryDialogOpen}
        onOpenChange={setIsDeleteCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar ExclusÃ£o</DialogTitle>
            <DialogDescription>
              VocÃª tem certeza que deseja excluir a categoria "{selectedCategory?.name}"? 
              Esta aÃ§Ã£o nÃ£o pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (selectedCategory) {
                  deleteCategoryMutation.mutate(selectedCategory.id);
                }
              }}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending
                ? "Excluindo..."
                : "Excluir Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
