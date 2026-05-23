import { createImageAdapter } from "../adapters/image.adapter";
import { createProductAdapter } from "../adapters/product.adapter";
import { createAdapter } from "../adapters/tiendanube.adapter";
import { createVariantAdapter } from "../adapters/variant.adapter";
import { loadConfig } from "../config/env";
import { createImageService } from "./image.service";
import { createProductService } from "./product.service";
import { createStockService } from "./stock.service";
import { createVariantService } from "./variant.service";

export function createProductServiceInstance() {
  const config = loadConfig();
  const httpAdapter = createAdapter({ config });
  const productAdapter = createProductAdapter(httpAdapter);
  return createProductService(productAdapter);
}

export function createStockServiceInstance() {
  const config = loadConfig();
  const httpAdapter = createAdapter({ config });
  const variantAdapter = createVariantAdapter(httpAdapter);
  return createStockService(variantAdapter);
}

export function createVariantServiceInstance() {
  const config = loadConfig();
  const httpAdapter = createAdapter({ config });
  const variantAdapter = createVariantAdapter(httpAdapter);
  return createVariantService(variantAdapter);
}

export function createImageServiceInstance() {
  const config = loadConfig();
  const httpAdapter = createAdapter({ config });
  const imageAdapter = createImageAdapter(httpAdapter);
  return createImageService(imageAdapter);
}

// cache-bust
