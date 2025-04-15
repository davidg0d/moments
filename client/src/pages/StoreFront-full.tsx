import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ShoppingBag, Plus, Minus, Trash2, Check } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  active: boolean;
  categoryId: number | null;
};

type Store = {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  whatsappNumber: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  showSocialMedia: boolean;
  active: boolean;
  slug: string | null;
  theme: {
    background?: string;
    text?: string;
    primary?: string;
    accent?: string;
  } | null;
  bannerUrl: string | null;
  companyLogoUrl: string | null;
};

type CartItem = {
  productId: number;
  product: Product;
  quantity: number;
};

// Esquema de validação para o formulário de checkout
const checkoutFormSchema = z.object({
  customerName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  customerPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  customerAddress: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["pix", "cash", "card"]),
  notes: z.string().optional(),
});

// Tipo derivado do esquema para o formulário de checkout
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type Category = {
  id: number;
  name: string;
  storeId: number;
};

export default function StoreFront() {
  // Obter parâmetros da URL
  const { storeId, slug } = useParams();
  const [, setLocation] = useLocation();

  // Estado local
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loadedStoreId, setLoadedStoreId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Formulário de checkout
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerPhone: "",
      customerAddress: "",
      deliveryMethod: "pickup",
      paymentMethod: "pix",
      notes: "",
    },
  });

  // Buscar informações da loja (pela ID ou pelo slug)
  const { data: store, isLoading: isLoadingStore } = useQuery<Store>({
    queryKey: slug ? ["/api/stores/slug", slug] : ["/api/stores", parseInt(storeId || "0")],
    queryFn: async () => {
      let res;
      if (slug) {
        res = await apiRequest("GET", `/api/stores/slug/${slug}`);
      } else if (storeId) {
        res = await apiRequest("GET", `/api/stores/${storeId}`);
      } else {
        throw new Error("ID da loja ou slug não fornecido");
      }
      const storeData = await res.json();
      setLoadedStoreId(storeData.id);
      return storeData;
    },
    enabled: !!storeId || !!slug,
  });

  // Buscar produtos da loja
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/stores", loadedStoreId, "products"],
    queryFn: async () => {
      if (!loadedStoreId) throw new Error("ID da loja não disponível");
      const res = await apiRequest("GET", `/api/stores/${loadedStoreId}/products`);
      return res.json();
    },
    enabled: !!loadedStoreId,
  });

  // Buscar categorias da loja
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/stores", loadedStoreId, "categories"],
    queryFn: async () => {
      if (!loadedStoreId) throw new Error("ID da loja não disponível");
      const res = await apiRequest("GET", `/api/stores/${loadedStoreId}/categories`);
      return res.json();
    },
    enabled: !!loadedStoreId,
  });

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      // Verificar se o produto já está no carrinho
      const existingItem = prev.find((item) => item.productId === product.id);

      if (existingItem) {
        // Incrementar a quantidade se já existir
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Adicionar novo item ao carrinho
        return [...prev, { productId: product.id, product, quantity: 1 }];
      }
    });

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };

  // Remover produto do carrinho
  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Atualizar quantidade do produto no carrinho
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calcular total do carrinho
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Enviar pedido (não registrado)
  const handleNonAuthCheckout = (data: CheckoutFormValues) => {
    // Se a loja não tiver WhatsApp, mostrar erro
    if (!store?.whatsappNumber) {
      toast({
        title: "Erro ao finalizar pedido",
        description: "Esta loja não possui um número de WhatsApp configurado",
        variant: "destructive",
      });
      return;
    }

    // Preparar mensagem para o WhatsApp
    const orderItems = cartItems
      .map((item) => `• ${item.quantity}x ${item.product.name} - ${formatCurrency(item.product.price * item.quantity)}`)
      .join("\n");

    const deliveryText = data.deliveryMethod === "delivery"
      ? `Entrega para: ${data.customerAddress}`
      : "Retirada na loja";

    let paymentMethodText = "";
    switch (data.paymentMethod) {
      case "pix":
        paymentMethodText = "Pix";
        break;
      case "cash":
        paymentMethodText = "Dinheiro";
        break;
      case "card":
        paymentMethodText = "Cartão de Crédito/Débito";
        break;
    }

    const message = `🛍️ *NOVO PEDIDO - ${store.name}* 🛍️\n\n` +
      `👤 *Cliente:* ${data.customerName}\n` +
      `📞 *Telefone:* ${data.customerPhone}\n` +
      `📍 *${deliveryText}*\n` +
      `💰 *Forma de Pagamento:* ${paymentMethodText}\n\n` +
      `🛒 *ITENS DO PEDIDO:*\n${orderItems}\n\n` +
      `💵 *TOTAL: ${formatCurrency(cartTotal)}*\n\n` +
      (data.notes ? `📝 *Observações:* ${data.notes}\n\n` : "") +
      `✅ Obrigado pelo seu pedido! ✅`;

    // Redirecionar para o WhatsApp
    const whatsappUrl = `https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

    // Marcar checkout como concluído
    setCheckoutSuccess(true);

    // Abrir WhatsApp em nova janela
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");

      // Limpar carrinho após enviar pedido
      setCartItems([]);
      setIsCheckoutOpen(false);

      // Resetar estado para próximo pedido
      setTimeout(() => {
        setCheckoutSuccess(false);
      }, 3000);
    }, 1500);
  };

  if (isLoadingStore || isLoadingProducts || isLoadingCategories) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!store || !products || !categories) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">
            A loja que você está procurando não existe ou não está disponível.
          </p>
          <Button onClick={() => setLocation("/")}>Voltar para o início</Button>
        </div>
      </div>
    );
  }

  if (!store.active) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loja inativa</h1>
          <p className="text-gray-600 mb-6">
            Esta loja está temporariamente indisponível.
          </p>
          <Button onClick={() => setLocation("/")}>Voltar para o início</Button>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(product => product.active);

  return (
    <div className="min-h-screen" style={{
      backgroundColor: store?.theme?.background || "#FFFFFF",
      color: store?.theme?.text || "#1A1A1A",
      "--primary-color": store?.theme?.primary || "#DC2626",
      "--accent-color": store?.theme?.accent || "#FEE2E2",
    } as React.CSSProperties}>
      <header>
        <div className="container mx-auto px-4 py-10 bg-red-600 shadow-md text-white">
          <div className="flex flex-col md:flex-row items-center justify-between md:justify-between gap-6 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {store.logoUrl && (
                <div className="h-40 w-40 overflow-hidden rounded-full bg-gray-100 border-4 border-white shadow-xl">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{store.name}</h1>
                <p className="text-base md:text-lg text-white mt-2 mb-3">
                  {store.description || "Bem-vindo a minha Lojinha Virtual da Moments Paris"}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                  <div>
                    {store.whatsappNumber && (
                      <a
                        href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-md transition-colors text-base font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                  {store.showSocialMedia && (
                    <div className="flex items-center gap-3">
                    {store.instagramUrl && (
                      <a
                        href={store.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {store.facebookUrl && (
                      <a
                        href={store.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-gray-200 bg-blue-600 p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Logo da Empresa (área destacada em azul) */}
            <div className="w-48 h-32 flex justify-center items-center">
              {store.companyLogoUrl ? (
                <img
                  src={store.companyLogoUrl}
                  alt={`Logo da empresa ${store.name}`}
                  className="max-h-32 max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <ShoppingBag className="w-8 h-8 text-white/70" />
                  </div>
                  <p className="text-xs text-white/70">Logo da empresa</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Cart Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="relative bg-red-500 hover:bg-red-600 text-white rounded-full h-14 w-14 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs text-white">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Seu Carrinho</SheetTitle>
              <SheetDescription>
                {cartItems.length === 0
                  ? "Seu carrinho está vazio"
                  : `${cartItems.length} ${cartItems.length === 1 ? "item" : "itens"} no carrinho`}
              </SheetDescription>
            </SheetHeader>

            {cartItems.length > 0 ? (
              <>
                <div className="my-6 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="mb-4 flex items-center justify-between border-b pb-4">
                      <div className="flex items-center">
                        {item.product.imageUrl && (
                          <div className="mr-3 h-16 w-16 overflow-hidden rounded bg-gray-100">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.product.price)}
                          </p>
                          <div className="mt-1 flex items-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-2 w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    Finalizar Pedido
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
                <p className="text-center text-gray-500">
                  Seu carrinho está vazio. Adicione produtos para fazer um pedido.
                </p>
                <Button>Continuar Comprando</Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Catálogo de produtos */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Produtos</h2>
        
        {/* Barra de pesquisa e filtros */}
        <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
          {/* Campo de pesquisa */}
          <div className="relative w-full md:w-1/2">
            <Input
              type="text"
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Menu de categorias */}
          {categories.length > 0 && (
            <div className="w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-[200px] justify-between">
                    <span>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "Todas Categorias"}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                    Todas Categorias
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {activeProducts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-gray-500">
              Esta loja ainda não possui produtos cadastrados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeProducts
              .filter(product => 
                // Filtro de categoria
                (selectedCategory === null || product.categoryId === selectedCategory) &&
                // Filtro de pesquisa por nome
                (searchQuery.trim() === "" || 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
              )
              .map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.imageUrl && (
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">
                      {formatCurrency(product.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {product.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Adicionar ao Carrinho
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </main>

      {/* Modal de Checkout para clientes não logados */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
            <DialogDescription>
              Preencha seus dados para concluir o pedido.
            </DialogDescription>
          </DialogHeader>

          {checkoutSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-1 text-lg font-medium">Pedido Realizado!</h3>
              <p className="text-gray-500">
                Você será redirecionado para o WhatsApp para confirmar seu pedido.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNonAuthCheckout)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(99) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Entrega</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pickup" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Retirar na loja
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="delivery" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Entrega
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("deliveryMethod") === "delivery" && (
                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço de Entrega</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Rua, número, bairro, cidade, etc."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pix" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Pix
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cash" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Dinheiro
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="card" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Cartão de Crédito/Débito
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alguma observação para o seu pedido?"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Resumo do pedido:</div>
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>{formatCurrency(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
                    Finalizar e Enviar pelo WhatsApp
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}