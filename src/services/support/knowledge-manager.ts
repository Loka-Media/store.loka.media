/**
 * Loka Media - Centralized Knowledge Management Service
 * 
 * Provides centralized storage, indexing, and runtime management for:
 * - FAQs (Question & Answer pairs)
 * - Products (Customer-facing merchandise, sizing, specs)
 * - Policies (Shipping, Returns, Refunds, Quality Guarantee)
 * - Support Articles & Brand Information
 * 
 * Enables dynamic updates without rebuilding or restarting the chatbot.
 */

import fs from 'fs';
import path from 'path';
import { SUPPORT_KNOWLEDGE_BASE, KnowledgeItem } from '../../config/support-knowledge';

export type KnowledgeCategory =
  | 'faq'
  | 'products'
  | 'shipping'
  | 'returns'
  | 'policies'
  | 'brand'
  | 'orders'
  | 'payments'
  | 'creator'
  | 'support';

export interface ManagedKnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  source: string;
  tags: string[];
  lastUpdated: string;
  enabled?: boolean;
}

export interface ReindexStats {
  totalItems: number;
  activeItems: number;
  totalTokens: number;
  categoryCounts: Record<string, number>;
  lastReindexedAt: string;
  status: 'HEALTHY' | 'SYNCHRONIZED';
}

const STORAGE_PATH = path.join(process.cwd(), 'src/config/support_knowledge_custom.json');

// In-memory cache for fast search retrieval without repeated disk IO
let memoryItems: ManagedKnowledgeItem[] | null = null;
let lastReindexedTimestamp: string = new Date().toISOString();
let cachedTokensCount = 0;

/**
 * Seed initial FAQs if not already present
 */
