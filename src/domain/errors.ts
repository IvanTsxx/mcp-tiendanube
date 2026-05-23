import type { ZodIssue } from "zod";

export class TiendaNubeError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = "TiendaNubeError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class NotFoundError extends TiendaNubeError {
  constructor(resource: string, id: string | number) {
    super(`Resource not found (${resource}: ${id})`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends TiendaNubeError {
  constructor() {
    super(
      "Invalid or expired access token — check TIENDANUBE_ACCESS_TOKEN",
      "UNAUTHORIZED",
      401
    );
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  public readonly issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super("Validation failed");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class RateLimitError extends TiendaNubeError {
  constructor() {
    super(
      "Tiendanube API rate limit exceeded — retry after backoff",
      "RATE_LIMIT",
      429
    );
    this.name = "RateLimitError";
  }
}

export class ApiUnavailableError extends TiendaNubeError {
  constructor() {
    super("Tiendanube API temporarily unavailable", "API_UNAVAILABLE", 503);
    this.name = "ApiUnavailableError";
  }
}
