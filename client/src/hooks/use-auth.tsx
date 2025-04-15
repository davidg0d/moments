import { createContext, ReactNode, useContext, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

// Função para obter o usuário do localStorage, se disponível
const getUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Erro ao recuperar usuário do localStorage:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Inicializa o estado do usuário a partir do localStorage
  const [user, setUser] = useState<User | null>(getUserFromStorage());

  // Atualiza o usuário no estado e no localStorage
  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Credenciais inválidas");
        }

        const userData = await res.json();
        return userData;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (userData: User) => {
      updateUser(userData);
      queryClient.invalidateQueries();
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userData.username}!`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Erro ao autenticar. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao fazer logout");
        }
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      updateUser(null);
      queryClient.invalidateQueries();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sair",
        description: error.message || "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Erro ao registrar usuário");
        }

        return await res.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (userData: User) => {
      updateUser(userData);
      queryClient.invalidateQueries();
      toast({
        title: "Registro realizado com sucesso",
        description: `Bem-vindo, ${userData.username}!`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no registro",
        description: error.message || "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}