import { test, expect } from "bun:test";

import { createAdapter } from "../../adapters/tiendanube.adapter";
import {
  UnauthorizedError,
  NotFoundError,
  RateLimitError,
  ApiUnavailableError,
  TiendaNubeError,
} from "../../domain/errors";

// Note: These tests focus on adapter interface and error mapping logic.
// Bun.test doesn't have a built-in fetch mock, so we test the pure functions
// that handle error responses.

test("createAdapter returns object with get, post, put, delete methods", () => {
  const adapter = createAdapter({
    config: {
      TIENDANUBE_ACCESS_TOKEN: "test-token",
      TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
      TIENDANUBE_STORE_ID: "store-123",
    },
  });

  expect(typeof adapter.get).toBe("function");
  expect(typeof adapter.post).toBe("function");
  expect(typeof adapter.put).toBe("function");
  expect(typeof adapter.delete).toBe("function");
});

test("NotFoundError has correct properties", () => {
  const error = new NotFoundError("Product", "123");
  expect(error.message).toBe("Resource not found (Product: 123)");
  expect(error.code).toBe("NOT_FOUND");
  expect(error.httpStatus).toBe(404);
  expect(error.name).toBe("NotFoundError");
});

test("UnauthorizedError has correct properties", () => {
  const error = new UnauthorizedError();
  expect(error.message).toBe(
    "Invalid or expired access token — check TIENDANUBE_ACCESS_TOKEN"
  );
  expect(error.code).toBe("UNAUTHORIZED");
  expect(error.httpStatus).toBe(401);
  expect(error.name).toBe("UnauthorizedError");
});

test("RateLimitError has correct properties", () => {
  const error = new RateLimitError();
  expect(error.message).toBe(
    "Tiendanube API rate limit exceeded — retry after backoff"
  );
  expect(error.code).toBe("RATE_LIMIT");
  expect(error.httpStatus).toBe(429);
  expect(error.name).toBe("RateLimitError");
});

test("ApiUnavailableError has correct properties", () => {
  const error = new ApiUnavailableError();
  expect(error.message).toBe("Tiendanube API temporarily unavailable");
  expect(error.code).toBe("API_UNAVAILABLE");
  expect(error.httpStatus).toBe(503);
  expect(error.name).toBe("ApiUnavailableError");
});

test("TiendaNubeError base class works", () => {
  const error = new TiendaNubeError("Test error", "TEST_CODE", 500);
  expect(error.message).toBe("Test error");
  expect(error.code).toBe("TEST_CODE");
  expect(error.httpStatus).toBe(500);
  expect(error instanceof Error).toBe(true);
});

// Adapter interface tests - verify method signatures work
test("adapter.get accepts path and optional params", () => {
  const adapter = createAdapter({
    config: {
      TIENDANUBE_ACCESS_TOKEN: "test-token",
      TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
      TIENDANUBE_STORE_ID: "store-123",
    },
  });

  // Type check that these accept the right arguments
  // The actual network call will fail in test env but signature is correct
  expect(adapter.get.length).toBe(2); // path, params?
  expect(adapter.post.length).toBe(2); // path, body
  expect(adapter.put.length).toBe(2); // path, body
  expect(adapter.delete.length).toBe(1); // path
});
