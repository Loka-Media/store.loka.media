import { z } from "zod";

export const productNameValidator = z
  .string()
  .min(1, "Product name is required")
  .min(3, "Product name must be at least 3 characters")
  .max(100, "Product name must not exceed 100 characters");

export const productDescriptionValidator = z
  .string()
  .min(1, "Product description is required")
  .min(20, "Description must be at least 20 characters")
  .max(1000, "Description must not exceed 1000 characters");

export const markupPercentageValidator = z
  .number()
  .min(0, "Markup must be at least 0%")
  .max(500, "Markup must not exceed 500%");

export const productCategoryValidator = z
  .string()
  .min(1, "Category is required");

export const productTagsValidator = z
  .array(z.string())
  .max(10, "Maximum 10 tags allowed");

export const productDetailsSchema = z.object({
  name: productNameValidator,
  description: productDescriptionValidator,
  markupPercentage: markupPercentageValidator,
  category: productCategoryValidator,
  tags: productTagsValidator,
});

export type ProductDetailsFormData = z.infer<typeof productDetailsSchema>;

export function validateProductName(name: string): true | string {
  const result = productNameValidator.safeParse(name);
  return result.success ? true : result.error.issues[0].message;
}

export function validateProductDescription(description: string): true | string {
  const result = productDescriptionValidator.safeParse(description);
  return result.success ? true : result.error.issues[0].message;
}

export function validateMarkupPercentage(markup: number): true | string {
  const result = markupPercentageValidator.safeParse(markup);
  return result.success ? true : result.error.issues[0].message;
}

export function validateProductCategory(category: string): true | string {
  const result = productCategoryValidator.safeParse(category);
  return result.success ? true : result.error.issues[0].message;
}

export function validateProductTags(tags: string[]): true | string {
  const result = productTagsValidator.safeParse(tags);
  return result.success ? true : result.error.issues[0].message;
}
