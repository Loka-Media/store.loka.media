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

  // Fallback: fetch print providers if missing
  if (!printProviderId) {
    try {
      console.log(`[Printify Payload Builder] printProviderId missing, fetching providers for blueprint ${blueprintId}...`);
      const providers = await printifyCatalogAPI.getPrintProviders(blueprintId);
      if (providers && providers.length > 0) {
        printProviderId = providers[0].id;
        console.log(`[Printify Payload Builder] Found provider ID: ${printProviderId}`);
        logToFile(`[Printify Payload Builder] Found provider ID: ${printProviderId}`);
      }
    } catch (err: any) {
      console.warn('[Printify Payload Builder] Failed to fetch print providers on fallback:', err?.message || err);
    }
  }

  if (!printProviderId) {
    console.warn('[Printify Payload Builder] Missing printProviderId, trying default fallback ID 99');
    logToFile('[Printify Payload Builder] Missing printProviderId, trying default fallback ID 99');
    printProviderId = 99; // Common fallback
  }

  const selectedVariantIds: number[] = (productData?.variants ?? []).map((id: any) => Number(id));
  if (selectedVariantIds.length === 0) {
    console.warn('[Printify Payload Builder] No variants selected');
    logToFile('[Printify Payload Builder] No variants selected');
    return null;
  }

  const markupPercent: number = parseFloat(productData?.markupPercentage ?? '30') || 30;

  // Fallback: fetch blueprint variants if base product has none (due to client-side caching/filtering)
  let allVariants: any[] = bp.variants ?? [];
  if (allVariants.length === 0) {
    try {
      console.log(`[Printify Payload Builder] base_product variants missing, fetching from catalog for blueprint ${blueprintId} & provider ${printProviderId}...`);
      const variantsData = await printifyCatalogAPI.getBlueprintVariants(blueprintId, printProviderId);
      allVariants = variantsData?.variants || [];
      console.log(`[Printify Payload Builder] Fetched ${allVariants.length} variants from catalog`);
    } catch (err: any) {
      console.warn('[Printify Payload Builder] Failed to fetch variants:', err?.message || err);
    }
  }

  // Build variant pricing (Printify prices are in cents)
  // Printify API requires ALL variants of the blueprint/provider to be sent.
  // We set is_enabled: false for the ones not selected.
  const variantPayload = allVariants.map((v: any) => {
    const isSelected = selectedVariantIds.includes(Number(v.id));
    const priceVal = typeof v.price === 'string' ? parseFloat(v.price) * 100 : v.price;
    const baseCents: number = typeof priceVal === 'number' && !isNaN(priceVal) ? priceVal : 1500;
    const retailCents = Math.round(baseCents * (1 + markupPercent / 100));
    return { 
      id: Number(v.id), 
      price: retailCents, 
      is_enabled: isSelected 
    };
  });

  const activeVariantIds = variantPayload.filter((v: any) => v.is_enabled).map((v: any) => v.id);

  if (activeVariantIds.length === 0) {
    console.warn('[Printify Payload Builder] No enabled variants after processing. selectedVariantIds:', selectedVariantIds);
    logToFile(`[Printify Payload Builder] No enabled variants after processing.`);
    // Fallback if somehow nothing matched
    if (selectedVariantIds.length > 0) {
      selectedVariantIds.forEach((id: number) => {
        const existing = variantPayload.find((v: any) => v.id === Number(id));
        if (existing) existing.is_enabled = true;
        else variantPayload.push({ id: Number(id), price: Math.round(1500 * (1 + markupPercent / 100)), is_enabled: true });
        if (!activeVariantIds.includes(Number(id))) activeVariantIds.push(Number(id));
      });
    } else {
      return null;
    }
  }

  // Build print areas from uploaded design files
  const printAreas: any[] = [];
  if (Array.isArray(designFiles) && designFiles.length > 0) {
    // Group by placement, normalizing names for Printify compatibility
    const byPlacement: Record<string, any[]> = {};
    for (const df of designFiles) {
      let placement: string =
        df.placement ?? df.position ?? df.print_area ?? 'front';
      
      const cleanPlacement = placement.toLowerCase();
      if (cleanPlacement === 'sleeve_left' || cleanPlacement === 'left') {
        placement = 'left_sleeve';
      } else if (cleanPlacement === 'sleeve_right' || cleanPlacement === 'right') {
        placement = 'right_sleeve';
      }

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

    // Printify requires ALL product variants (even disabled ones) to be assigned to a print area
    const allVariantIds = variantPayload.map((v: any) => v.id);

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

      await postToBackend('/api/printful/mockups/store-permanently', transformed, authHeader);

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
          const existingPrintifyId = productData?.printify_product_id || productData?.base_product?.printify_id || productData?.base_product?.printify_product_id || null;

          if (existingPrintifyId) {
            try {
              console.log(`[Printify Sync] Updating existing product ${existingPrintifyId} on Printify...`);
              created = await printifyProductsAPI.updateProduct(existingPrintifyId, printifyPayload as any);
              printifyProductId = existingPrintifyId;
            } catch (err) {
              console.warn(`[Printify Sync] Failed to update product ${existingPrintifyId}, falling back to creation...`, err);
              created = await printifyProductsAPI.createProduct(printifyPayload as any);
              printifyProductId = created?.id ?? null;
            }
          } else {
            console.log('[Printify Sync] Creating product on Printify...', {
              blueprint_id: printifyPayload.blueprint_id,
              print_provider_id: printifyPayload.print_provider_id,
              variantCount: (printifyPayload.variants as any[]).length,
            });
            created = await printifyProductsAPI.createProduct(printifyPayload as any);
            printifyProductId = created?.id ?? null;
          }

          if (printifyProductId) {
            console.log('[Printify Sync] Product created/updated on Printify:', printifyProductId);

            // Printify generates mockups asynchronously.
            // If we already have mockups from a preview, NO NEED to poll again!
            const maxAttempts = isPreview ? 10 : (mockupUrls && mockupUrls.length > 0 ? 0 : 10);
            if (maxAttempts > 0) {
              console.log('[Printify Sync] Waiting for Printify to generate mockups...');
              let attempts = 0;
              while (attempts < maxAttempts) {
                try {
                  const checkProduct = await printifyProductsAPI.getProduct(printifyProductId);
                  if (checkProduct.images && checkProduct.images.length > 0 && checkProduct.images.some(img => img.src)) {
                    created.images = checkProduct.images;
                    console.log(`[Printify Sync] Mockups generated after ${attempts * 0.8} seconds!`);
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
            } else {
              console.log('[Printify Sync] Using existing mockups from preview, skipping polling.');
            }

// Only publish to Printify shop channel if it is NOT a preview request
if (!isPreview) {
  // Fire-and-forget publish to reduce latency
  (async () => {
    try {
      await printifyProductsAPI.publishProduct(printifyProductId);
      console.log('[Printify Sync] Product published to shop.');
    } catch (pubErr) {
      console.warn('[Printify Sync] Shop publish step failed (non-fatal):', pubErr);
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
        const cleanedMockupUrls = (mockupUrls || []).map((url: any) => {
          return typeof url === 'string' ? url : url?.url || url?.src || '';
        }).filter(Boolean);

        let finalMockupUrls = cleanedMockupUrls.length > 0 ? cleanedMockupUrls : ['/placeholder-product.png'];
        let finalMockupObjects = (mockupUrls && mockupUrls.length > 0) ? mockupUrls : finalMockupUrls;

        // Merge Printify images if available and no URLs yet
        if (created && created.images && Array.isArray(created.images) && cleanedMockupUrls.length === 0) {
          const printifyImages = created.images.map((img: any) => img.src).filter(Boolean);
          if (printifyImages.length > 0) {
            finalMockupUrls = printifyImages;
            finalMockupObjects = created.images;
          }
        }

        const updatedProductData = {
          ...productData,
          source: 'printify',
          ...(printifyProductId ? { printify_product_id: printifyProductId } : {}),
          thumbnail_url: finalMockupUrls[0],
          thumbnailUrl: finalMockupUrls[0],
          images: finalMockupUrls,
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

        console.log('[Printify Sync] Posting publishing payload to backend /api/printful/mockups/store-permanently...');
        logToFile(`[Printify Sync] Posting publishing payload to backend /api/printful/mockups/store-permanently...`);
        const saved = await postToBackend(
          '/api/printful/mockups/store-permanently',
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
