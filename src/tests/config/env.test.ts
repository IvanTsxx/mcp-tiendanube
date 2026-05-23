import { test, expect, mock } from "bun:test";

import { z } from "zod";

// Mock process.env before importing env
const originalEnv = process.env;

test("TokenConfig parses valid env vars", async () => {
  // Set required env vars
  process.env.TIENDANUBE_ACCESS_TOKEN = "test-token-123";
  process.env.TIENDANUBE_STORE_ID = "store-456";
  process.env.TIENDANUBE_API_BASE_URL = "https://api.tiendanube.com/v1";

  // Import the module fresh
  const { TokenConfigSchema } = await import("../../config/env");

  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: process.env.TIENDANUBE_ACCESS_TOKEN,
    TIENDANUBE_API_BASE_URL: process.env.TIENDANUBE_API_BASE_URL,
    TIENDANUBE_STORE_ID: process.env.TIENDANUBE_STORE_ID,
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.TIENDANUBE_ACCESS_TOKEN).toBe("test-token-123");
    expect(result.data.TIENDANUBE_STORE_ID).toBe("store-456");
    expect(result.data.TIENDANUBE_API_BASE_URL).toBe(
      "https://api.tiendanube.com/v1"
    );
  }

  // Restore env
  process.env = originalEnv;
});

test("TokenConfig rejects missing access token", async () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "";
  process.env.TIENDANUBE_STORE_ID = "store-456";
  process.env.TIENDANUBE_API_BASE_URL = "https://api.tiendanube.com/v1";

  const { TokenConfigSchema } = await import("../../config/env");

  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: "",
    TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
    TIENDANUBE_STORE_ID: "store-456",
  });

  expect(result.success).toBe(false);

  process.env = originalEnv;
});

test("TokenConfig rejects missing store id", async () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "test-token";
  process.env.TIENDANUBE_STORE_ID = "";
  process.env.TIENDANUBE_API_BASE_URL = "https://api.tiendanube.com/v1";

  const { TokenConfigSchema } = await import("../../config/env");

  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: "test-token",
    TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
    TIENDANUBE_STORE_ID: "",
  });

  expect(result.success).toBe(false);

  process.env = originalEnv;
});

test("TokenConfig rejects invalid URL", async () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "test-token";
  process.env.TIENDANUBE_STORE_ID = "store-456";
  process.env.TIENDANUBE_API_BASE_URL = "not-a-valid-url";

  const { TokenConfigSchema } = await import("../../config/env");

  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: "test-token",
    TIENDANUBE_API_BASE_URL: "not-a-valid-url",
    TIENDANUBE_STORE_ID: "store-456",
  });

  expect(result.success).toBe(false);

  process.env = originalEnv;
});
