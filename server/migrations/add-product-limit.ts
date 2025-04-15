import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Adiciona a coluna product_limit à tabela shop_owners e define o valor padrão de 30 produtos
 * para todos os lojistas existentes.
 */
export async function addProductLimitColumn() {
  try {
    // Verificar se a coluna já existe
    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'shop_owners' AND column_name = 'product_limit'
    `);
    
    if (columnExists.rows.length === 0) {
      console.log("Adicionando coluna product_limit à tabela shop_owners...");
      
      // Adicionar a coluna product_limit com valor padrão 30
      await db.execute(sql`
        ALTER TABLE shop_owners
        ADD COLUMN product_limit INTEGER DEFAULT 30 NOT NULL
      `);
      
      console.log("Coluna product_limit adicionada com sucesso!");
    } else {
      console.log("Coluna product_limit já existe na tabela shop_owners. Pulando migração.");
    }
  } catch (error) {
    console.error("Erro ao adicionar coluna product_limit:", error);
    throw error;
  }
}