/**
 * Printify Pricing Service
 * Dynamic, provider-and-variant-specific live pricing resolver for Printify catalog products.
 *
 * Mapping Hierarchy:
 * blueprint_id -> print_provider_id -> variant_id -> live_cost
 *
 * Two-layer resolution:
 * 1. Global index: synced from all shop products (batch, 15-min TTL)
 * 2. On-demand provider lookup: fetches specific blueprint+provider from shop products API
 *    Used when provider is not found in the global index (e.g. user switches to a different provider)
 */

import fs from 'fs';
import path from 'path';
import { printifyShopAPI } from './PrintifyClient';

class PrintifyPricingService {
  private variantCostMap = new Map<string, number>(); // `${blueprintId}_${providerId}_${variantId}` -> cost in dollars
  private providerMinCostMap = new Map<string, number>(); // `${blueprintId}_${providerId}` -> min cost in dollars
  private blueprintMinCostMap = new Map<number, number>(); // `blueprintId` -> min cost in dollars
  private lastSynced: number = 0;
  private syncPromise: Promise<void> | null = null;
  private CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private fileCacheLoaded: boolean = false;

  // Per-provider on-demand fetch cache: tracks which blueprint+provider we've already tried
  private providerFetchedMap = new Map<string, number>(); // `${blueprintId}_${providerId}` -> timestamp
  private PROVIDER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.loadFileCache();
    this.loadProviderCache();
  }

  /**
   * Pre-load provider_pricing_cache.json with verified live variant prices.
   */
  private loadProviderCache(): void {
    try {
      const providerCachePath = path.join(process.cwd(), 'src/config/provider_pricing_cache.json');
      if (fs.existsSync(providerCachePath)) {
        const raw = fs.readFileSync(providerCachePath, 'utf8');
        const data = JSON.parse(raw);
        let count = 0;
        for (const [key, item] of Object.entries(data as Record<string, any>)) {
          if (!item || !item.blueprintId || !item.providerId) continue;
          const provKey = `${item.blueprintId}_${item.providerId}`;
          if (item.minCost != null && !isNaN(Number(item.minCost))) {
            this.providerMinCostMap.set(provKey, Number(item.minCost));
            const currentBpMin = this.blueprintMinCostMap.get(item.blueprintId);
            if (currentBpMin === undefined || Number(item.minCost) < currentBpMin) {
              this.blueprintMinCostMap.set(item.blueprintId, Number(item.minCost));
            }
          }
          if (item.variants && typeof item.variants === 'object') {
            for (const [vIdStr, cost] of Object.entries(item.variants)) {
              const vCost = typeof cost === 'string' ? parseFloat(cost) : Number(cost);
              if (!isNaN(vCost) && vCost > 0) {
                this.variantCostMap.set(`${provKey}_${vIdStr}`, vCost);
                count++;
              }
            }
          }
        }
        console.log(`[PrintifyPricingService] Loaded ${count} verified provider variant prices from provider_pricing_cache.json`);
      }
    } catch (e) {
      console.warn('[PrintifyPricingService] Could not load provider_pricing_cache.json:', e);
    }
  }

  /**
   * Save verified provider pricing to disk for instant loading across reboots.
   */
  saveProviderPricingToDisk(blueprintId: number, providerId: number, minCost: number, maxCost: number, variants: Record<number, number>): void {
    try {
      const providerCachePath = path.join(process.cwd(), 'src/config/provider_pricing_cache.json');
      let data: Record<string, any> = {};
      if (fs.existsSync(providerCachePath)) {
        try {
          data = JSON.parse(fs.readFileSync(providerCachePath, 'utf8'));
        } catch {
          data = {};
        }
      }
      data[`${blueprintId}_${providerId}`] = {
        blueprintId,
        providerId,
        minCost,
        maxCost,
        variants
      };
      const dir = path.dirname(providerCachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(providerCachePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[PrintifyPricingService] Saved pricing for blueprint ${blueprintId} / provider ${providerId} to disk`);
    } catch (e) {
      console.warn('[PrintifyPricingService] Failed to save provider pricing to disk:', e);
    }
  }

  /**
   * Pre-load blueprint_metadata_cache.json instantly into memory (0ms).
   */
  private loadFileCache(): void {
    if (this.fileCacheLoaded) return;
    try {
      const cachePath = path.join(process.cwd(), 'src/config/blueprint_metadata_cache.json');
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const data = JSON.parse(raw);
        let loadedCount = 0;

        for (const [bpIdStr, item] of Object.entries(data as Record<string, any>)) {
          const bpId = parseInt(bpIdStr);
          if (isNaN(bpId) || !item) continue;

          const rawCost = item.cost || item.price || item.premiumPrice;
          const cost = typeof rawCost === 'string' ? parseFloat(rawCost) : Number(rawCost);
          if (!isNaN(cost) && cost > 0) {
            this.blueprintMinCostMap.set(bpId, cost);
            loadedCount++;
          }
        }
        this.fileCacheLoaded = true;
        console.log(`[PrintifyPricingService] Loaded ${loadedCount} pre-indexed blueprint prices from cache file (0ms)`);
      }
    } catch (e) {
      console.warn('[PrintifyPricingService] Could not load blueprint_metadata_cache.json:', e);
    }
  }

  /**
   * Initialize pricing index instantly. If sync is needed, kicks off in the background.
   */
  async initialize(force = false): Promise<void> {
    this.loadFileCache();
    this.loadProviderCache();

    const now = Date.now();
    if (!force && this.lastSynced > 0 && now - this.lastSynced < this.CACHE_TTL_MS) {
      return;
    }

    if (this.syncPromise) {
      return;
    }

    // Run sync in the background so it NEVER blocks the caller HTTP request
    this.syncPromise = this.runBackgroundSync().finally(() => {
      this.syncPromise = null;
    });
  }

  private async runBackgroundSync(): Promise<void> {
    try {
      console.log('[PrintifyPricingService] Background syncing live variant costs from Printify API...');
      const shops = await printifyShopAPI.getShops().catch(() => []);
      const newVariantCostMap = new Map<string, number>();
      const newProviderMinCostMap = new Map<string, number>();
      const newBlueprintMinCostMap = new Map<number, number>();

      const apiKey = process.env.PRINTIFY_API_KEY;
      if (!apiKey) return;

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Loka-Store/1.0',
      };

      for (const shop of shops) {
        let page = 1;
          let hasMore = true;

          while (hasMore) {
            const res = await fetch(`https://api.printify.com/v1/shops/${shop.id}/products.json?limit=50&page=${page}`, {
              headers,
            });

            if (!res.ok) {
              console.warn(`[PrintifyPricingService] Failed to fetch products for shop ${shop.id}: status ${res.status}`);
              break;
            }

            const data = await res.json();
            const prods = data.data || [];

            if (prods.length === 0) {
              hasMore = false;
              break;
            }

            for (const p of prods) {
              const bpId = p.blueprint_id;
              const pId = p.print_provider_id;
              if (!bpId || !pId || !Array.isArray(p.variants)) continue;

              // CRITICAL: Only products with EXACTLY ONE printed placement (single-side)
              // represent base variant cost! Products with 2+ images include multi-side surcharges.
              let imageCount = 0;
              p.print_areas?.forEach((pa: any) => {
                pa.placeholders?.forEach((pl: any) => {
                  if (pl.images && pl.images.length > 0) imageCount += pl.images.length;
                });
              });
              if (imageCount > 1) {
                // Multi-side product (e.g. front + back)! Skip to prevent inflating base variant cost
                continue;
              }

              for (const v of p.variants) {
                if (v.cost != null && v.cost > 0) {
                  const costDollars = v.cost / 100;
                  const key = `${bpId}_${pId}_${v.id}`;
                  newVariantCostMap.set(key, costDollars);

                  const provKey = `${bpId}_${pId}`;
                  const currentProvMin = newProviderMinCostMap.get(provKey);
                  if (currentProvMin === undefined || costDollars < currentProvMin) {
                    newProviderMinCostMap.set(provKey, costDollars);
                  }

                  const currentBpMin = newBlueprintMinCostMap.get(bpId);
                  if (currentBpMin === undefined || costDollars < currentBpMin) {
                    newBlueprintMinCostMap.set(bpId, costDollars);
                  }
                }
              }
            }

            if (data.last_page && page >= data.last_page) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }

        // Merge existing verified cache into new map so verified provider pricing is NEVER wiped
        for (const [key, cost] of this.variantCostMap.entries()) {
          if (!newVariantCostMap.has(key)) {
            newVariantCostMap.set(key, cost);
          }
        }
        for (const [provKey, minCost] of this.providerMinCostMap.entries()) {
          const existing = newProviderMinCostMap.get(provKey);
          if (existing === undefined || minCost < existing) {
            newProviderMinCostMap.set(provKey, minCost);
          }
        }

        this.variantCostMap = newVariantCostMap;
        this.providerMinCostMap = newProviderMinCostMap;
        this.blueprintMinCostMap = newBlueprintMinCostMap;
        this.lastSynced = Date.now();
        console.log(`[PrintifyPricingService] Successfully indexed ${newVariantCostMap.size} live variant prices across ${newBlueprintMinCostMap.size} blueprints.`);
      } catch (err) {
        console.error('[PrintifyPricingService] Error in background live pricing sync:', err);
      }
    }

  /**
   * On-demand: Search shop products for a specific blueprint+provider combination
   * and populate the variant cost maps for that provider.
   */
  async fetchProviderCostsOnDemand(blueprintId: number, printProviderId: number): Promise<void> {
    const provKey = `${blueprintId}_${printProviderId}`;
    if (this.hasProviderData(blueprintId, printProviderId)) {
      return; // Already have complete variant pricing data for this provider
    }

    const now = Date.now();
    const lastFetched = this.providerFetchedMap.get(provKey);

    // Skip if we already checked recently for this provider
    if (lastFetched && now - lastFetched < this.PROVIDER_CACHE_TTL_MS) {
      return;
    }

    const apiKey = process.env.PRINTIFY_API_KEY;
    if (!apiKey) return;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Loka-Store/1.0',
    };

    try {
      this.providerFetchedMap.set(provKey, now);

      const shops = await printifyShopAPI.getShops().catch(() => []);
      let found = false;

      for (const shop of shops) {
        if (found) break;
        // Limit on-demand scan to first 2 pages (100 products) to keep response fast
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 2) {
          const res = await fetch(
            `https://api.printify.com/v1/shops/${shop.id}/products.json?limit=50&page=${page}`,
            { headers }
          );
          if (!res.ok) break;

          const data = await res.json();
          const prods = data.data || [];
          if (prods.length === 0) { hasMore = false; break; }

          for (const p of prods) {
            if (p.blueprint_id === blueprintId && p.print_provider_id === printProviderId && Array.isArray(p.variants)) {
              let imageCount = 0;
              p.print_areas?.forEach((pa: any) => {
                pa.placeholders?.forEach((pl: any) => {
                  if (pl.images && pl.images.length > 0) imageCount += pl.images.length;
                });
              });
              if (imageCount > 1) {
                // Multi-side product (e.g. front + back)! Skip
                continue;
              }

              for (const v of p.variants) {
                if (v.cost != null && v.cost > 0) {
                  const costDollars = v.cost / 100;
                  const varKey = `${blueprintId}_${printProviderId}_${v.id}`;
                  this.variantCostMap.set(varKey, costDollars);

                  const currentProvMin = this.providerMinCostMap.get(provKey);
                  if (currentProvMin === undefined || costDollars < currentProvMin) {
                    this.providerMinCostMap.set(provKey, costDollars);
                  }

                  const currentBpMin = this.blueprintMinCostMap.get(blueprintId);
                  if (currentBpMin === undefined || costDollars < currentBpMin) {
                    this.blueprintMinCostMap.set(blueprintId, costDollars);
                  }
                }
              }
              found = true;
              console.log(`[PrintifyPricingService] On-demand: indexed costs for blueprint ${blueprintId} / provider ${printProviderId}`);
              break;
            }
          }

          if (data.last_page && page >= data.last_page) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      if (!found) {
        console.warn(`[PrintifyPricingService] On-demand: no single-side shop product found for blueprint ${blueprintId} / provider ${printProviderId}`);
      }
    } catch (err) {
      console.error(`[PrintifyPricingService] On-demand fetch error for blueprint ${blueprintId} / provider ${printProviderId}:`, err);
    }
  }

  /**
   * Synchronous getter for blueprint min cost from memory index.
   */
  getBlueprintMinCostSync(blueprintId: number): number | null {
    if (this.blueprintMinCostMap.has(blueprintId)) {
      return this.blueprintMinCostMap.get(blueprintId)!;
    }
    return null;
  }

  /**
   * Synchronous getter for provider min cost from memory index.
   * STRICT: Only returns cost if we have data for THIS specific provider.
   * Does NOT fall back to blueprint-wide minimum (which could be from a different, cheaper provider).
   */
  getProviderMinCostSync(blueprintId: number, printProviderId: number): number | null {
    const provKey = `${blueprintId}_${printProviderId}`;
    if (this.providerMinCostMap.has(provKey)) {
      return this.providerMinCostMap.get(provKey)!;
    }
    return null;
  }

  /**
   * Check if we have verified variant pricing data for this specific provider.
   */
  hasProviderData(blueprintId: number, printProviderId: number): boolean {
    const provKey = `${blueprintId}_${printProviderId}_`;
    for (const key of this.variantCostMap.keys()) {
      if (key.startsWith(provKey)) return true;
    }
    return false;
  }

  /**
   * Synchronous getter for variant cost from memory index.
   * STRICT: Only returns cost if we have data for this specific provider.
   * Does NOT fall back to blueprint-wide minimum (from a different provider).
   */
  getVariantCostSync(blueprintId: number, printProviderId: number, variantId: number): number | null {
    const key = `${blueprintId}_${printProviderId}_${variantId}`;
    if (this.variantCostMap.has(key)) {
      return this.variantCostMap.get(key)!;
    }
    // Fall back to provider minimum (same provider, different variant) - safe
    const provKey = `${blueprintId}_${printProviderId}`;
    if (this.providerMinCostMap.has(provKey)) {
      return this.providerMinCostMap.get(provKey)!;
    }
    // Do NOT fall back to blueprint minimum - it could be from a different provider!
    return null;
  }

  /**
   * Get exact live cost for a specific blueprint, provider, and variant combination.
   * First ensures global index is loaded, then tries on-demand provider fetch if needed.
   */
  async getVariantCost(blueprintId: number, printProviderId: number, variantId: number): Promise<number | null> {
    await this.initialize();

    // Try from global index first
    const fromIndex = this.getVariantCostSync(blueprintId, printProviderId, variantId);
    if (fromIndex !== null) return fromIndex;

    // Not found — try on-demand fetch for this specific provider
    await this.fetchProviderCostsOnDemand(blueprintId, printProviderId);
    return this.getVariantCostSync(blueprintId, printProviderId, variantId);
  }

  /**
   * Get minimum live cost for a specific blueprint and print provider.
   * First ensures global index is loaded, then tries on-demand provider fetch if needed.
   * STRICT: Only returns cost specific to this provider. Returns null if not available.
   */
  async getProviderMinCost(blueprintId: number, printProviderId: number): Promise<number | null> {
    await this.initialize();

    const provKey = `${blueprintId}_${printProviderId}`;
    if (this.providerMinCostMap.has(provKey)) {
      return this.providerMinCostMap.get(provKey)!;
    }

    // Not found in index — try on-demand fetch for this specific provider
    await this.fetchProviderCostsOnDemand(blueprintId, printProviderId);

    if (this.providerMinCostMap.has(provKey)) {
      return this.providerMinCostMap.get(provKey)!;
    }

    // No shop product found for this blueprint+provider combination
    return null;
  }

  /**
   * Get minimum live cost for a blueprint across all active providers.
   */
  async getBlueprintMinCost(blueprintId: number): Promise<number | null> {
    await this.initialize();
    return this.getBlueprintMinCostSync(blueprintId);
  }

  /**
   * Inject variant cost externally (e.g., from a draft product created to get pricing).
   * This allows the pricing service to be updated with costs from sources other than the shop index.
   */
  injectVariantCost(blueprintId: number, printProviderId: number, variantId: number, costDollars: number): void {
    const key = `${blueprintId}_${printProviderId}_${variantId}`;
    this.variantCostMap.set(key, costDollars);

    const provKey = `${blueprintId}_${printProviderId}`;
    const currentProvMin = this.providerMinCostMap.get(provKey);
    if (currentProvMin === undefined || costDollars < currentProvMin) {
      this.providerMinCostMap.set(provKey, costDollars);
    }

    const currentBpMin = this.blueprintMinCostMap.get(blueprintId);
    if (currentBpMin === undefined || costDollars < currentBpMin) {
      this.blueprintMinCostMap.set(blueprintId, costDollars);
    }
  }
}

export const printifyPricingService = new PrintifyPricingService();
