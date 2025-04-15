import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

// Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Schemas
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Nome de usuário deve ter pelo menos 3 caracteres",
  }),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { user, loginMutation } = useAuth();

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Se o usuário já estiver autenticado, redirecionamos para a página principal
  if (user) {
    return <Redirect to="/" />;
  }

  // Função para lidar com o envio do formulário de login
  const onLoginSubmit = (values: LoginFormValues) => {
    console.log("Formulário de login enviado com usuário:", values.username);
    
    loginMutation.mutate(values, {
      onSuccess: (userData) => {
        console.log("Login realizado com sucesso na página de auth:", userData);
        toast({
          title: "Login realizado com sucesso!",
          description: "Você será redirecionado para a página principal.",
        });
        
        // Verificar se o redirecionamento está ocorrendo corretamente
        setTimeout(() => {
          console.log("Estado atual após login:", { 
            user: userData, 
            isLoggingIn: loginMutation.isPending 
          });
        }, 1000);
      },
      onError: (error) => {
        console.error("Erro ao tentar fazer login na página de auth:", error);
        toast({
          title: "Erro ao fazer login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-800">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Entrar
            </CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta para gerenciar sua loja ou realizar compras
            </CardDescription>
          </CardHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu nome de usuário"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-red-600 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Entrar
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      {/* Lado Informativo (Hero) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/80 to-primary items-center justify-center p-12 text-white">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-bold">GrupoCatálogos</h1>
          <p className="text-xl">
            Plataforma Completa para Catálogos de Produtos para Consultores de Multinivel.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center">
                ✓
              </div>
              <p>Crie sua loja virtual personalizada com até 30 produtos</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center">
                ✓
              </div>
              <p>Receba pedidos diretamente no seu WhatsApp</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center">
                ✓
              </div>
              <p>Personalize sua marca com logo e nome da sua escolha</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center">
                ✓
              </div>
              <p>Apenas R$ 29,90 por mês - comece hoje mesmo!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}