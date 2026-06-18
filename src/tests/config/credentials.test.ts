import { expect, test } from "bun:test";

import {
  CREDENTIAL_HEADERS,
  CredentialsError,
  DEFAULT_API_BASE_URL,
  TokenConfigSchema,
  credentialsFromEnv,
  credentialsFromHeaders,
  validateCredentialsOrThrow,
} from "../../config/credentials";

const originalEnv = process.env;

test("TokenConfigSchema parses valid credentials", () => {
  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: "test-token-123",
    TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
    TIENDANUBE_STORE_ID: "store-456",
  });

  expect(result.success).toBe(true);
});

test("credentialsFromHeaders returns config from request headers", () => {
  const config = credentialsFromHeaders({
    [CREDENTIAL_HEADERS.ACCESS_TOKEN]: "header-token",
    [CREDENTIAL_HEADERS.STORE_ID]: "987654",
  });

  expect(config).toEqual({
    TIENDANUBE_ACCESS_TOKEN: "header-token",
    TIENDANUBE_API_BASE_URL: DEFAULT_API_BASE_URL,
    TIENDANUBE_STORE_ID: "987654",
  });
});

test("credentialsFromHeaders returns null when headers are absent", () => {
  expect(credentialsFromHeaders({})).toBeNull();
});

test("credentialsFromHeaders rejects partial headers", () => {
  expect(() =>
    credentialsFromHeaders({
      [CREDENTIAL_HEADERS.ACCESS_TOKEN]: "only-token",
    })
  ).toThrow(CredentialsError);
});

test("credentialsFromEnv returns config from process env", () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "env-token";
  process.env.TIENDANUBE_STORE_ID = "111222";
  process.env.TIENDANUBE_API_BASE_URL = "https://api.tiendanube.com/v1";

  const config = credentialsFromEnv();

  expect(config).toEqual({
    TIENDANUBE_ACCESS_TOKEN: "env-token",
    TIENDANUBE_API_BASE_URL: "https://api.tiendanube.com/v1",
    TIENDANUBE_STORE_ID: "111222",
  });

  process.env = originalEnv;
});

test("validateCredentialsOrThrow accepts headers over env", () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "env-token";
  process.env.TIENDANUBE_STORE_ID = "111222";

  expect(() =>
    validateCredentialsOrThrow({
      [CREDENTIAL_HEADERS.ACCESS_TOKEN]: "header-token",
      [CREDENTIAL_HEADERS.STORE_ID]: "999888",
    })
  ).not.toThrow();

  process.env = originalEnv;
});

test("validateCredentialsOrThrow rejects missing credentials", () => {
  process.env.TIENDANUBE_ACCESS_TOKEN = "";
  process.env.TIENDANUBE_STORE_ID = "";
  delete process.env.TIENDANUBE_API_BASE_URL;

  expect(() => validateCredentialsOrThrow({})).toThrow(CredentialsError);

  process.env = originalEnv;
});
