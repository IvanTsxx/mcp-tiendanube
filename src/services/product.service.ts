import type { ProductAdapter } from "../adapters/product.adapter";
import { NotFoundError } from "../domain/errors";
import type { Pagination } from "../domain/models/pagination";
import type {
  Product,
  ProductUpdate,
  BulkUpdateItem,
} from "../domain/models/product";

export interface ProductService {
  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    stock_status?: "all" | "in_stock" | "out_of_stock";
  }): Promise<{ products: Product[]; pagination: Pagination }>;
  get(id: string): Promise<Product>;
  updateBulk(
    items: BulkUpdateItem[]
  ): Promise<
    { id: string; success: boolean; product?: Product; error?: string }[]
  >;
  delete(id: string, confirm: true): Promise<void>;
}

export function createProductService(adapter: ProductAdapter): ProductService {
  return {
    async delete(id: string, confirm: true) {
      if (confirm !== true) {
        throw new Error("Deletion requires confirm: true");
      }
      await adapter.delete(id);
    },

    async get(id: string) {
      try {
        return await adapter.get(id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new NotFoundError("Product", id);
        }
        throw error;
      }
    },

    async list(params = {}) {
      return adapter.list(params);
    },

    async updateBulk(items: BulkUpdateItem[]) {
      const results = [];

      for (const item of items) {
        try {
          const product = await adapter.update(item.id, item.updates);
          results.push({ id: item.id, product, success: true });
        } catch (error) {
          results.push({
            error: error instanceof Error ? error.message : "Unknown error",
            id: item.id,
            success: false,
          });
        }
      }

      return results;
    },
  };
}
