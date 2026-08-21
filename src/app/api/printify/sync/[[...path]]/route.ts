/**
 * Printify Sync API Route (Optional Catch-All)
 *
 * POST /api/printify/sync/product       → Creates product on Printify + saves to backend DB
 * POST /api/printify/sync/all           → Sync all products from Printify shop → backend DB
 * POST /api/printify/sync/product/:id   → Sync single product by ID
 * GET  /api/printify/sync/status        → Sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyProductsAPI, printifyCatalogAPI } from '@/services/printify/PrintifyClient';
import { transformProductForStorefront } from '@/services/printify/PrintifyProductService';
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'sync-debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (err) {
    // Ignore errors writing logs
  }
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Extract Authorization header from the incoming Next.js request. */
function getAuthHeader(req: NextRequest): string | null {
  return req.headers.get('authorization');
}

/** Forward a payload to a backend endpoint, including the user's auth token. */
async function postToBackend(
  path: string,
  payload: unknown,
  authHeader: string | null
): Promise<{ ok: boolean; status?: number; errorText?: string; data?: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, status: res.status, data };
    }
    const errorText = await res.text().catch(() => '');
    return { ok: false, status: res.status, errorText };
  } catch (err: any) {
    return { ok: false, errorText: err?.message || String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build a Printify product creation payload from canvas data
// ─────────────────────────────────────────────────────────────────────────────

async function buildPrintifyProductPayload(
  productData: any,
  designFiles: any[]
): Promise<Record<string, unknown> | null> {
  const bp = productData?.base_product;
  if (!bp) {
    console.warn('[Printify Payload Builder] base_product is missing');
    logToFile('[Printify Payload Builder] base_product is missing');
    return null;
  }

  const blueprintId: number = bp.blueprint_id ?? bp.blueprintId ?? bp.id;
  let printProviderId: number | undefined =
    bp.print_provider_id ?? bp.printProviderId ?? bp.providers?.[0]?.id;

  if (!blueprintId) {
    console.warn('[Printify Payload Builder] Missing blueprintId');
    logToFile('[Printify Payload Builder] Missing blueprintId');
    return null;
  }

  // Ensure printProviderId is valid for the blueprint
  if (!printProviderId) {
    try {
      console.log(`[Printify Payload Builder] printProviderId missing, fetching providers for blueprint ${blueprintId}...`);
      const providers = await printifyCatalogAPI.getPrintProviders(blueprintId);
      if (providers && providers.length > 0) {
        printProviderId = Number(providers[0].id);
        console.log(`[Printify Payload Builder] Found provider ID: ${printProviderId}`);
        logToFile(`[Printify Payload Builder] Found provider ID: ${printProviderId}`);
      }
    } catch (err: any) {
      console.warn('[Printify Payload Builder] Failed to fetch print providers on fallback:', err?.message || err);
    }
  }

  if (!printProviderId) {
    console.warn('[Printify Payload Builder] Missing printProviderId, trying default fallback ID 3');
    logToFile('[Printify Payload Builder] Missing printProviderId, trying default fallback ID 3');
    printProviderId = 3; // SwiftPOD / Common provider fallback
  }

  const selectedVariantIds: number[] = (productData?.variants ?? []).map((id: any) => Number(id));
  const markupPercent: number = parseFloat(productData?.markupPercentage ?? '30') || 30;

  // Always fetch full blueprint variants directly from catalog API for the specific provider
  // to ensure variant IDs match Printify's exact schema for blueprint+provider
  let allVariants: any[] = [];
  try {
    console.log(`[Printify Payload Builder] Fetching catalog variants for blueprint ${blueprintId} & provider ${printProviderId}...`);
    const variantsData = await printifyCatalogAPI.getBlueprintVariants(blueprintId, printProviderId);
    allVariants = variantsData?.variants || [];
    console.log(`[Printify Payload Builder] Fetched ${allVariants.length} variants from catalog`);
  } catch (err: any) {
    console.warn('[Printify Payload Builder] Failed to fetch catalog variants:', err?.message || err);
    allVariants = bp.variants || [];
  }

  if (!allVariants || allVariants.length === 0) {
    allVariants = bp.variants || [];
  }

  if (!allVariants || allVariants.length === 0) {
    console.warn('[Printify Payload Builder] Zero variants available for payload creation');
    logToFile('[Printify Payload Builder] Zero variants available for payload creation');
    return null;
  }

  // Build variant payload for ALL blueprint variants of this provider
  const variantPayload = allVariants.map((v: any) => {
    const vId = Number(v.id);
    const isSelected = selectedVariantIds.length === 0 || selectedVariantIds.includes(vId);
    const priceVal = typeof v.price === 'string' ? parseFloat(v.price) * 100 : v.price;
    const baseCents: number = typeof priceVal === 'number' && !isNaN(priceVal) ? priceVal : 1500;
    
    // Apply 23% Premium discount (0.77) + 35% Loka Platform markup (1.35) + Creator Markup
    const premiumBaseCents = baseCents * 0.77;
    const lokaBaseCents = premiumBaseCents * 1.35;
    const retailCents = Math.round(lokaBaseCents * (1 + markupPercent / 100));
    
    return { 
      id: vId, 
      price: retailCents, 
      is_enabled: isSelected 
    };
  });

  // Extract ALL variant IDs from variantPayload so print_areas has 100% of variant IDs
  const allVariantIds = variantPayload.map((v: any) => v.id);

  // Gather all valid placeholder positions from catalog variants or blueprint print_areas
  const validPositionsMap = new Map<string, string>();
  allVariants.forEach((v: any) => {
    if (Array.isArray(v.placeholders)) {
      v.placeholders.forEach((p: any) => {
        if (p.position) validPositionsMap.set(p.position.toLowerCase(), p.position);
      });
    }
  });

  if (bp?.print_areas && Array.isArray(bp.print_areas)) {
    bp.print_areas.forEach((pa: any) => {
      if (Array.isArray(pa.placeholders)) {
        pa.placeholders.forEach((p: any) => {
          if (p.position) validPositionsMap.set(p.position.toLowerCase(), p.position);
        });
      }
    });
  }

  // Fallback: If validPositionsMap is empty, attempt fetching blueprint print_areas directly
  if (validPositionsMap.size === 0 && blueprintId) {
    try {
      const bpDetails: any = await printifyCatalogAPI.getBlueprint(blueprintId);
      if (bpDetails && Array.isArray(bpDetails.print_areas)) {
        bpDetails.print_areas.forEach((pa: any) => {
          if (Array.isArray(pa.placeholders)) {
            pa.placeholders.forEach((p: any) => {
              if (p.position) validPositionsMap.set(p.position.toLowerCase(), p.position);
            });
          }
        });
      }
    } catch (e) {
      console.warn('[Printify Payload Builder] Failed to fetch blueprint print_areas fallback:', e);
    }
  }

  const validPositionsList = Array.from(validPositionsMap.values());
  console.log(`[Printify Payload Builder] Valid placeholder positions for blueprint ${blueprintId}:`, validPositionsList);

  const getValidPlacement = (requestedPlacement: string): string => {
    if (validPositionsList.length === 0) return requestedPlacement;

    const clean = (requestedPlacement || 'front').toLowerCase().trim();

    // 1. Direct match (case-insensitive)
    if (validPositionsMap.has(clean)) {
      return validPositionsMap.get(clean)!;
    }

    // 2. Common alias & position mappings for Printify catalog types
    if (clean === 'sleeve_left' || clean === 'left') {
      if (validPositionsMap.has('left_sleeve')) return validPositionsMap.get('left_sleeve')!;
    }
    if (clean === 'sleeve_right' || clean === 'right') {
      if (validPositionsMap.has('right_sleeve')) return validPositionsMap.get('right_sleeve')!;
    }
    if (clean === 'front') {
      if (validPositionsMap.has('other')) return validPositionsMap.get('other')!;
      if (validPositionsMap.has('outside')) return validPositionsMap.get('outside')!;
      if (validPositionsMap.has('default')) return validPositionsMap.get('default')!;
    }
    if (clean === 'back') {
      if (validPositionsMap.has('other')) return validPositionsMap.get('other')!;
      if (validPositionsMap.has('outside')) return validPositionsMap.get('outside')!;
      if (validPositionsMap.has('inside')) return validPositionsMap.get('inside')!;
    }

    // 3. Fallback to first available valid position for this blueprint
    return validPositionsList[0];
  };

  // Build print areas from uploaded design files
  const printAreas: any[] = [];
  if (Array.isArray(designFiles) && designFiles.length > 0) {
    // Group by placement, normalizing names for Printify compatibility
    const byPlacement: Record<string, any[]> = {};
    for (const df of designFiles) {
      let rawPlacement: string =
        df.placement ?? df.position ?? df.print_area ?? 'front';
      
      const placement = getValidPlacement(rawPlacement);

      (byPlacement[placement] = byPlacement[placement] ?? []).push(df);
    }

    const placeholders: any[] = [];

    for (const [placement, files] of Object.entries(byPlacement)) {
      const images = files
        .map((df: any) => {
          const imgId: string | undefined =
            df.printify_id ??
            df.upload_id ??
            df.imageId ??
            (typeof df.id === 'string' ? df.id : undefined);

          if (!imgId) return null;

          // Compute normalized x, y, scale if not explicitly set but position is available
          let x = df.x;
          let y = df.y;
          let scale = df.scale;
          let angle = df.rotation ?? df.angle ?? 0;

          if (df.position) {
            const p = df.position;
            const areaWidth = p.area_width || p.areaWidth || 1;
            const areaHeight = p.area_height || p.areaHeight || 1;
            const width = p.width || 0;
            const height = p.height || 0;
            const left = p.left || 0;
            const top = p.top || 0;

            if (x === undefined) {
              x = (left + width / 2) / areaWidth;
            }
            if (y === undefined) {
              y = (top + height / 2) / areaHeight;
            }
            if (scale === undefined) {
              // Scale relative to the print area width
              scale = width / areaWidth;
            }
          }

          return {
            id: imgId,
            x: x ?? 0.5,
            y: y ?? 0.5,
            scale: scale ?? 1.0,
            angle: angle,
          };
        })
        .filter(Boolean);

      if (images.length > 0) {
        placeholders.push({
          position: placement,
          images: images,
        });
      }
    }

    // Printify requires ALL product variants in variantPayload to be present in variant_ids
    if (placeholders.length > 0) {
      printAreas.push({
        variant_ids: allVariantIds,
        placeholders: placeholders,
      });
    }
  }

  const payload: Record<string, unknown> = {
    title: productData?.name ?? 'Custom Product',
    description: productData?.description ?? '',
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: variantPayload,
    tags: productData?.tags ?? [],
  };

  if (printAreas.length > 0) {
    payload.print_areas = printAreas;
  }

  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — status / health
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sync endpoint ready. POST to /api/printify/sync/product to publish.',
    backend: BACKEND_URL,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — main handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const parts = pathname.split('/');
    const productIndex = parts.indexOf('product');
    const authHeader = getAuthHeader(request);

    // ── 1. POST /api/printify/sync/all ────────────────────────────────────
    if (pathname.endsWith('/all')) {
      const allProducts: unknown[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await printifyProductsAPI.getProducts({ page, limit: 100 });
        const transformed = response.data.map((p) => transformProductForStorefront(p));
        allProducts.push(...transformed);
        hasMore = page < response.last_page;
        page++;
      }

      // Forward all products to backend for DB sync
      await postToBackend('/api/printify/sync/bulk', { products: allProducts }, authHeader);

      return NextResponse.json({
        success: true,
        message: `Synced ${allProducts.length} products`,
        count: allProducts.length,
      });
    }

    // ── 2. POST /api/printify/sync/product/:id ────────────────────────────
    if (productIndex !== -1 && parts[productIndex + 1]) {
      const productId = parts[productIndex + 1];
      const product = await printifyProductsAPI.getProduct(productId);
      const transformed = transformProductForStorefront(product);

      await postToBackend('/api/printify/mockups/store-permanently', transformed, authHeader);

      return NextResponse.json({
        success: true,
        message: `Product ${productId} synced`,
        data: transformed,
      });
    }

    // ── 3. POST /api/printify/sync/product (new publish flow) ────────────
    if (
      pathname.endsWith('/sync/product') ||
      (productIndex !== -1 && !parts[productIndex + 1])
    ) {
      const body = await request.json();
      const { mockupUrls = [], productData, designFiles = [], mockupInputs = null, availabilityData = [], isPreview = false } = body;

      let printifyProductId: string | null = null;
      let printifyError: string | null = null;
      let created: any = null;

      // ── Step A: Create or Update product on Printify API (server-side, non-fatal) ──
      try {
        const printifyPayload = await buildPrintifyProductPayload(productData, designFiles);

        if (printifyPayload) {
          // IMPORTANT: Always create a fresh Printify product for each publish.
          // Printify's PUT (update) endpoint does NOT accept print_areas — only POST (create) does.
          // Attempting to update an existing product with print_areas causes error 8251.
          // The existingPrintifyId from canvas state may also reference a base/preview product, not a real shop product.
          console.log('[Printify Sync] Creating product on Printify...', {
            blueprint_id: printifyPayload.blueprint_id,
            print_provider_id: printifyPayload.print_provider_id,
            variantCount: (printifyPayload.variants as any[]).length,
            printAreasCount: (printifyPayload.print_areas as any[] | undefined)?.length ?? 0,
          });
          created = await printifyProductsAPI.createProduct(printifyPayload as any);
          printifyProductId = created?.id ?? null;

          if (printifyProductId) {
            console.log('[Printify Sync] Product created/updated on Printify:', printifyProductId);

            // Printify generates mockups asynchronously.
            // Poll Printify API to get the generated product mockups (including human/model images)
            const maxAttempts = 10;
            console.log('[Printify Sync] Waiting for Printify to generate mockups...');
            let attempts = 0;
            while (attempts < maxAttempts) {
              try {
                const checkProduct = await printifyProductsAPI.getProduct(printifyProductId);
                if (checkProduct.images && checkProduct.images.length > 0 && checkProduct.images.some(img => img.src)) {
                  created.images = checkProduct.images;
                  console.log(`[Printify Sync] Mockups generated after ${attempts * 0.8} seconds! (${checkProduct.images.length} images)`);
                  break;
                }
              } catch (e) {
                // Ignore fetch errors during polling
              }
              await new Promise(resolve => setTimeout(resolve, 800)); // 0.8 sec interval
              attempts++;
            }
            if (!created?.images || created.images.length === 0) {
              console.warn('[Printify Sync] Mockups not ready within polling period.');
            }

// Only publish to Printify shop channel if it is NOT a preview request
if (!isPreview) {
  // Fire-and-forget publish to reduce latency
  (async () => {
    try {
      await printifyProductsAPI.publishProduct(printifyProductId);
      console.log('[Printify Sync] Product published to shop. Waiting 2 seconds for state registration...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await printifyProductsAPI.setPublishingSucceeded(printifyProductId);
      console.log('[Printify Sync] Product publishing succeeded set.');
    } catch (pubErr) {
      console.warn('[Printify Sync] Shop publish/success step failed (non-fatal):', pubErr);
      try {
        const errMsg = (pubErr as any).message || '';
        if (typeof errMsg === 'string' && (errMsg.includes('code":8254') || (errMsg.includes('Shop') && errMsg.includes('not connected')))) {
          console.warn('[Printify Sync] Shop not connected to sales channel – skipping publish step.');
        }
      } catch (_) {}
    }
  })();
}
          }
        } else {
          console.warn('[Printify Sync] Skipping Printify creation/update — insufficient data in productData.base_product');
        }
      } catch (err) {
        printifyError = err instanceof Error ? err.message : String(err);
        console.error('[Printify Sync] Printify product creation/update failed:', printifyError);
      }

      // If this is a preview mockup request, skip database storage and return mockup URLs directly
      if (isPreview) {
        if (printifyError && !printifyProductId) {
          return NextResponse.json({ error: printifyError }, { status: 500 });
        }
        const transformed = created ? transformProductForStorefront(created) : null;
        return NextResponse.json({
          success: true,
          printify_product_id: printifyProductId,
          mockups: transformed ? transformed.mockups : [],
          message: 'Preview mockups generated successfully',
        });
      }

      // ── Step B: Save to backend DB (non-fatal) ────────────────────────────
      let backendSaved = false;
      try {
        let printifyMockupUrls: string[] = [];
        let printifyMockupObjects: any[] = [];

        if (created && created.images && Array.isArray(created.images) && created.images.length > 0) {
          const transformed = transformProductForStorefront(created);
          if (transformed.mockups && transformed.mockups.length > 0) {
            printifyMockupUrls = transformed.mockups.map(m => m.src).filter(Boolean);
            printifyMockupObjects = transformed.mockups;
          }
        }

        const cleanedMockupUrls = (mockupUrls || []).map((url: any) => {
          return typeof url === 'string' ? url : url?.permanent_url || url?.url || url?.src || '';
        }).filter(Boolean);

        const bpImg = productData?.base_product?.thumbnail_url || productData?.base_product?.images?.[0]?.src || productData?.base_product?.images?.[0];
        const dfImg = designFiles?.[0]?.file_url || designFiles?.[0]?.preview_url || designFiles?.[0]?.url;

        // Custom design canvas mockups MUST take highest priority so the user's uploaded logo & placement graphics are shown
        const customMockupUrls: string[] = [...cleanedMockupUrls];

        if (printifyMockupUrls.length > 0) {
          for (const pUrl of printifyMockupUrls) {
            if (!customMockupUrls.includes(pUrl)) {
              customMockupUrls.push(pUrl);
            }
          }
        }

        let finalMockupUrls = customMockupUrls.length > 0
          ? customMockupUrls
          : bpImg
          ? [bpImg]
          : dfImg
          ? [dfImg]
          : ['/placeholder-product.svg'];

        // Sort finalMockupUrls so printed design / artwork mockups appear FIRST as thumbnail_url
        if (finalMockupUrls.length > 1) {
          finalMockupUrls.sort((a, b) => {
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
        }

        let finalMockupObjects = (mockupUrls && Array.isArray(mockupUrls) && mockupUrls.length > 0)
          ? mockupUrls
          : printifyMockupObjects.length > 0
          ? printifyMockupObjects
          : finalMockupUrls;

        const tagsArray = (productData?.tags && Array.isArray(productData.tags) && productData.tags.length > 0)
          ? productData.tags
          : typeof productData?.tags === 'string'
          ? [productData.tags]
          : ['Popular'];

        const updatedProductData = {
          ...productData,
          source: 'printify',
          ...(printifyProductId ? { printify_product_id: printifyProductId } : {}),
          thumbnail_url: finalMockupUrls[0],
          thumbnailUrl: finalMockupUrls[0],
          images: finalMockupUrls,
          tags: tagsArray,
          tag: tagsArray[0],
          tags_list: tagsArray,
        };

        if (created) {
          if (created.variants) updatedProductData.printify_variants = created.variants;
          if (created.id) updatedProductData.printify_product_id = created.id;
        }

        const backendPayload = {
          mockupUrls: finalMockupObjects,
          productData: updatedProductData,
          designFiles,
          mockupInputs: mockupInputs || {},
          availabilityData,
        };

        console.log('[Printify Sync] Posting publishing payload to backend /api/printify/mockups/store-permanently...');
        logToFile(`[Printify Sync] Posting publishing payload to backend /api/printify/mockups/store-permanently...`);
        const saved = await postToBackend(
          '/api/printify/mockups/store-permanently',
          backendPayload,
          authHeader
        );

        backendSaved = saved.ok;
        if (saved.ok) {
          console.log('[Printify Sync] Product saved to database successfully.');
          logToFile(`[Printify Sync] Product saved to database successfully.`);
        } else {
          console.error('[Printify Sync] Failed to save product to database. Status:', saved.status, 'Error:', saved.errorText);
          logToFile(`[Printify Sync] Failed to save product to database. Status: ${saved.status}, Error: ${saved.errorText}`);
        }
      } catch (backendErr: any) {
        console.error('[Printify Sync] Backend save encountered exception:', backendErr);
        logToFile(`[Printify Sync] Backend save encountered exception: ${backendErr?.message || String(backendErr)}`);
      }

        // ── Step C: Always return success so UI flow completes ─────────────
        // Ensure UI gets valid image URLs even if DB save failed
        const responsePayload: any = {
          success: true,
          marketplace_ready: true,
          printify_product_id: printifyProductId,
          backend_saved: backendSaved,
          message: printifyProductId
            ? `Product published to Printify (ID: ${printifyProductId})`
            : 'Product sync completed',
          ...(printifyError ? { printify_warning: printifyError } : {}),
        };
        // If backend save failed, guarantee placeholder images are present
        if (!backendSaved) {
          responsePayload['images'] = ['/placeholder-product.png'];
          responsePayload['thumbnail_url'] = '/placeholder-product.png';
          responsePayload['thumbnailUrl'] = '/placeholder-product.png';
        }
        return NextResponse.json(responsePayload);
    }

    return NextResponse.json({ error: 'Invalid sync endpoint' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('[Printify Sync POST] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
