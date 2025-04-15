import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AdminDashboard from "@/pages/AdminDashboard";
import ShopOwnerDashboard from "@/pages/ShopOwnerDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StoreFront from "@/pages/StoreFront";

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/store/:storeId" component={StoreFront} />
      <Route path="/loja/:slug" component={StoreFront} />
      
      {/* Rotas protegidas por papel (role) */}
      <Route path="/" component={Home} />
      
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        roles={["admin"]}
      />
      
      <ProtectedRoute 
        path="/dashboard" 
        component={ShopOwnerDashboard} 
        roles={["shopowner"]}
      />
      
      <ProtectedRoute 
        path="/account" 
        component={CustomerDashboard} 
        roles={["customer"]}
      />
      
      {/* Rota para página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
