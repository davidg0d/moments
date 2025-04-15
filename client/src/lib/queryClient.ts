import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>,
    forceRefresh?: boolean
  }
): Promise<Response> {
  const forceRefresh = options?.forceRefresh || false;
  const urlWithNoCache = forceRefresh 
    ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}` 
    : url;
  
  console.log(`[API Request] Iniciando ${method} para ${urlWithNoCache}`);
  
  try {
    const res = await fetch(urlWithNoCache, {
      method,
      headers: {
        ...(data && !(data instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept': 'application/json',
        ...(options?.headers || {})
      },
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: 'cors',
      cache: 'no-store',
    });
    
    await throwIfResNotOk(res);
    
    return res;
  } catch (error) {
    console.error(`[API Request] Erro ao processar ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      
      console.log(`Fazendo requisição GET para ${urlWithTimestamp} com credenciais`);
      const res = await fetch(urlWithTimestamp, {
        method: 'GET',
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      await throwIfResNotOk(res);

      const data = await res.json();
      console.log(`Dados recebidos para ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`Erro na função de consulta para ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});