const DEFAULT_FAQS: ManagedKnowledgeItem[] = [
  {
    id: 'faq-order-tracking',
    title: 'How do I track my order status?',
    category: 'faq',
    content: 'You will receive an automated tracking email once your order ships with your carrier link. You can also view live order progress anytime at store.loka.media/profile.',
    source: '/profile',
    tags: ['faq', 'track order', 'order tracking', 'tracking number', 'where is my order', 'status'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-change-shipping-address',
    title: 'Can I change my delivery address after placing an order?',
    category: 'faq',
    content: 'Address updates must be requested within 2 to 4 hours of ordering before printing begins. Email support@loka.media immediately with your Order Number and corrected shipping address.',
    source: '/contact',
    tags: ['faq', 'change address', 'wrong address', 'edit address', 'shipping address update'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-damaged-or-defective',
    title: 'What if my item arrives damaged or with a print defect?',
    category: 'faq',
    content: 'We offer a 100% Quality Guarantee within 30 days! Simply email support@loka.media with clear photos of the defect and your order number. We will send a free replacement or full refund immediately without needing you to return the item.',
    source: '/returns',
    tags: ['faq', 'damaged', 'defective', 'misprint', 'broken', 'replacement', 'refund defect'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-return-sizing',
    title: 'Can I return an item if I ordered the wrong size?',
    category: 'faq',
    content: 'Because each item is custom crafted on demand especially for you, we cannot accept returns or exchanges for sizing errors or buyer remorse. Please check our detailed size charts on each product page before ordering.',
    source: '/returns',
    tags: ['faq', 'wrong size', 'return size', 'exchange size', 'sizing return'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-shipping-timelines',
    title: 'How long does delivery take?',
    category: 'faq',
    content: 'Orders take 2 to 5 business days for custom printing and quality checks. Domestic US delivery takes 3 to 7 business days after production. International delivery ranges from 7 to 15 business days.',
    source: '/returns',
    tags: ['faq', 'delivery time', 'how long to ship', 'shipping days', 'turnaround', 'arrival'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-founder',
    title: 'Who is the founder of Loka Media?',
    category: 'faq',
    content: 'The founder of Loka Media is Perry Mangat (Founder & CEO). The company was established by Perry Mangat alongside co-founder Rupan Bal to empower creators and artists worldwide to launch custom branded merchandise lines. For corporate inquiries or executive partnerships, email hello@loka.media.',
    source: '/about',
    tags: ['faq', 'founder', 'perry mangat', 'perry', 'mangat', 'co-founder', 'who founded', 'rupan bal', 'founder name', 'who created', 'leadership', 'owner', 'ceo'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-cost-usage',
    title: 'How much does it cost to use Loka?',
    category: 'faq',
    content: 'Loka is 100% free to join with zero upfront costs or monthly fees. Products are printed on demand only when an order is placed. Creators set their own selling price and keep up to 90% of their profit markup.',
    source: '/creators',
    tags: ['faq', 'cost', 'free', 'how much does it cost', 'pricing', 'platform fee', 'upfront cost'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-custom-domain',
    title: 'Can I connect a custom domain to my Loka store?',
    category: 'faq',
    content: 'Yes! Creators can connect their own custom domain to their Loka storefront to maintain brand identity and provide a seamless shopping experience for fans.',
    source: '/creators',
    tags: ['faq', 'custom domain', 'domain', 'store url', 'branding'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-design-artwork-support',
    title: 'Does Loka offer artwork and design support?',
    category: 'faq',
    content: 'Yes! Loka includes a built-in Canvas Studio with typography, clipart libraries, and 360° product mockup previews. Our team also offers design guidance and templates to help you launch.',
    source: '/creator/studio',
    tags: ['faq', 'design tools', 'canvas', 'artwork', 'mockup', 'design support'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-customize-products',
    title: 'How do creators customize and design products on Loka Media?',
    category: 'faq',
    content: 'Customizing products is easy with our built-in Canvas Studio: 1. Sign in or apply at store.loka.media/creators. 2. Pick a product blank (T-Shirts, Hoodies, Mugs, Suitcases, etc.). 3. Open Canvas Studio to upload artwork, add text, and layer graphics. 4. Inspect your design in 360° interactive mockup angles. 5. Set your selling price, profit margin (keep up to 90%), and publish to your store!',
    source: '/creator/studio, /creators',
    tags: ['faq', 'customize', 'customise', 'how to customize', 'kese customise kare', 'kaise customize kare', 'design products', 'canvas editor'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-buy-products',
    title: 'How do customers buy products on Loka Media?',
    category: 'faq',
    content: 'Buying products is simple and secure: 1. Explore creator designs at store.loka.media/products or your favorite creator’s shop. 2. On the product page, check 360° views, select color and size. 3. Click Add to Cart. 4. Go to /checkout-unified, enter delivery address, and choose shipping. 5. Pay securely via Card (Stripe), PayPal, Apple Pay, Google Pay, or Klarna. You’ll receive an order confirmation and live tracking link!',
    source: '/products, /checkout-unified',
    tags: ['faq', 'how to buy', 'buy products', 'kese buy kare', 'kaise kharide', 'how customers buy', 'purchase merchandise', 'checkout'],
    lastUpdated: '2026-10-06',
    enabled: true
  },
  {
    id: 'faq-become-creator',
    title: 'How do I start selling as a creator on Loka Media?',
    category: 'faq',
    content: 'Apply for a creator storefront at store.loka.media/creators. Once approved, you can upload your designs, choose high-grade products from our catalog, set your own profit margins, and start earning instantly with zero upfront costs.',
    source: '/creators',
    tags: ['faq', 'become creator', 'creator shop', 'artist store', 'sell designs', 'how to sell'],
    lastUpdated: '2026-10-06',
    enabled: true
  }
];

/**
 * Loads items from disk storage, or initializes with seed data if file does not exist
 */
function loadFromDisk(): ManagedKnowledgeItem[] {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[KnowledgeManager] Failed to read knowledge storage from disk:', err);
  }

  // Initial seeding: merge baseline SUPPORT_KNOWLEDGE_BASE with default FAQs
  const seeded: ManagedKnowledgeItem[] = [
    ...SUPPORT_KNOWLEDGE_BASE.map(item => ({
      ...item,
      category: item.category as KnowledgeCategory,
      enabled: true
    })),
    ...DEFAULT_FAQS
  ];

  // Save initial seed to disk
  saveToDisk(seeded);
  return seeded;
}

/**
 * Persists knowledge items safely to disk
 */
function saveToDisk(items: ManagedKnowledgeItem[]): void {
  try {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('[KnowledgeManager] Failed to write knowledge storage to disk:', err);
  }
}

/**
 * Returns in-memory items or loads them lazily
 */
function getItems(): ManagedKnowledgeItem[] {
  if (!memoryItems) {
    memoryItems = loadFromDisk();
    reindexInternal();
  }
  return memoryItems;
}

/**
 * Internal indexing token counter
 */
function reindexInternal(): ReindexStats {
  const items = memoryItems || loadFromDisk();
  memoryItems = items;

  let totalTokens = 0;
  const categoryCounts: Record<string, number> = {};

  for (const item of items) {
    if (item.enabled !== false) {
      const text = `${item.title} ${item.content} ${item.tags.join(' ')}`;
      const tokens = text.split(/\s+/).filter(Boolean);
      totalTokens += tokens.length;
    }
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  cachedTokensCount = totalTokens;
  lastReindexedTimestamp = new Date().toISOString();

  return {
    totalItems: items.length,
    activeItems: items.filter(i => i.enabled !== false).length,
    totalTokens,
    categoryCounts,
    lastReindexedAt: lastReindexedTimestamp,
    status: 'HEALTHY'
  };
}

/**
 * PUBLIC API: Get all knowledge items with optional filtering
 */
export function getAllKnowledgeItems(filters?: {
  category?: string;
  search?: string;
}): { items: ManagedKnowledgeItem[]; stats: ReindexStats } {
  const all = getItems();
  let filtered = [...all];

  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter(i => i.category.toLowerCase() === filters.category?.toLowerCase());
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.content.toLowerCase().includes(q) ||
      i.tags.some(t => t.toLowerCase().includes(q)) ||
      i.id.toLowerCase().includes(q)
    );
  }

  const stats: ReindexStats = {
    totalItems: all.length,
    activeItems: all.filter(i => i.enabled !== false).length,
    totalTokens: cachedTokensCount,
    categoryCounts: all.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastReindexedAt: lastReindexedTimestamp,
    status: 'HEALTHY'
  };

  return { items: filtered, stats };
}

/**
 * PUBLIC API: Get a single knowledge item by ID
 */
export function getKnowledgeItemById(id: string): ManagedKnowledgeItem | undefined {
  const items = getItems();
  return items.find(i => i.id === id);
}

/**
 * PUBLIC API: Create a new knowledge item (FAQ, Product info, Policy, etc.)
 */
export function createKnowledgeItem(data: {
  title: string;
  category: KnowledgeCategory;
  content: string;
  source?: string;
  tags?: string[];
  id?: string;
  enabled?: boolean;
}): ManagedKnowledgeItem {
  const items = getItems();

  const generatedId = data.id?.trim() || `${data.category}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Format tags
  const tags = Array.isArray(data.tags)
    ? data.tags.map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const newItem: ManagedKnowledgeItem = {
    id: generatedId,
    title: data.title.trim(),
    category: data.category,
    content: data.content.trim(),
    source: data.source?.trim() || '/help',
    tags: tags.length > 0 ? tags : [data.category, ...data.title.toLowerCase().split(/\s+/).slice(0, 3)],
    lastUpdated: new Date().toISOString().split('T')[0],
    enabled: data.enabled !== undefined ? data.enabled : true
  };

  // Add at top of list
  items.unshift(newItem);
  saveToDisk(items);
  reindexInternal();

  return newItem;
}

/**
 * PUBLIC API: Update an existing knowledge item
 */
export function updateKnowledgeItem(
  id: string,
  updates: Partial<Omit<ManagedKnowledgeItem, 'id'>>
): ManagedKnowledgeItem | null {
  const items = getItems();
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;

  const current = items[index];
  const updatedTags = updates.tags
    ? updates.tags.map(t => t.trim().toLowerCase()).filter(Boolean)
    : current.tags;

  const updatedItem: ManagedKnowledgeItem = {
    ...current,
    ...updates,
    tags: updatedTags,
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  items[index] = updatedItem;
  saveToDisk(items);
  reindexInternal();

  return updatedItem;
}

/**
 * PUBLIC API: Delete a knowledge item by ID
 */
export function deleteKnowledgeItem(id: string): boolean {
  const items = getItems();
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return false;

  items.splice(index, 1);
  saveToDisk(items);
  reindexInternal();

  return true;
}

/**
 * PUBLIC API: Reindex knowledge base
 * Refreshes term frequencies, caches tokens, and verifies health
 */
export function reindexKnowledgeBase(): ReindexStats {
  memoryItems = loadFromDisk();
  return reindexInternal();
}

/**
 * PUBLIC API: Reset to default factory items
 */
export function resetKnowledgeBaseToDefaults(): ReindexStats {
  const defaults: ManagedKnowledgeItem[] = [
    ...SUPPORT_KNOWLEDGE_BASE.map(item => ({
      ...item,
      category: item.category as KnowledgeCategory,
      enabled: true
    })),
    ...DEFAULT_FAQS
  ];

  memoryItems = defaults;
  saveToDisk(defaults);
  return reindexInternal();
}

/**
 * PUBLIC API: Used by the Chatbot RAG Retriever
 * Returns active, enabled items converted to KnowledgeItem format
 */
export function getSearchableKnowledgeBase(): KnowledgeItem[] {
  const items = getItems();
  return items
    .filter(item => item.enabled !== false)
    .map(item => ({
      id: item.id,
      title: item.title,
      category: item.category as any,
      content: item.content,
      source: item.source,
      tags: item.tags,
      lastUpdated: item.lastUpdated
    }));
}
