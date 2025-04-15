import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Store, ShoppingBag, BarChart3, Activity, CheckCircle, XCircle, Calendar, Copy, CheckCheck, AlertTriangle, LogOut, Package, Trash2 } from "lucide-react";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  shopOwner?: {
    id: number;
    subscriptionStatus: "active" | "inactive" | "trial" | "expired";
    subscriptionExpiresAt: string | null;
    productLimit: number;
  };
  store?: {
    id: number;
    name: string;
    active: boolean;
  };
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
  ownerId?: number;
  slug?: string; // Added slug property
};

type Stats = {
  stores: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    shopOwners: number;
    customers: number;
    admins: number;
  };
  products: {
    total: number;
    average: number;
  };
  orders: {
    total: number;
  };
};

type CloneStoreFormData = {
  sourceStoreId: number;
  targetStoreId: number;
};

type SubscriptionFormData = {
  shopOwnerId: number;
  status: "active" | "inactive" | "trial" | "expired";
  expiresAt: string;
  productLimit: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [cloneFormData, setCloneFormData] = useState<CloneStoreFormData>({
    sourceStoreId: 0,
    targetStoreId: 0,
  });
  const [subscriptionFormData, setSubscriptionFormData] = useState<SubscriptionFormData>({
    shopOwnerId: 0,
    status: "active",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 30 days from now
    productLimit: 30,
  });
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showEditStoreDialog, setShowEditStoreDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    whatsappNumber: "",
    logoUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    showSocialMedia: false
  });
  
  const [showCreateShopOwnerDialog, setShowCreateShopOwnerDialog] = useState(false);
  const [createShopOwnerForm, setCreateShopOwnerForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    storeName: "",
    whatsappNumber: ""
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users", null, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        forceRefresh: true
      });
      return res.json();
    },
    refetchInterval: 3000, // Recarrega a cada 3 segundos
    staleTime: 0, // Considera os dados desatualizados imediatamente
  });

  // Fetch all stores
  const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stores", null, {
        forceRefresh: true
      });
      return res.json();
    },
    staleTime: 0 // Considera os dados desatualizados imediatamente
  });

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats", null, {
        forceRefresh: true
      });
      return res.json();
    },
    refetchInterval: 5000, // Refaz a consulta a cada 5 segundos
    refetchOnWindowFocus: true, // Refaz a consulta quando o usuário volta à janela
    staleTime: 0 // Considera os dados desatualizados imediatamente
  });

  // Toggle store status mutation
  const toggleStoreMutation = useMutation({
    mutationFn: async ({ storeId, active }: { storeId: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/stores/${storeId}/status`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "Status atualizado",
        description: "O status da loja foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status da loja",
        variant: "destructive",
      });
    },
  });

  // Clone store catalog mutation
  const cloneStoreMutation = useMutation({
    mutationFn: async ({ sourceStoreId, targetStoreId }: CloneStoreFormData) => {
      const res = await apiRequest("POST", `/api/admin/stores/${sourceStoreId}/clone/${targetStoreId}`);
      return res.json();
    },
    onSuccess: (data) => {
      setShowCloneDialog(false);
      toast({
        title: "Catálogo clonado",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível clonar o catálogo",
        variant: "destructive",
      });
    },
  });

  // Update subscription status mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ shopOwnerId, status, expiresAt, productLimit }: SubscriptionFormData) => {
      const res = await apiRequest("PATCH", `/api/admin/shopowners/${shopOwnerId}/subscription`, { 
        status, 
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        productLimit
      });
      return res.json();
    },
    onSuccess: () => {
      setShowSubscriptionDialog(false);
      // Invalidar múltiplas queries para garantir que os dados sejam atualizados em todos os lugares
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop-owner"] });
      
      // Forçar um refetch completo dos dados
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      }, 100);
      
      toast({
        title: "Assinatura atualizada",
        description: "O status da assinatura e o limite de produtos foram atualizados com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a assinatura",
        variant: "destructive",
      });
    },
  });

  // Update store details mutation
  const updateStoreMutation = useMutation({
    mutationFn: async ({ storeId, name, whatsappNumber, logoUrl, instagramUrl, facebookUrl, showSocialMedia }: { storeId: number, name: string, whatsappNumber: string, logoUrl?: string, instagramUrl?: string, facebookUrl?: string, showSocialMedia?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/stores/${storeId}`, { 
        name, 
        whatsappNumber,
        logoUrl,
        instagramUrl,
        facebookUrl,
        showSocialMedia
      });
      return res.json();
    },
    onSuccess: () => {
      setShowEditStoreDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "Loja atualizada",
        description: "Os detalhes da loja foram atualizados com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar os detalhes da loja",
        variant: "destructive",
      });
    },
  });

  // Upload store logo mutation
  const uploadStoreLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await apiRequest("POST", "/api/admin/stores/logo", formData);
      return res.json();
    },
    onSuccess: (data) => {
      setStoreFormData(prev => ({ ...prev, logoUrl: data.logoUrl }));
      toast({
        title: "Logo enviado",
        description: "O logo foi enviado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o logo",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      
      toast({
        title: "Usuário excluído",
        description: "O usuário e seus dados associados foram excluídos com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    },
  });

  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível e também excluirá a loja e todos os dados associados.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Handle toggle store status
  const handleToggleStore = (storeId: number, currentStatus: boolean) => {
    toggleStoreMutation.mutate({ storeId, active: !currentStatus });
  };

  // Handle clone store form
  const handleCloneStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneFormData.sourceStoreId || !cloneFormData.targetStoreId) {
      toast({
        title: "Dados inválidos",
        description: "Selecione as lojas de origem e destino",
        variant: "destructive",
      });
      return;
    }
    cloneStoreMutation.mutate(cloneFormData);
  };

  // Handle subscription form
  const handleUpdateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionFormData.shopOwnerId || !subscriptionFormData.status) {
      toast({
        title: "Dados inválidos",
        description: "Selecione o lojista e o status da assinatura",
        variant: "destructive",
      });
      return;
    }
    updateSubscriptionMutation.mutate(subscriptionFormData);
  };

  // Open subscription dialog
  const openSubscriptionDialog = (shopOwnerId: number, currentStatus: string, expiresAt: string | null, productLimit: number = 30) => {
    setSubscriptionFormData({
      shopOwnerId,
      status: currentStatus as "active" | "inactive" | "trial" | "expired",
      expiresAt: expiresAt ? new Date(expiresAt).toISOString().substring(0, 10) : 
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      productLimit: productLimit
    });
    setShowSubscriptionDialog(true);
  };

  // Get subscription status badge
  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1" /> Ativa</span>;
      case "trial":
        return <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"><Activity className="w-3 h-3 mr-1" /> Trial</span>;
      case "expired":
        return <span className="inline-flex items-center bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium"><AlertTriangle className="w-3 h-3 mr-1" /> Expirada</span>;
      case "inactive":
        return <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium"><XCircle className="w-3 h-3 mr-1" /> Inativa</span>;
      default:
        return <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Desconhecido</span>;
    }
  };

  // Format date in pt-BR
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definido";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Loading state
  if (isLoadingUsers || isLoadingStores || isLoadingStats) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="stores">Lojas</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Lojas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.stores.total || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-gray-600">{stats?.stores.active || 0} ativas</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Lojistas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.users.shopOwners || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-gray-600">De {stats?.users.total || 0} usuários</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.products.total || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  <ShoppingBag className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-gray-600">Média: {stats?.products.average || 0}/loja</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.orders.total || 0}</div>
                <div className="flex items-center mt-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-gray-600">Total de pedidos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Lojistas</CardTitle>
                <CardDescription>
                  Visualize e gerencie os lojistas e suas assinaturas
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateShopOwnerDialog(true)}>
                Criar Lojista
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.filter(user => user.role === "shopowner").map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.store ? (
                            <span className={user.store.active ? "text-green-600" : "text-red-600"}>
                              {user.store.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sem loja</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.shopOwner ? (
                            getSubscriptionBadge(user.shopOwner.subscriptionStatus)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.shopOwner?.subscriptionExpiresAt ? (
                            formatDate(user.shopOwner.subscriptionExpiresAt)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.shopOwner?.productLimit ? (
                            <span className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                              <Package className="w-3 h-3 mr-1" /> {user.shopOwner.productLimit}
                            </span>
                          ) : (
                            <span className="text-gray-400">30</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {user.shopOwner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => 
                                  openSubscriptionDialog(
                                    user.shopOwner!.id, 
                                    user.shopOwner!.subscriptionStatus, 
                                    user.shopOwner!.subscriptionExpiresAt,
                                    user.shopOwner!.productLimit
                                  )
                                }
                              >
                                Gerenciar
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.filter(user => user.role === "shopowner").length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          Nenhum lojista encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Lojas</CardTitle>
              <CardDescription>
                Visualize e gerencie as lojas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores && stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell>{store.name}</TableCell>
                        <TableCell>{store.whatsappNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={store.active}
                              onCheckedChange={() => handleToggleStore(store.id, store.active)}
                              disabled={toggleStoreMutation.isPending}
                            />
                            <span className={store.active ? "text-green-600" : "text-red-600"}>
                              {store.active ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a 
                                href={`/loja/${store.slug || store.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visualizar
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingStore(store);
                                setStoreFormData({
                                  name: store.name,
                                  whatsappNumber: store.whatsappNumber,
                                  logoUrl: store.logoUrl || "",
                                  instagramUrl: store.instagramUrl || "",
                                  facebookUrl: store.facebookUrl || "",
                                  showSocialMedia: store.showSocialMedia || false
                                });
                                setShowEditStoreDialog(true);
                              }}
                            >
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stores || stores.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          Nenhuma loja encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clonar Catálogo</CardTitle>
                <CardDescription>
                  Copie todos os produtos de uma loja para outra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  onClick={() => setShowCloneDialog(true)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Iniciar clonagem
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Clone Store Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Catálogo</DialogTitle>
            <DialogDescription>
              Copie todos os produtos de uma loja para outra. Produtos existentes na loja de destino não serão afetados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCloneStore}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="sourceStore">Loja de origem</Label>
                <Select
                  value={cloneFormData.sourceStoreId.toString() || undefined}
                  onValueChange={(value) => 
                    setCloneFormData({ ...cloneFormData, sourceStoreId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores && stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetStore">Loja de destino</Label>
                <Select
                  value={cloneFormData.targetStoreId.toString() || undefined}
                  onValueChange={(value) => 
                    setCloneFormData({ ...cloneFormData, targetStoreId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores && stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  cloneStoreMutation.isPending || 
                  !cloneFormData.sourceStoreId || 
                  !cloneFormData.targetStoreId ||
                  cloneFormData.sourceStoreId === cloneFormData.targetStoreId
                }
              >
                {cloneStoreMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processando...
                  </span>
                ) : (
                  "Clonar Catálogo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Store Dialog */}
      <Dialog open={showEditStoreDialog} onOpenChange={setShowEditStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da loja
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editingStore) return;

            updateStoreMutation.mutate({ 
              storeId: editingStore.id,
              name: storeFormData.name,
              whatsappNumber: storeFormData.whatsappNumber,
              logoUrl: storeFormData.logoUrl || undefined,
              instagramUrl: storeFormData.instagramUrl || undefined,
              facebookUrl: storeFormData.facebookUrl || undefined,
              showSocialMedia: storeFormData.showSocialMedia
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Loja</Label>
                <Input
                  id="name"
                  value={storeFormData.name}
                  onChange={(e) => setStoreFormData({...storeFormData, name: e.target.value})}
                  placeholder="Nome da loja"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  value={storeFormData.whatsappNumber}
                  onChange={(e) => setStoreFormData({...storeFormData, whatsappNumber: e.target.value})}
                  placeholder="(99) 99999-9999"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logo">Logo do Consultor</Label>
                <div className="flex items-center gap-4">
                  {storeFormData.logoUrl && (
                    <div className="h-16 w-16 relative rounded overflow-hidden border">
                      <img
                        src={storeFormData.logoUrl}
                        alt="Logo do consultor"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadStoreLogo.mutate(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={storeFormData.instagramUrl}
                  onChange={(e) => setStoreFormData({...storeFormData, instagramUrl: e.target.value})}
                  placeholder="https://instagram.com/seuperfil"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  value={storeFormData.facebookUrl}
                  onChange={(e) => setStoreFormData({...storeFormData, facebookUrl: e.target.value})}
                  placeholder="https://facebook.com/seuperfil"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showSocialMedia"
                  checked={storeFormData.showSocialMedia}
                  onCheckedChange={(checked) => setStoreFormData({...storeFormData, showSocialMedia: checked})}
                />
                <Label htmlFor="showSocialMedia">Exibir redes sociais na loja</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateStoreMutation.isPending || uploadStoreLogo.isPending}
              >
                {updateStoreMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processando...
                  </span>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Assinatura</DialogTitle>
            <DialogDescription>
              Atualize o status e a data de expiração da assinatura do lojista
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubscription}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status da Assinatura</Label>
                <Select
                  value={subscriptionFormData.status}
                  onValueChange={(value) => 
                    setSubscriptionFormData({ 
                      ...subscriptionFormData, 
                      status: value as "active" | "inactive" | "trial" | "expired" 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productLimit">Limite de Produtos</Label>
                <Select
                  value={subscriptionFormData.productLimit.toString()}
                  onValueChange={(value) => 
                    setSubscriptionFormData({ 
                      ...subscriptionFormData, 
                      productLimit: Number(value)
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o limite de produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 produtos</SelectItem>
                    <SelectItem value="50">50 produtos</SelectItem>
                    <SelectItem value="100">100 produtos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Data de Expiração</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={subscriptionFormData.expiresAt}
                  onChange={(e) => 
                    setSubscriptionFormData({ 
                      ...subscriptionFormData, 
                      expiresAt: e.target.value 
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateSubscriptionMutation.isPending}
              >
                {updateSubscriptionMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processando...
                  </span>
                ) : (
                  "Atualizar Assinatura"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Shop Owner Dialog */}
      <Dialog open={showCreateShopOwnerDialog} onOpenChange={setShowCreateShopOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Lojista</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo lojista e sua loja
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await apiRequest("POST", "/api/admin/shopowners", createShopOwnerForm);
              if (!res.ok) throw new Error("Falha ao criar lojista");
              
              queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
              queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
              setShowCreateShopOwnerDialog(false);
              toast({
                title: "Lojista criado",
                description: "O lojista e sua loja foram criados com sucesso",
              });
            } catch (error) {
              toast({
                title: "Erro",
                description: "Não foi possível criar o lojista",
                variant: "destructive",
              });
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={createShopOwnerForm.name}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, name: e.target.value})}
                  placeholder="Nome do lojista"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createShopOwnerForm.email}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={createShopOwnerForm.username}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, username: e.target.value})}
                  placeholder="usuario"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={createShopOwnerForm.password}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, password: e.target.value})}
                  placeholder="********"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  value={createShopOwnerForm.storeName}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, storeName: e.target.value})}
                  placeholder="Nome da loja"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsappNumber">WhatsApp da Loja</Label>
                <Input
                  id="whatsappNumber"
                  value={createShopOwnerForm.whatsappNumber}
                  onChange={(e) => setCreateShopOwnerForm({...createShopOwnerForm, whatsappNumber: e.target.value})}
                  placeholder="(99) 99999-9999"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                Criar Lojista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}