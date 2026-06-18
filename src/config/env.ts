import { resolve } from "node:path";

import dotenv from "dotenv";
import { headers } from "xmcp/headers";

import {
  CredentialsError,
  credentialsFromEnv,
  credentialsFromHeaders,
} from "./credentials";
import type { IncomingHeaders, TokenConfig } from "./credentials";

export {
  CREDENTIAL_HEADERS,
  DEFAULT_API_BASE_URL,
  TokenConfigSchema,
  type TokenConfig,
} from "./credentials";

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
  resolve(process.cwd(), "..", "..", ".env"),
];

for (const path of envPaths) {
  const result = dotenv.config({ path });
  if (!result.error) {
    break;
  }
}

let envConfigInstance: TokenConfig | null = null;

function getRequestHeaders(): IncomingHeaders {
  try {
    return headers() as IncomingHeaders;
  } catch {
    return {};
  }
}

export function loadConfig(): TokenConfig {
  const fromHeaders = credentialsFromHeaders(getRequestHeaders());
  if (fromHeaders) {
    return fromHeaders;
  }

  if (envConfigInstance) {
    return envConfigInstance;
  }

  const fromEnv = credentialsFromEnv();
  if (!fromEnv) {
    throw new CredentialsError(
      "Missing Tiendanube credentials. Provide X-Tiendanube-Access-Token and X-Tiendanube-Store-Id headers in your MCP client, or set TIENDANUBE_ACCESS_TOKEN and TIENDANUBE_STORE_ID for local development."
    );
  }

  envConfigInstance = fromEnv;
  return fromEnv;
}

export function resetConfig(): void {
  envConfigInstance = null;
}
