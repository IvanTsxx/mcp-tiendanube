import { test, expect, describe } from "bun:test";

import manageImages, {
  metadata,
  schema,
  setImageService,
} from "../../tools/manage-images";

function createMockImageService(
  overrides: {
    addResponse?: { id: string; src: string; position: number };
    removeResponse?: void;
    reorderResponse?: { id: string; src: string; position: number };
    addError?: Error;
    removeError?: Error;
    reorderError?: Error;
  } = {}
) {
  return {
    add: async (productId: string, imageUrl: string) => {
      if (overrides.addError) {
        throw overrides.addError;
      }
      return (
        overrides.addResponse ?? { id: "img-new", src: imageUrl, position: 1 }
      );
    },
    remove: async (imageId: string) => {
      if (overrides.removeError) {
        throw overrides.removeError;
      }
    },
    reorder: async (imageId: string, position: number) => {
      if (overrides.reorderError) {
        throw overrides.reorderError;
      }
      return (
        overrides.reorderResponse ?? {
          id: imageId,
          src: "https://example.com/reordered.jpg",
          position,
        }
      );
    },
  };
}

describe("manage-images tool", () => {
  test("schema has correct structure", () => {
    expect(schema.action).toBeDefined();
    expect(schema.product_id).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("manage-images");
    expect(metadata.annotations?.destructiveHint).toBe(true);
  });

  test("tool adds image when action is add", async () => {
    const mockService = createMockImageService({
      addResponse: {
        id: "img-123",
        src: "https://example.com/new.jpg",
        position: 1,
      },
    });

    setImageService(mockService as never);

    const result = await manageImages({
      action: "add",
      product_id: "prod-123",
      image_url: "https://example.com/new.jpg",
    } as never);

    expect(result.success).toBe(true);
    expect(result.action).toBe("added");
    expect(result.image?.id).toBe("img-123");
  });

  test("tool removes image when action is remove", async () => {
    const mockService = createMockImageService();

    setImageService(mockService as never);

    const result = await manageImages({
      action: "remove",
      product_id: "prod-123",
      image_id: "img-123",
    } as never);

    expect(result.success).toBe(true);
    expect(result.action).toBe("removed");
  });

  test("tool reorders image when action is reorder", async () => {
    const mockService = createMockImageService({
      reorderResponse: {
        id: "img-123",
        src: "https://example.com/test.jpg",
        position: 2,
      },
    });

    setImageService(mockService as never);

    const result = await manageImages({
      action: "reorder",
      product_id: "prod-123",
      image_id: "img-123",
      position: 2,
    } as never);

    expect(result.success).toBe(true);
    expect(result.action).toBe("reordered");
  });

  test("tool throws error when service not configured", async () => {
    setImageService(null as never);

    await expect(
      manageImages({
        action: "add",
        product_id: "prod-123",
        image_url: "https://example.com/test.jpg",
      } as never)
    ).rejects.toThrow("ImageService not configured");
  });

  test("tool requires image_url for add action", async () => {
    const mockService = createMockImageService();

    setImageService(mockService as never);

    await expect(
      manageImages({
        action: "add",
        product_id: "prod-123",
      } as never)
    ).rejects.toThrow("image_url required");
  });
});
