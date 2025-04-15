import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirecionar com base no papel do usuário
      switch (user.role) {
        case "admin":
          setLocation("/admin");
          break;
        case "shopowner":
          setLocation("/dashboard");
          break;
        case "customer":
          setLocation("/account");
          break;
        default:
          // Permanecer na página inicial
          break;
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-lg md:text-2xl font-bold">GrupoCatálogos</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="/auth" className="hover:text-white/80">
                  Acessar Loja
                </a>
              </li>
              
              <li>
                <a href="#sobre" className="hover:text-white/80">
                  Sobre
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Crie um Catálogo de Produtos para a sua Empresa!
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Crie sua loja virtual personalizada, gerencie seu catálogo de produtos e receba pedidos diretamente pelo WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/auth"
                    className="inline-flex items-center gap-2 py-3 px-6 bg-[#25D366] text-white font-medium rounded-md hover:bg-[#128C7E] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 fill-current">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    Crie sua loja agora!
                  </a>
                  
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute -top-6 -left-6 w-72 h-72 bg-primary/10 rounded-full z-0"></div>
                  <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary/20 rounded-full z-0"></div>
                  <div className="relative z-10 bg-white p-6 rounded-lg shadow-xl">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold">Rápido e Fácil</h3>
                        <p className="text-gray-600">
                          Pronto em minutos
                        </p>
                      </div>
                    </div>
                    <p className="mb-6">
                      "Consegui criar minha loja online em menos de 10 minutos. Já recebi 15 pedidos no primeiro dia!"
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div className="ml-3">
                        <p className="font-medium">Ana Silva</p>
                        <p className="text-sm text-gray-500">Consultora de Beleza</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="saiba-mais" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Tudo o que você precisa
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Nossa plataforma oferece todas as ferramentas necessárias para você criar e gerenciar sua loja de cosméticos online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-6.5L3 15"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Personalizado</h3>
                <p className="text-gray-600">
                  Personalize sua loja com seu logo, nome e informações de contato. Mostre seus produtos da melhor forma.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Eficiente</h3>
                <p className="text-gray-600">
                  Gerencie seu catálogo, receba pedidos e comunique-se com seus clientes diretamente pelo WhatsApp.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Acessível</h3>
                <p className="text-gray-600">
                  Apenas R$ 29,90 por mês. Comece com um período de teste gratuito de 15 dias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section
          className="py-16 bg-primary text-white"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Pronto para começar sua loja online?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Apenas R$ 29,90 por mês. Crie sua loja agora!
            </p>
            <a
              href="/auth"
              className="inline-block py-3 px-8 bg-white text-primary font-medium text-lg rounded-md hover:bg-gray-100"
            >
              Criar Minha Loja
            </a>
          </div>
        </section>

        {/* About Section */}
        <section id="sobre" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                Sobre o GrupoCatálogos
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Somos uma plataforma dedicada a ajudar consultoras e revendedores de cosméticos e perfumaria 
                a expandirem seus negócios no ambiente digital. Nossa missão é facilitar a presença online 
                de pequenos empreendedores, fornecendo ferramentas simples e eficazes para o 
                crescimento de seus negócios.
              </p>
              <p className="text-lg text-gray-600">
                Com o GrupoCatálogos, você pode criar uma loja virtual personalizada, gerenciar 
                seu catálogo de produtos e receber pedidos diretamente pelo WhatsApp, tudo isso com 
                uma interface intuitiva e um preço acessível.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GrupoCatálogos</h3>
              <p className="text-gray-400">
                Sua plataforma para venda de cosméticos e perfumaria online.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/auth" className="text-gray-400 hover:text-white">
                    Login / Registro
                  </a>
                </li>
                <li>
                  <a href="#saiba-mais" className="text-gray-400 hover:text-white">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#sobre" className="text-gray-400 hover:text-white">
                    Sobre Nós
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contato</h3>
              <p className="text-gray-400">
                contato@momentsparis.com
                <br />
                +55 (11) 99999-9999
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} GrupoCatálogos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}