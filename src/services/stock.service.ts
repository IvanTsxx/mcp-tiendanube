import type { VariantAdapter } from "../adapters/variant.adapter";

export interface StockUpdate {
  variant_id: string;
  stock: number;
}

export interface StockService {
  updateStock(updates: StockUpdate[]): Promise<
    {
      variant_id: string;
      success: boolean;
      stock?: number;
      error?: string;
    }[]
  >;
}

export function createStockService(adapter: VariantAdapter): StockService {
  return {
    async updateStock(updates: StockUpdate[]) {
      const results = [];

      for (const update of updates) {
        if (update.stock < 0) {
          results.push({
            error: "Stock cannot be negative",
            success: false,
            variant_id: update.variant_id,
          });
          continue;
        }

        try {
          const result = await adapter.update(update.variant_id, {
            stock: update.stock,
          });
          results.push({
            stock: result.stock,
            success: true,
            variant_id: update.variant_id,
          });
        } catch (error) {
          results.push({
            error: error instanceof Error ? error.message : "Unknown error",
            success: false,
            variant_id: update.variant_id,
          });
        }
      }

      return results;
    },
  };
}
