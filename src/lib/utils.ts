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