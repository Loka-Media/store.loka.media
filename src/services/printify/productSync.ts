import { queryDb } from '@/lib/db';
import { printifyProductsAPI, printifyWebhooksAPI } from './PrintifyClient';
import { ensure99Pricing } from '@/lib/pricing-utils';

export interface ProductSyncResult {
  success: boolean;
  productId?: number;
  printifyProductId: string;
  action: 'updated' | 'archived' | 'not_found' | 'error';
  updatedFields?: string[];
  error?: string;
}

/**
 * Synchronize a product from Printify into Loka Media's PostgreSQL database.
 * Called automatically when a `shop:product:updated` webhook is received from Printify,
 * or invoked manually to sync any product by its Printify ID.
 */
export async function syncPrintifyProduct(
  printifyProductId: string,
  providedProductData?: any
): Promise<ProductSyncResult> {
  if (!printifyProductId) {
    return {
      success: false,
      printifyProductId: '',
      action: 'error',
      error: 'Missing printifyProductId',
    };
  }

  try {
    console.log(`[ProductSync] Syncing product from Printify (ID: ${printifyProductId})...`);

    // 1. Fetch full product details from Printify if not provided or incomplete
    let p = providedProductData;
    if (!p || !p.title || !p.images) {
      try {
        p = await printifyProductsAPI.getProduct(printifyProductId);
      } catch (fetchErr: any) {
        console.error(`[ProductSync] Failed to fetch product ${printifyProductId} from Printify:`, fetchErr?.message || fetchErr);
        return {
          success: false,
          printifyProductId,
          action: 'error',
          error: fetchErr?.message || 'Failed to fetch from Printify API',
        };
      }
    }

    if (!p) {
      return {
        success: false,
        printifyProductId,
        action: 'error',
        error: 'No product data received from Printify',
      };
    }

    // 2. Extract updated fields
    const title = p.title || '';
    const description = p.description || '';
    const images: string[] = Array.isArray(p.images)
      ? p.images.map((img: any) => (typeof img === 'string' ? img : img?.src)).filter(Boolean)
      : [];

    const defaultImg = Array.isArray(p.images)
      ? p.images.find((img: any) => img?.is_default)?.src || images[0] || ''
      : '';
    const thumbnail = defaultImg || images[0] || '';

    // Calculate base retail price from Printify variants
    const variantPrices: number[] = [];
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      for (const v of p.variants) {
        if (v.price && v.is_enabled !== false) {
          // Printify prices are in cents (e.g. 2500 = $25.00)
          const dollars = v.price >= 500 ? v.price / 100 : v.price;
          variantPrices.push(ensure99Pricing(dollars));
        }
      }
    }

    const minRetailPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;

    // 3. Locate the corresponding product in Loka's database
    let dbProducts = await queryDb(
      `SELECT id, name, base_price, markup_percentage, images, thumbnail_url, status 
       FROM products 
       WHERE printify_product_id = $1 
       LIMIT 1`,
      [printifyProductId]
    );

    // Fallback: match by title if printify_product_id was not linked yet
    if (!dbProducts || dbProducts.length === 0) {
      dbProducts = await queryDb(
        `SELECT id, name, base_price, markup_percentage, images, thumbnail_url, status 
         FROM products 
         WHERE name = $1 AND (printify_product_id IS NULL OR printify_product_id = '') 
         ORDER BY id DESC LIMIT 1`,
        [title]
      );
    }

    if (!dbProducts || dbProducts.length === 0) {
      console.warn(`[ProductSync] No matching product found in Loka database for Printify ID ${printifyProductId} ("${title}")`);
      return {
        success: false,
        printifyProductId,
        action: 'not_found',
        error: `Product not found in Loka database for Printify ID ${printifyProductId}`,
      };
    }

    const dbProduct = dbProducts[0];
    const targetProductId = dbProduct.id;
    const updatedFields: string[] = [];

    // 4. Update the products table with latest title, description, images & price
    const finalPrice = minRetailPrice || dbProduct.base_price || 14.99;
    
    await queryDb(
      `UPDATE products 
       SET name = COALESCE(NULLIF($1, ''), name),
           description = COALESCE(NULLIF($2, ''), description),
           thumbnail_url = COALESCE(NULLIF($3, ''), thumbnail_url),
           images = CASE WHEN array_length($4::text[], 1) > 0 THEN $4::text[] ELSE images END,
           base_price = $5,
           printify_product_id = $6,
           status = 'active',
           updated_at = NOW()
       WHERE id = $7`,
      [
        title,
        description,
        thumbnail,
        images,
        finalPrice,
        printifyProductId,
        targetProductId,
      ]
    );

    updatedFields.push('name', 'description', 'images', 'thumbnail_url', 'base_price', 'status');

    // 5. Update variants if available
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      const dbVariants = await queryDb(
        `SELECT id, printify_variant_id, price FROM product_variants WHERE product_id = $1`,
        [targetProductId]
      );

      for (const pv of p.variants) {
        const vId = Number(pv.id);
        const vPrice = pv.price ? (pv.price >= 500 ? pv.price / 100 : pv.price) : null;
        const finalVPrice = vPrice ? ensure99Pricing(vPrice) : null;
        const isAvailable = pv.is_enabled !== false && pv.is_available !== false;

        const matchingDbV = dbVariants.find(
          (dbv: any) => Number(dbv.printify_variant_id) === vId || Number(dbv.id) === vId
        );

        if (matchingDbV) {
          if (finalVPrice) {
            await queryDb(
              `UPDATE product_variants 
               SET price = $1, is_available = $2, updated_at = NOW() 
               WHERE id = $3`,
              [finalVPrice, isAvailable, matchingDbV.id]
            );
          } else {
            await queryDb(
              `UPDATE product_variants 
               SET is_available = $1, updated_at = NOW() 
               WHERE id = $2`,
              [isAvailable, matchingDbV.id]
            );
          }
        }
      }
      updatedFields.push('variants');
    }

    console.log(`✅ [ProductSync] Successfully synced product ${targetProductId} ("${title}") from Printify!`);

    return {
      success: true,
      productId: targetProductId,
      printifyProductId,
      action: 'updated',
      updatedFields,
    };
  } catch (err: any) {
    console.error(`❌ [ProductSync] Error syncing product ${printifyProductId}:`, err);
    return {
      success: false,
      printifyProductId,
      action: 'error',
      error: err?.message || String(err),
    };
  }
}

