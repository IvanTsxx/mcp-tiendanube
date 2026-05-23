import { test, expect, describe, mock, beforeAll, beforeEach } from "bun:test";

let manageImages: any;
let metadata: any;
let schema: any;
let mockService: any;

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

beforeAll(async () => {
  mock.module("../../services/factory", () => ({
    createImageServiceInstance: () => mockService,
    createProductServiceInstance: () => mockService,
    createStockServiceInstance: () => mockService,
    createVariantServiceInstance: () => mockService,
  }));

  const mod = await import("../../tools/manage-images");
  manageImages = mod.default;
  metadata = mod.metadata;
  schema = mod.schema;
});

describe("manage-images tool", () => {
  beforeEach(() => {
    mockService = createMockImageService();
  });

  test("schema has correct structure", () => {
    expect(schema.action).toBeDefined();
    expect(schema.product_id).toBeDefined();
  });

  test("metadata has correct name", () => {
    expect(metadata.name).toBe("manage-images");
    expect(metadata.annotations?.destructiveHint).toBe(true);
  });

  test("tool adds image when action is add", async () => {
    mockService = createMockImageService({
      addResponse: {
        id: "img-123",
        src: "https://example.com/new.jpg",
        position: 1,
      },
    });

    const result = await manageImages({
      action: "add",
      product_id: "prod-123",
      image_url: "https://example.com/new.jpg",
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("added");
    expect(result.structuredContent.image?.id).toBe("img-123");
  });

  test("tool removes image when action is remove", async () => {
    const result = await manageImages({
      action: "remove",
      product_id: "prod-123",
      image_id: "img-123",
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("removed");
  });

  test("tool reorders image when action is reorder", async () => {
    mockService = createMockImageService({
      reorderResponse: {
        id: "img-123",
        src: "https://example.com/test.jpg",
        position: 2,
      },
    });

    const result = await manageImages({
      action: "reorder",
      product_id: "prod-123",
      image_id: "img-123",
      position: 2,
    } as never);

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.action).toBe("reordered");
  });

  test("tool requires image_url for add action", async () => {
    await expect(
      manageImages({
        action: "add",
        product_id: "prod-123",
      } as never)
    ).rejects.toThrow("image_url required");
  });
});
