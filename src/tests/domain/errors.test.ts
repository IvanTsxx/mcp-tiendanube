import { test, expect } from "bun:test";

import {
  TiendaNubeError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
  ApiUnavailableError,
} from "../../domain/errors";

test("TiendaNubeError has code and httpStatus", () => {
  const error = new TiendaNubeError("Test error", "TEST_CODE", 500);
  expect(error.message).toBe("Test error");
  expect(error.code).toBe("TEST_CODE");
  expect(error.httpStatus).toBe(500);
  expect(error.name).toBe("TiendaNubeError");
});

test("NotFoundError formats message with resource and id", () => {
  const error = new NotFoundError("Product", "123");
  expect(error.message).toBe("Resource not found (Product: 123)");
  expect(error.code).toBe("NOT_FOUND");
  expect(error.httpStatus).toBe(404);
  expect(error.name).toBe("NotFoundError");
});

test("UnauthorizedError has correct message and code", () => {
  const error = new UnauthorizedError();
  expect(error.message).toBe(
    "Invalid or expired access token — check TIENDANUBE_ACCESS_TOKEN"
  );
  expect(error.code).toBe("UNAUTHORIZED");
  expect(error.httpStatus).toBe(401);
  expect(error.name).toBe("UnauthorizedError");
});

test("ValidationError stores Zod issues", () => {
  // Create a minimal ZodIssue structure
  const issues = [
    {
      code: "invalid_type" as const,
      expected: "string",
      message: "Required",
      path: [{ _tag: "root" }, "name"] as any,
      received: "undefined",
    },
  ];
  const error = new ValidationError(issues);
  expect(error.message).toBe("Validation failed");
  expect(error.issues).toEqual(issues);
  expect(error.name).toBe("ValidationError");
});

test("RateLimitError has correct code and status", () => {
  const error = new RateLimitError();
  expect(error.code).toBe("RATE_LIMIT");
  expect(error.httpStatus).toBe(429);
  expect(error.name).toBe("RateLimitError");
});

test("ApiUnavailableError has correct code and status", () => {
  const error = new ApiUnavailableError();
  expect(error.message).toBe("Tiendanube API temporarily unavailable");
  expect(error.code).toBe("API_UNAVAILABLE");
  expect(error.httpStatus).toBe(503);
  expect(error.name).toBe("ApiUnavailableError");
});

test("All errors extend Error", () => {
  const tiendaError = new TiendaNubeError("test", "TEST", 500);
  expect(tiendaError instanceof Error).toBe(true);

  const notFound = new NotFoundError("Product", "123");
  expect(notFound instanceof Error).toBe(true);

  const unauthorized = new UnauthorizedError();
  expect(unauthorized instanceof Error).toBe(true);

  const validation = new ValidationError([]);
  expect(validation instanceof Error).toBe(true);

  const rateLimit = new RateLimitError();
  expect(rateLimit instanceof Error).toBe(true);

  const unavailable = new ApiUnavailableError();
  expect(unavailable instanceof Error).toBe(true);
});
