import { z } from "zod";

export const CREDENTIAL_HEADERS = {
  ACCESS_TOKEN: "x-tiendanube-access-token",
  STORE_ID: "x-tiendanube-store-id",
  API_BASE_URL: "x-tiendanube-api-base-url",
} as const;

export const DEFAULT_API_BASE_URL = "https://api.tiendanube.com/v1";

export const TokenConfigSchema = z.object({
  TIENDANUBE_ACCESS_TOKEN: z
    .string()
    .min(1, "TIENDANUBE_ACCESS_TOKEN is required"),
  TIENDANUBE_API_BASE_URL: z
    .string()
    .url("TIENDANUBE_API_BASE_URL must be a valid URL"),
  TIENDANUBE_STORE_ID: z.string().min(1, "TIENDANUBE_STORE_ID is required"),
});

export type TokenConfig = z.infer<typeof TokenConfigSchema>;

export type IncomingHeaders = Record<string, string | string[] | undefined>;

export class CredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialsError";
  }
}

export function getHeaderValue(
  headerRecord: IncomingHeaders,
  name: string
): string | undefined {
  const value = headerRecord[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseTokenConfig(raw: {
  TIENDANUBE_ACCESS_TOKEN: string;
  TIENDANUBE_API_BASE_URL: string;
  TIENDANUBE_STORE_ID: string;
}): TokenConfig {
  const result = TokenConfigSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new CredentialsError(`Invalid credentials: ${errors}`);
  }

  return result.data;
}

export function credentialsFromHeaders(
  headerRecord: IncomingHeaders
): TokenConfig | null {
  const accessToken = getHeaderValue(
    headerRecord,
    CREDENTIAL_HEADERS.ACCESS_TOKEN
  );
  const storeId = getHeaderValue(headerRecord, CREDENTIAL_HEADERS.STORE_ID);
  const apiBaseUrl = getHeaderValue(
    headerRecord,
    CREDENTIAL_HEADERS.API_BASE_URL
  );

  const hasAnyHeader = accessToken ?? storeId ?? apiBaseUrl;
  if (!hasAnyHeader) {
    return null;
  }

  if (!accessToken || !storeId) {
    throw new CredentialsError(
      "Both X-Tiendanube-Access-Token and X-Tiendanube-Store-Id headers are required"
    );
  }

  return parseTokenConfig({
    TIENDANUBE_ACCESS_TOKEN: accessToken,
    TIENDANUBE_API_BASE_URL: apiBaseUrl ?? DEFAULT_API_BASE_URL,
    TIENDANUBE_STORE_ID: storeId,
  });
}

export function credentialsFromEnv(): TokenConfig | null {
  const accessToken = process.env.TIENDANUBE_ACCESS_TOKEN;
  const storeId = process.env.TIENDANUBE_STORE_ID;
  const apiBaseUrl = process.env.TIENDANUBE_API_BASE_URL;

  const hasAnyEnv = accessToken ?? storeId ?? apiBaseUrl;
  if (!hasAnyEnv) {
    return null;
  }

  if (!accessToken || !storeId) {
    throw new CredentialsError(
      "Both TIENDANUBE_ACCESS_TOKEN and TIENDANUBE_STORE_ID environment variables are required"
    );
  }

  return parseTokenConfig({
    TIENDANUBE_ACCESS_TOKEN: accessToken,
    TIENDANUBE_API_BASE_URL: apiBaseUrl ?? DEFAULT_API_BASE_URL,
    TIENDANUBE_STORE_ID: storeId,
  });
}

export function validateCredentialsOrThrow(
  headerRecord: IncomingHeaders
): void {
  const fromHeaders = credentialsFromHeaders(headerRecord);
  if (fromHeaders) {
    return;
  }

  const fromEnv = credentialsFromEnv();
  if (fromEnv) {
    return;
  }

  throw new CredentialsError(
    "Missing Tiendanube credentials. Provide X-Tiendanube-Access-Token and X-Tiendanube-Store-Id headers in your MCP client configuration."
  );
}
