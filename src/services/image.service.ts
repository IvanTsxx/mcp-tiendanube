import type { ImageAdapter } from "../adapters/image.adapter";

export interface ImageService {
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

export function createImageService(adapter: ImageAdapter): ImageService {
  return {
    async add(productId: string, imageUrl: string) {
      return adapter.add(productId, imageUrl);
    },

    async remove(imageId: string) {
      await adapter.remove(imageId);
    },

    async reorder(imageId: string, position: number) {
      return adapter.reorder(imageId, position);
    },
  };
}
