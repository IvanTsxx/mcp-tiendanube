import type { VariantAdapter } from "../adapters/variant.adapter";
import type { VariantInput } from "../domain/models/product";

export interface VariantService {
  create(
    productId: string,
    variant: VariantInput
  ): Promise<{
    id: string;
    sku: string;
    price: string;
    stock: number;
  }>;
  update(
    variantId: string,
    body: Partial<{ sku: string; price: string; stock: number }>
  ): Promise<{
    id: string;
    sku: string;
    price: string;
    stock: number;
  }>;
  delete(variantId: string): Promise<void>;
}

export function createVariantService(adapter: VariantAdapter): VariantService {
  return {
    async create(productId: string, variant: VariantInput) {
      return adapter.create(productId, variant);
    },

    async delete(variantId: string) {
      await adapter.delete(variantId);
    },

    async update(
      variantId: string,
      body: Partial<{ sku: string; price: string; stock: number }>
    ) {
      return adapter.update(variantId, body);
    },
  };
}
