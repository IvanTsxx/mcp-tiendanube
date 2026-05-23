import { z } from "zod";

// Branded types for compile-time safety
export const ProductIdSchema = z.string().brand<"ProductId">();
export type ProductId = z.infer<typeof ProductIdSchema>;

export const VariantIdSchema = z.string().brand<"VariantId">();
export type VariantId = z.infer<typeof VariantIdSchema>;

export const ImageIdSchema = z.string().brand<"ImageId">();
export type ImageId = z.infer<typeof ImageIdSchema>;

// Variant schema
export const VariantSchema = z.object({
  id: VariantIdSchema,
  price: z.string().regex(/^\d+\.\d{2}$/, "Price must be in format XX.XX"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});
export type Variant = z.infer<typeof VariantSchema>;

// Image schema
export const ImageSchema = z.object({
  id: ImageIdSchema,
  position: z.number().int().min(1, "Position must be at least 1"),
  src: z.string().url("Image source must be a valid URL"),
});
export type Image = z.infer<typeof ImageSchema>;

// Product schema
export const ProductSchema = z.object({
  description: z.string().default(""),
  id: ProductIdSchema,
  images: z.array(ImageSchema).default([]),
  name: z.string().min(1, "Product name is required"),
  price: z.string().regex(/^\d+\.\d{2}$/, "Price must be in format XX.XX"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  variants: z.array(VariantSchema).default([]),
  variants_count: z.number().int().min(0),
});
export type Product = z.infer<typeof ProductSchema>;

// Partial product for updates (all fields optional)
export const ProductUpdateSchema = ProductSchema.partial();
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

// Bulk update item schema
export const BulkUpdateItemSchema = z.object({
  id: ProductIdSchema,
  updates: ProductUpdateSchema,
});
export type BulkUpdateItem = z.infer<typeof BulkUpdateItemSchema>;

// Variant create/update input
export const VariantInputSchema = z.object({
  price: z
    .string()
    .regex(/^\d+\.\d{2}$/, "Price must be in format XX.XX")
    .optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
});
export type VariantInput = z.infer<typeof VariantInputSchema>;
