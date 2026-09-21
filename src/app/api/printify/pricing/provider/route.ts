/**
 * GET /api/printify/pricing/provider?blueprintId=X&providerId=Y
 *
 * Returns live pricing (cost per variant) for a specific blueprint + print provider combination.
 *
 * Strategy:
 * 1. Check in-memory pricing index (populated from shop products, refreshed every 15 min)
 * 2. If not found, scan shop products for the exact blueprint+provider match
 * 3. If still not found, create a temporary draft product using an existing uploaded image
 *    to get Printify's live pricing, then immediately delete the draft.
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyPricingService } from '@/services/printify/PrintifyPricingService';
import { printifyCatalogAPI } from '@/services/printify/PrintifyClient';

// Simple in-memory cache for the draft-fetch approach, so we don't create/delete products repeatedly
const draftPricingCache = new Map<string, { data: Record<number, number>; minCost: number; timestamp: number }>();
const DRAFT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cache the reusable image ID fetched from the account's uploads
let cachedUploadImageId: string | null = null;
let cachedUploadImageTimestamp = 0;
const IMAGE_ID_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getReusableImageId(apiKey: string): Promise<string | null> {
  const now = Date.now();
  if (cachedUploadImageId && now - cachedUploadImageTimestamp < IMAGE_ID_CACHE_TTL) {
    return cachedUploadImageId;
  }

  try {
    const res = await fetch('https://api.printify.com/v1/uploads.json?limit=5', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Loka-Store/1.0',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const uploads = data.data || [];
    if (uploads.length > 0) {
      cachedUploadImageId = uploads[0].id;
      cachedUploadImageTimestamp = now;
      console.log(`[DraftPricing] Using reusable image: ${cachedUploadImageId}`);
      return cachedUploadImageId;
    }

    // If no uploads exist in account, upload a 1x1 dot PNG to use as temporary placement
    console.log('[DraftPricing] No uploads found, uploading temporary 1x1 dot PNG...');
    const uploadRes = await fetch('https://api.printify.com/v1/uploads/images.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Loka-Store/1.0',
      },
      body: JSON.stringify({
        file_name: 'pricing_placeholder.png',
        contents: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      }),
    });
    if (uploadRes.ok) {
      const upData = await uploadRes.json();
      if (upData.id) {
        cachedUploadImageId = upData.id;
        cachedUploadImageTimestamp = now;
        console.log(`[DraftPricing] Created placeholder upload: ${cachedUploadImageId}`);
        return cachedUploadImageId;
      }
    }
  } catch (e) {
    console.warn('[DraftPricing] Failed to fetch/upload existing uploads:', e);
  }
  return null;
}

async function fetchPricingViaDraft(
  blueprintId: number,
  providerId: number
): Promise<{ variantCosts: Record<number, number>; minCost: number; maxCost?: number } | null> {
  const cacheKey = `${blueprintId}_${providerId}`;
  const cached = draftPricingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DRAFT_CACHE_TTL) {
    console.log(`[DraftPricing] Cache hit for blueprint ${blueprintId} / provider ${providerId}: min=$${cached.minCost.toFixed(2)}`);
    return { variantCosts: cached.data, minCost: cached.minCost };
  }

  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!apiKey || !shopId) return null;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Loka-Store/1.0',
  };

  // Get a reusable uploaded image ID from the account
  const imageId = await getReusableImageId(apiKey);
  if (!imageId) {
    console.warn('[DraftPricing] No uploaded images available for draft approach');
    return null;
  }

  let draftProductId: string | null = null;

  try {
    // Step 1: Get all variant IDs from catalog (no cost data here, just structure)
    const variantsData = await printifyCatalogAPI.getBlueprintVariants(blueprintId, providerId);
    const allVariantIds = (variantsData.variants || []).map((v: any) => v.id);

    if (allVariantIds.length === 0) {
      console.warn(`[DraftPricing] No catalog variants for blueprint ${blueprintId} / provider ${providerId}`);
      return null;
    }

    // Step 2: Extract placeholder position from the catalog variant data (or fallback to 'front')
    const rawData = variantsData as any;
    const position =
      rawData.placeholders?.[0]?.position ||
      rawData.variants?.[0]?.placeholders?.[0]?.position ||
      'front';

    // Printify limits enabled variants to 100 per product creation request.
    // Chunk variant IDs into batches of at most 100 to support large catalogs (e.g. Gildan 5000 with 130+ variants).
    const BATCH_SIZE = 100;
    const variantBatches: number[][] = [];
    for (let i = 0; i < allVariantIds.length; i += BATCH_SIZE) {
      variantBatches.push(allVariantIds.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `[DraftPricing] Blueprint ${blueprintId} / provider ${providerId}: ${allVariantIds.length} variants across ${variantBatches.length} batch(es), position: ${position}`
    );

    const variantCosts: Record<number, number> = {};

    for (let batchIdx = 0; batchIdx < variantBatches.length; batchIdx++) {
      const batch = variantBatches[batchIdx];
      let tempDraftId: string | null = null;
      try {
        const createRes = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `__LOKA_PRICING_TEMP_${blueprintId}_${providerId}_${batchIdx}_${Date.now()}`,
            blueprint_id: blueprintId,
            print_provider_id: providerId,
            variants: batch.map((id: number) => ({
              id,
              price: 999, // dummy retail price (irrelevant for cost lookup)
              is_enabled: true,
            })),
            print_areas: [
              {
                variant_ids: batch,
                placeholders: [
                  {
                    position,
                    images: [
                      {
                        id: imageId,
                        x: 0.5,
                        y: 0.5,
                        scale: 1,
                        angle: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.warn(`[DraftPricing] Draft creation failed for batch ${batchIdx} (${createRes.status}): ${errText}`);
          continue;
        }

        const draftProduct = await createRes.json();
        tempDraftId = draftProduct.id;

        for (const v of draftProduct.variants || []) {
          if (v.cost != null && v.cost > 0) {
            variantCosts[v.id] = v.cost / 100; // cents -> dollars
          }
        }
      } catch (err) {
        console.warn(`[DraftPricing] Error processing batch ${batchIdx}:`, err);
      } finally {
        if (tempDraftId) {
          try {
            await fetch(`https://api.printify.com/v1/shops/${shopId}/products/${tempDraftId}.json`, {
              method: 'DELETE',
              headers,
            });
          } catch (e) {
            console.warn(`[DraftPricing] Failed to delete draft product ${tempDraftId}:`, e);
          }
        }
      }
    }

    const allCosts = Object.values(variantCosts);
    if (allCosts.length === 0) {
      console.warn(`[DraftPricing] No variant costs could be resolved for blueprint ${blueprintId} / provider ${providerId}`);
      return null;
    }

    const minCost = Math.min(...allCosts);
    const maxCost = Math.max(...allCosts);
    console.log(`[DraftPricing] Successfully resolved ${allCosts.length} variant costs. Min: $${minCost.toFixed(2)}, Max: $${maxCost.toFixed(2)}`);

    // Cache the result to avoid repeated create/delete cycles
    draftPricingCache.set(cacheKey, { data: variantCosts, minCost, timestamp: Date.now() });

    // Populate in-memory pricing service and persist to disk
    for (const [variantIdStr, cost] of Object.entries(variantCosts)) {
      printifyPricingService.injectVariantCost(blueprintId, providerId, parseInt(variantIdStr), cost);
    }
    printifyPricingService.saveProviderPricingToDisk(blueprintId, providerId, minCost, maxCost, variantCosts);

    return { variantCosts, minCost, maxCost };
  } catch (outerErr) {
    console.error(`[DraftPricing] Unexpected error in fetchPricingViaDraft:`, outerErr);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const blueprintId = parseInt(searchParams.get('blueprintId') || '');
    const providerId = parseInt(searchParams.get('providerId') || '');

    if (isNaN(blueprintId) || isNaN(providerId)) {
      return NextResponse.json({ error: 'blueprintId and providerId are required' }, { status: 400 });
    }

    const forceRefresh = searchParams.get('refresh') === 'true';
    const isStale = printifyPricingService.isProviderDataStale(blueprintId, providerId);

    console.log(`[PricingAPI] Request for blueprint ${blueprintId} / provider ${providerId} (forceRefresh=${forceRefresh}, isStale=${isStale})`);

    // ── Layer 1: in-memory / persistent verified cache ───────────────────
    await printifyPricingService.initialize().catch(() => {});
    await printifyPricingService.fetchProviderCostsOnDemand(blueprintId, providerId).catch(() => {});

    const hasData = !forceRefresh && !isStale && printifyPricingService.hasProviderData(blueprintId, providerId);

    if (hasData) {
      // Build variant cost map from the in-memory index
      const variantsData = await printifyCatalogAPI.getBlueprintVariants(blueprintId, providerId)
        .catch(() => ({ variants: [] as any[] }));

      const variantList = (variantsData.variants || []).map((v: any) => ({
        variantId: v.id,
        cost: printifyPricingService.getVariantCostSync(blueprintId, providerId, v.id),
      }));

      const validCosts = variantList.filter(r => r.cost !== null).map(r => r.cost as number);
      const minCost = validCosts.length > 0 ? Math.min(...validCosts) : null;
      const maxCost = validCosts.length > 0 ? Math.max(...validCosts) : null;

      console.log(`[PricingAPI] blueprint ${blueprintId} / provider ${providerId}: min=$${minCost?.toFixed(2) || 'N/A'}, max=$${maxCost?.toFixed(2) || 'N/A'} (verified_index)`);

      return NextResponse.json({
        success: true,
        source: 'verified_index',
        blueprintId,
        providerId,
        minCost,
        maxCost,
        variants: variantList,
      });
    }

    // ── Layer 2: draft-product approach ──────────────────────────────────
    console.log(`[PricingAPI] No shop data for blueprint ${blueprintId} / provider ${providerId} — trying draft approach...`);
    const draftResult = await fetchPricingViaDraft(blueprintId, providerId);

    if (draftResult && Object.keys(draftResult.variantCosts).length > 0) {
      const allDraftCosts = Object.values(draftResult.variantCosts);
      const minCost = draftResult.minCost;
      const maxCost = allDraftCosts.length > 0 ? Math.max(...allDraftCosts) : minCost;

      console.log(`[PricingAPI] blueprint ${blueprintId} / provider ${providerId}: min=$${minCost.toFixed(2)}, max=$${maxCost.toFixed(2)} (draft_product)`);

      return NextResponse.json({
        success: true,
        source: 'draft_product',
        blueprintId,
        providerId,
        minCost,
        maxCost,
        variants: Object.entries(draftResult.variantCosts).map(([id, cost]) => ({
          variantId: parseInt(id),
          cost,
        })),
      });
    }

    // ── Layer 3: nothing worked ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      source: 'unavailable',
      blueprintId,
      providerId,
      minCost: null,
      variants: [],
      message: 'Pricing data unavailable for this blueprint + provider combination',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pricing request failed';
    console.error('[Printify Pricing API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
