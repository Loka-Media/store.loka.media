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

  const candidateUrls: string[] = [];

  const extractAndPush = (item: any) => {
    if (!item) return;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(extractAndPush);
          } else {
            extractAndPush(parsed);
          }
        } catch {
          return;
        }
      } else if (!trimmed.includes("placeholder-product") && !trimmed.includes("placeholder")) {
        candidateUrls.push(trimmed);
      }
    } else if (typeof item === "object") {
      const url =
        item.permanent_url ||
        item.src ||
        item.url ||
        item.image_url ||
        item.preview_url ||
        item.file_url;
      if (url && typeof url === "string") {
        extractAndPush(url);
      }
    }
  };

  // 1. Collect from thumbnail_url / thumbnailUrl
  extractAndPush(product.thumbnail_url);
  extractAndPush(product.thumbnailUrl);

  // 2. Collect from images
  if (Array.isArray(product.images)) {
    product.images.forEach(extractAndPush);
  } else if (product.images) {
    extractAndPush(product.images);
  }

  // 3. Collect from mockups
  if (Array.isArray(product.mockups)) {
    product.mockups.forEach(extractAndPush);
  } else if (product.mockups) {
    extractAndPush(product.mockups);
  }

  // 4. Collect from variants
  if (Array.isArray(product.variants)) {
    product.variants.forEach((v: any) => {
      extractAndPush(v?.image_url || v?.image || v?.src || v?.url);
    });
  }

  // 5. Collect direct image
  extractAndPush(product.image_url || product.image || product.preview_url);

  // 6. Base product fallback
  if (product.base_product) {
    extractAndPush(product.base_product.thumbnail_url || product.base_product.images?.[0]);
  }

  // Deduplicate candidate URLs
  const uniqueUrls = Array.from(new Set(candidateUrls)).filter(Boolean);

  if (uniqueUrls.length > 0) {
    // Sort unique URLs so that images WITH printed designs / artwork or generated mockups come FIRST
    uniqueUrls.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      const aHasDesign = aLower.includes('design') || aLower.includes('printify') || aLower.includes('preview') || aLower.includes('mockup');
      const bHasDesign = bLower.includes('design') || bLower.includes('printify') || bLower.includes('preview') || bLower.includes('mockup');

      const aIsBlank = aLower.includes('blank') || aLower.includes('flat_') || aLower.includes('camera_1_front.jpg');
      const bIsBlank = bLower.includes('blank') || bLower.includes('flat_') || bLower.includes('camera_1_front.jpg');

      let aScore = 0;
      let bScore = 0;

      if (aHasDesign) aScore += 10;
      if (bHasDesign) bScore += 10;
      if (aIsBlank) aScore -= 20;
      if (bIsBlank) bScore -= 20;

      return bScore - aScore;
    });

    return uniqueUrls[0];
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