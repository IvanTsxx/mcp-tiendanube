import type { TokenConfig } from "../config/env";
import {
  TiendaNubeError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  ApiUnavailableError,
} from "../domain/errors";
import type { TiendaNubeError as TiendaNubeErrorType } from "../domain/errors";

// Retry configuration for 429 responses
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const REQUEST_TIMEOUT = 30_000; // 30 seconds

export interface TiendaNubeAdapter {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

interface TiendaNubeAdapterOptions {
  config: TokenConfig;
  userAgent?: string;
}

function createTiendaNubeError(
  status: number,
  statusText: string,
  _body?: unknown
): TiendaNubeErrorType {
  switch (status) {
    case 401: {
      return new UnauthorizedError();
    }
    case 404: {
      return new NotFoundError("Resource", "unknown");
    }
    case 429: {
      return new RateLimitError();
    }
    case 503: {
      return new ApiUnavailableError();
    }
    default: {
      return new TiendaNubeError(
        `API error: ${status} ${statusText}`,
        "API_ERROR",
        status
      );
    }
  }
}

async function sleep(ms: number): Promise<void> {
  // Use setTimeout with resolve pattern instead of new Promise executor
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function createAdapter(
  options: TiendaNubeAdapterOptions
): TiendaNubeAdapter {
  const {
    config,
    userAgent = "mcp-tiendanube (https://github.com/tiendanube)",
  } = options;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${config.TIENDANUBE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": userAgent,
  };

  async function requestWithRetry<T>(
    method: string,
    path: string,
    body?: unknown,
    retryCount = 0
  ): Promise<T> {
    const url = `${config.TIENDANUBE_API_BASE_URL}/${config.TIENDANUBE_STORE_ID}${path}`;

    const requestOptions: RequestInit = {
      headers,
      method,
    };

    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    let response: Response;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      requestOptions.signal = controller.signal;

      response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new TiendaNubeError("Request timeout", "TIMEOUT", 408);
      }
      throw new TiendaNubeError(
        `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
        "NETWORK_ERROR",
        0
      );
    }

    // Handle 429 Rate Limit with exponential backoff
    if (response.status === 429) {
      if (retryCount < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryCount];
        // Add jitter (10% random)
        const jitter = delay * 0.1 * Math.random();
        await sleep(delay + jitter);
        return requestWithRetry<T>(method, path, body, retryCount + 1);
      }
      throw new RateLimitError();
    }

    // Handle other error statuses
    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const error = createTiendaNubeError(
        response.status,
        response.statusText,
        errorBody
      );

      // For 404, we can provide more context
      if (response.status === 404 && path.includes("/products/")) {
        const id = path.split("/products/")[1]?.split("?")[0];
        throw new NotFoundError("Product", id || "unknown");
      }

      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  return {
    delete(path: string): Promise<void> {
      return requestWithRetry<void>("DELETE", path);
    },

    get<T>(path: string, params?: Record<string, string>): Promise<T> {
      const queryString = params
        ? `?${new URLSearchParams(params).toString()}`
        : "";
      return requestWithRetry<T>("GET", `${path}${queryString}`);
    },

    post<T>(path: string, body: unknown): Promise<T> {
      return requestWithRetry<T>("POST", path, body);
    },

    put<T>(path: string, body: unknown): Promise<T> {
      return requestWithRetry<T>("PUT", path, body);
    },
  };
}
