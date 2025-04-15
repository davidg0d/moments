import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type RoleType = "admin" | "shopowner" | "customer" | undefined;

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: RoleType[];
}) {
  const { user, isLoading } = useAuth();

  // Loader enquanto verifica autenticação
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Sem usuário => redireciona para login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Se não houver restrição de roles, ou se o usuário tiver a role necessária
  if (!roles || roles.includes(user.role as RoleType)) {
    return <Route path={path} component={Component} />;
  }

  // Se o usuário não tiver a role necessária
  return (
    <Route path={path}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Acesso negado</h1>
        <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Voltar
        </button>
      </div>
    </Route>
  );
}