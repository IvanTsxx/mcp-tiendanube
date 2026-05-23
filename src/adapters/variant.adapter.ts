import type { VariantInput } from "../domain/models/product";
import type { TiendaNubeAdapter } from "./tiendanube.adapter";

// Tiendanube variant API response
interface TiendanubeVariantResponse {
  id: number;
  sku: string;
  price: string;
  stock: number;
}

function transformVariantResponse(apiVariant: TiendanubeVariantResponse) {
  return {
    id: String(apiVariant.id),
    price: apiVariant.price,
    sku: apiVariant.sku,
    stock: apiVariant.stock,
  };
}

export interface VariantAdapter {
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

export function createVariantAdapter(
  adapter: TiendaNubeAdapter
): VariantAdapter {
  return {
    async create(productId: string, variant: VariantInput) {
      const response = await adapter.post<TiendanubeVariantResponse>(
        `/products/${productId}/variants`,
        variant
      );
      return transformVariantResponse(response);
    },

    async delete(variantId: string) {
      await adapter.delete(`/variants/${variantId}`);
    },

    async update(
      variantId: string,
      body: Partial<{ sku: string; price: string; stock: number }>
    ) {
      const response = await adapter.put<TiendanubeVariantResponse>(
        `/variants/${variantId}`,
        body
      );
      return transformVariantResponse(response);
    },
  };
}
