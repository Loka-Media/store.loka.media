import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

export function extractIdFromSlug(slug: string): string | null {
  // Extract ID from slug format: "product-name-123" -> "123"
  // The ID is always the last number after the last dash
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if the last part is a number
  if (/^\d+$/.test(lastPart)) {
    return lastPart;
  }
  
  return null;
}

export function createProductSlug(name: string, id: number): string {
  const slug = createSlug(name);
  return `${slug}-${id}`;
}

export function parseProductSlug(slug: string): { name: string; id: string } | null {
  const id = extractIdFromSlug(slug);
  if (!id) return null;
  
  const name = slug.replace(/-\d+$/, '').replace(/-/g, ' ');
  return { name, id };
}

const STATIC_BLUEPRINT_IMAGES: Record<number, string> = {
  1: "https://images.printify.com/66d82988a65761e5f9096537",
  2: "https://images.printify.com/66dedd239da894140e0af9e2",
  3: "https://images.printify.com/66d81786ae1f0775ec0aef82",
  4: "https://images.printify.com/66d824496c2346293e0162c3",
  5: "https://images.printify.com/66c44156f0147a606a0fc682",
  6: "https://images.printify.com/66c42e5361b2691da8085442",
  7: "https://images.printify.com/66d710c18803b780c6023c7f",
  8: "https://images.printify.com/66d82988a65761e5f9096537",
  9: "https://images.printify.com/66d81786ae1f0775ec0aef82",
  10: "https://images.printify.com/66d82988a65761e5f9096537",
  12: "https://images.printify.com/66d81786ae1f0775ec0aef82",
  15: "https://images.printify.com/66d6d029611b329cb2045f53",
  68: "https://images.printify.com/66dedd239da894140e0af9e2",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getValidImageUrl(product: any): string {
  if (!product) return "/placeholder-product.svg";

  const extractUrl = (item: any): string | null => {
    if (!item) return null;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed || trimmed.includes("placeholder-product") || trimmed.includes("placeholder")) return null;
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          return extractUrl(Array.isArray(parsed) ? parsed[0] : parsed);
        } catch {
          return null;
        }
      }
      return trimmed;
    }
    if (typeof item === "object") {
      return (
        item.permanent_url ||
        item.src ||
        item.url ||
        item.image_url ||
        item.preview_url ||
        item.file_url ||
        null
      );
    }
    return null;
  };

  const fromThumb = extractUrl(product.thumbnail_url);
  if (fromThumb) return fromThumb;

  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      const u = extractUrl(img);
      if (u) return u;
    }
  } else if (typeof product.images === "string") {
    const fromImagesStr = extractUrl(product.images);
    if (fromImagesStr) return fromImagesStr;
  }

  if (Array.isArray(product.mockups) && product.mockups.length > 0) {
    for (const mockup of product.mockups) {
      const u = extractUrl(mockup);
      if (u) return u;
    }
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      const u = extractUrl(v?.image_url || v?.image || v?.src || v?.url);
      if (u) return u;
    }
  }

  const directImage = extractUrl(product.image_url || product.image || product.preview_url);
  if (directImage) return directImage;

  if (product.base_product) {
    const baseImg = extractUrl(product.base_product.thumbnail_url || product.base_product.images?.[0]);
    if (baseImg) return baseImg;
  }

  const bpId = Number(
    product.printify_blueprint_id ||
    product.blueprint_id ||
    (typeof product.printify_product_id === 'number' ? product.printify_product_id : null) ||
    (typeof product.printify_product_id === 'string' && /^\d{1,5}$/.test(product.printify_product_id) ? parseInt(product.printify_product_id) : null)
  );

  if (bpId && STATIC_BLUEPRINT_IMAGES[bpId]) {
    return STATIC_BLUEPRINT_IMAGES[bpId];
  }

  return "/placeholder-product.svg";
}