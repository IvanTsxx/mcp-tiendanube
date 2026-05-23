import type { TiendaNubeAdapter } from "./tiendanube.adapter";

// Tiendanube image API response
interface TiendanubeImageResponse {
  id: number;
  src: string;
  position: number;
}

function transformImageResponse(apiImage: TiendanubeImageResponse) {
  return {
    id: String(apiImage.id),
    position: apiImage.position,
    src: apiImage.src,
  };
}

export interface ImageAdapter {
  add(
    productId: string,
    imageUrl: string
  ): Promise<{
    id: string;
    src: string;
    position: number;
  }>;
  remove(imageId: string): Promise<void>;
  reorder(
    imageId: string,
    position: number
  ): Promise<{
    id: string;
    src: string;
    position: number;
  }>;
}

export function createImageAdapter(adapter: TiendaNubeAdapter): ImageAdapter {
  async function findProductIdForImage(imageId: string): Promise<string> {
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
        const images = prod.images || [];
        if (images.some((img: any) => String(img.id) === imageId)) {
          return String(prod.id);
        }
      }
      if (products.length < 50) {
        break;
      }
      page += 1;
    }
    throw new Error(`Product not found for image ID ${imageId}`);
  }

  return {
    async add(productId: string, imageUrl: string) {
      const response = await adapter.post<TiendanubeImageResponse>(
        `/products/${productId}/images`,
        { src: imageUrl }
      );
      return transformImageResponse(response);
    },

    async remove(imageId: string) {
      const productId = await findProductIdForImage(imageId);
      await adapter.delete(`/products/${productId}/images/${imageId}`);
    },

    async reorder(imageId: string, position: number) {
      const productId = await findProductIdForImage(imageId);
      const response = await adapter.put<TiendanubeImageResponse>(
        `/products/${productId}/images/${imageId}`,
        { position }
      );
      return transformImageResponse(response);
    },
  };
}