/**
 * Handle product deletion on Printify by archiving it in Loka Media.
 */
export async function handleProductDeleted(printifyProductId: string): Promise<ProductSyncResult> {
  if (!printifyProductId) {
    return { success: false, printifyProductId: '', action: 'error', error: 'Missing printifyProductId' };
  }

  try {
    const res = await queryDb(
      `UPDATE products 
       SET status = 'archived', updated_at = NOW() 
       WHERE printify_product_id = $1 
       RETURNING id`,
      [printifyProductId]
    );

    if (res && res.length > 0) {
      console.log(`[ProductSync] Archived product ${res[0].id} because it was deleted on Printify`);
      return {
        success: true,
        productId: res[0].id,
        printifyProductId,
        action: 'archived',
      };
    }

    return {
      success: true,
      printifyProductId,
      action: 'not_found',
    };
  } catch (err: any) {
    console.error(`[ProductSync] Error archiving product ${printifyProductId}:`, err);
    return {
      success: false,
      printifyProductId,
      action: 'error',
      error: err?.message || String(err),
    };
  }
}

/**
 * Ensures all required Printify webhooks (product:updated, product:deleted, order webhooks)
 * are registered with Printify for the active shop.
 */
export async function ensurePrintifyWebhooksRegistered(webhookBaseUrl: string): Promise<{
  registered: string[];
  alreadyActive: string[];
  errors: string[];
}> {
  const cleanBase = webhookBaseUrl.replace(/\/$/, '');
  const receiveUrl = `${cleanBase}/api/printify/webhooks/receive`;

  const requiredTopics = [
    'shop:product:updated',
    'shop:product:deleted',
    'shop:order:created',
    'shop:order:updated',
  ];

  const registered: string[] = [];
  const alreadyActive: string[] = [];
  const errors: string[] = [];

  try {
    const existing = await printifyWebhooksAPI.getWebhooks();
    const existingMap = new Map<string, string>();
    if (Array.isArray(existing)) {
      existing.forEach((w) => {
        existingMap.set(w.topic, w.url);
      });
    }

    for (const topic of requiredTopics) {
      const activeUrl = existingMap.get(topic);
      if (activeUrl === receiveUrl) {
        alreadyActive.push(topic);
        continue;
      }

      try {
        await printifyWebhooksAPI.createWebhook(topic as any, receiveUrl);
        registered.push(topic);
        console.log(`[WebhookSetup] Successfully registered webhook "${topic}" → ${receiveUrl}`);
      } catch (err: any) {
        // Printify may return an error if already registered under an alias (e.g. product:updated)
        console.warn(`[WebhookSetup] Note for "${topic}":`, err?.message || err);
        errors.push(`${topic}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    console.error('[WebhookSetup] Failed to get or register webhooks:', err);
    errors.push(`General error: ${err?.message || String(err)}`);
  }

  return { registered, alreadyActive, errors };
}
