import { z } from "zod";

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

// Singleton config instance — loaded once at startup
let configInstance: TokenConfig | null = null;

export function loadConfig(): TokenConfig {
  if (configInstance) {
    return configInstance;
  }

  const result = TokenConfigSchema.safeParse({
    TIENDANUBE_ACCESS_TOKEN: process.env.TIENDANUBE_ACCESS_TOKEN,
    TIENDANUBE_API_BASE_URL: process.env.TIENDANUBE_API_BASE_URL,
    TIENDANUBE_STORE_ID: process.env.TIENDANUBE_STORE_ID,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  configInstance = result.data;
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}
