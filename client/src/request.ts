// src/request.ts

// Fun��o para fazer requisi��o GET
export const fetchData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
  }
  return response.json();
};

// Fun��o para fazer requisi��o POST
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
