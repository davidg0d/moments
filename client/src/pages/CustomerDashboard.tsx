import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package2, Store, User, FileText, ShoppingBag, ExternalLink } from "lucide-react";

type Order = {
  id: number;
  customerId: number;
  storeId: number;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryMethod: string;
  notes: string | null;
  total: number;
  createdAt: string;
  items: {
    id: number;
    productName: string;
    price: number;
    quantity: number;
  }[];
  store: {
    id: number;
    name: string;
    logoUrl: string | null;
  };
};

type Store = {
  id: number;
  name: string;
  logoUrl: string | null;
  whatsappNumber: string;
  active: boolean;
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  // Fetch user orders
  const { 
    data: orders, 
    isLoading: isLoadingOrders 
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return res.json();
    },
    refetchInterval: 10000, // Refaz a consulta a cada 10 segundos
    refetchOnWindowFocus: true, // Refaz a consulta quando o usuário volta à janela
  });

  // Fetch all stores
  const { 
    data: stores, 
    isLoading: isLoadingStores 
  } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stores");
      return res.json();
    },
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
      <p className="text-gray-500 mb-6">Gerencie seu perfil e veja seus pedidos</p>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">
            <FileText className="w-4 h-4 mr-2" />
            Meus Pedidos
          </TabsTrigger>
          <TabsTrigger value="stores">
            <Store className="w-4 h-4 mr-2" />
            Lojas
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>
                  Veja o histórico de pedidos que você realizou
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
                        <CardHeader className="bg-gray-50 pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {order.store.logoUrl && (
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 mr-3">
                                  <img
                                    src={order.store.logoUrl}
                                    alt={order.store.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div className="text-sm text-gray-500">
                                  Pedido #{order.id} • {formatDate(order.createdAt)}
                                </div>
                                <CardTitle className="text-lg">
                                  {order.store.name}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="text-right">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <h4 className="font-medium text-gray-500 mb-1">
                                  Entrega
                                </h4>
                                <p>
                                  {order.deliveryMethod === "delivery"
                                    ? "Entrega"
                                    : "Retirada"}
                                </p>
                                {order.customerAddress && (
                                  <p className="text-gray-600 mt-1">
                                    {order.customerAddress}
                                  </p>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-500 mb-1">
                                  Seus Dados
                                </h4>
                                <p>{order.customerName}</p>
                                {order.customerPhone && (
                                  <p className="text-gray-600 mt-1">
                                    {order.customerPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 justify-end border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/store/${order.store.id}`}>
                              <Store className="w-4 h-4 mr-2" />
                              Visitar Loja
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Nenhum pedido realizado
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Você ainda não fez nenhum pedido
                    </p>
                    <Button asChild>
                      <a href="/">Explorar Lojas</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Lojas Disponíveis</CardTitle>
                <CardDescription>
                  Explore as lojas disponíveis na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStores ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : stores && stores.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stores.map((store) => (
                      <Card key={store.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="h-20 w-20 object-contain"
                            />
                          ) : (
                            <ShoppingBag className="h-12 w-12 text-primary/40" />
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle>{store.name}</CardTitle>
                        </CardHeader>
                        <CardFooter className="pt-0">
                          <Button asChild>
                            <a href={`/store/${store.id}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visitar Loja
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Nenhuma loja disponível
                    </h3>
                    <p className="text-gray-500">
                      No momento não há lojas disponíveis na plataforma
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled
                      />
                      <p className="text-xs text-gray-500">
                        O email não pode ser alterado
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        placeholder="(99) 99999-9999"
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={profileForm.address}
                      placeholder="Endereço completo"
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, address: e.target.value })
                      }
                    />
                  </div>
                  <Button className="w-full md:w-auto">
                    Salvar Informações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}