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
  return {
    async add(productId: string, imageUrl: string) {
      const response = await adapter.post<TiendanubeImageResponse>(
        `/products/${productId}/images`,
        { src: imageUrl }
      );
      return transformImageResponse(response);
    },

    async remove(imageId: string) {
      await adapter.delete(`/images/${imageId}`);
    },

    async reorder(imageId: string, position: number) {
      const response = await adapter.put<TiendanubeImageResponse>(
        `/images/${imageId}`,
        { position }
      );
      return transformImageResponse(response);
    },
  };
}
