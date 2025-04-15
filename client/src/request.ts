// src/request.ts

// Função para fazer requisição GET
export const fetchData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
  }
  return response.json();
};

// Função para fazer requisição POST
export const postData = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Erro ao enviar dados: ${response.statusText}`);
  }
  return response.json();
};
