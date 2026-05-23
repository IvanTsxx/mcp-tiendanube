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
  async function findProductIdForVariant(variantId: string): Promise<string> {
    let page = 1;
    while (true) {
      const response = await adapter.get<any>("/products", {
        page: String(page),
        per_page: "50",
      });
      const products = Array.isArray(response)
        ? response
        : response.products || [];
      if (products.length === 0) {
        break;
      }
      for (const prod of products) {
        const variants = prod.variants || [];
        if (variants.some((v: any) => String(v.id) === variantId)) {
          return String(prod.id);
        }
      }
      if (products.length < 50) {
        break;
      }
      page += 1;
    }
    throw new Error(`Product not found for variant ID ${variantId}`);
  }

  return {
    async create(productId: string, variant: VariantInput) {
      const response = await adapter.post<TiendanubeVariantResponse>(
        `/products/${productId}/variants`,
        variant
      );
      return transformVariantResponse(response);
    },

    async delete(variantId: string) {
      const productId = await findProductIdForVariant(variantId);
      await adapter.delete(`/products/${productId}/variants/${variantId}`);
    },

    async update(
      variantId: string,
      body: Partial<{ sku: string; price: string; stock: number }>
    ) {
      const productId = await findProductIdForVariant(variantId);
      const response = await adapter.put<TiendanubeVariantResponse>(
        `/products/${productId}/variants/${variantId}`,
        body
      );
      return transformVariantResponse(response);
    },
  };
}
