import fs from 'node:fs';
import path from 'node:path';

// 1. Update store-api.loka.media/src/queries/unifiedCheckoutQueries.js
const queriesPath = path.resolve('../store-api.loka.media/src/queries/unifiedCheckoutQueries.js');
let queriesContent = fs.readFileSync(queriesPath, 'utf8').replace(/\r\n/g, '\n');

const oldQueryBlock = `const enrichCartItemsWithVariantIds = async (productIds, variantIds, client = pool) => {
    const query = \`
        SELECT
            p.id as product_id,
            p.created_by,
            p.source as product_source,
            p.printify_product_id,
            p.printify_blueprint_id,
            p.printify_print_provider_id,
            pv.id as variant_id,
            pv.printify_variant_id,
            pv.shopify_variant_id
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id = ANY($1) AND pv.id = ANY($2)
    \`;
    const result = await client.query(query, [productIds, variantIds]);
    return result.rows;
};`;

const newQueryBlock = `const enrichCartItemsWithVariantIds = async (productIds, variantIds, client = pool) => {
    const query = \`
        SELECT
            p.id as product_id,
            p.name as product_name,
            p.created_by,
            p.source as product_source,
            p.printify_product_id,
            p.printify_blueprint_id,
            p.printify_print_provider_id,
            pv.id as variant_id,
            pv.price as variant_price,
            pv.title as variant_title,
            pv.printify_variant_id,
            pv.shopify_variant_id
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id = ANY($1) AND pv.id = ANY($2)
    \`;
    const result = await client.query(query, [productIds, variantIds]);
    return result.rows;
};`;

if (queriesContent.includes(oldQueryBlock)) {
    queriesContent = queriesContent.split(oldQueryBlock).join(newQueryBlock);
    fs.writeFileSync(queriesPath, queriesContent, 'utf8');
    console.log('Updated unifiedCheckoutQueries.js with variant_price and variant_title');
} else {
    console.log('unifiedCheckoutQueries.js already contains or could not find oldQueryBlock');
}

// 2. Update store-api.loka.media/src/services/unifiedCheckoutService.js
const servicePath = path.resolve('../store-api.loka.media/src/services/unifiedCheckoutService.js');
let serviceContent = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

const oldEnrichBlock = `// Enrich cart items with database information
const enrichCartItems = async (cartItems) => {
    const productIds = cartItems.map(item => parseInt(item.product_id));
    const variantIds = cartItems.map(item => parseInt(item.variant_id));

    const enrichmentData = await unifiedCheckoutQueries.enrichCartItemsWithVariantIds(productIds, variantIds);

    const enrichmentMap = new Map(
        enrichmentData.map(r => [
            \`\${r.product_id}-\${r.variant_id}\`,
            {
                creator_id: r.created_by,
                printify_variant_id: r.printify_variant_id,
                printify_product_id: r.printify_product_id,
                printify_blueprint_id: r.printify_blueprint_id,
                printify_print_provider_id: r.printify_print_provider_id,
                shopify_variant_id: r.shopify_variant_id,
                product_source: r.product_source
            }
        ])
    );

    return cartItems.map(item => {
        const key = \`\${item.product_id}-\${item.variant_id}\`;
        const enrichment = enrichmentMap.get(key) || {};

        return {
            ...item,
            product_id: parseInt(item.product_id),
            variant_id: parseInt(item.variant_id),
            printify_variant_id: enrichment.printify_variant_id || null,
            printify_product_id: enrichment.printify_product_id || null,
            printify_blueprint_id: enrichment.printify_blueprint_id || null,
            printify_print_provider_id: enrichment.printify_print_provider_id || null,
            shopify_variant_id: enrichment.shopify_variant_id || null,
            source: enrichment.product_source || item.source || 'printify',
            creator_id: enrichment.creator_id || null
        };
    });
};`;

const newEnrichBlock = `// Enrich cart items with database information and validate pricing against ground truth (C3/M4)
const enrichCartItems = async (cartItems, options = {}) => {
    const { rejectOnPriceConflict = true } = options;
    const productIds = cartItems.map(item => parseInt(item.product_id)).filter(id => !isNaN(id));
    const variantIds = cartItems.map(item => parseInt(item.variant_id)).filter(id => !isNaN(id));

    const enrichmentData = await unifiedCheckoutQueries.enrichCartItemsWithVariantIds(productIds, variantIds);

    const enrichmentMap = new Map(
        enrichmentData.map(r => [
            \`\${r.product_id}-\${r.variant_id}\`,
            {
                creator_id: r.created_by,
                printify_variant_id: r.printify_variant_id,
                printify_product_id: r.printify_product_id,
                printify_blueprint_id: r.printify_blueprint_id,
                printify_print_provider_id: r.printify_print_provider_id,
                shopify_variant_id: r.shopify_variant_id,
                product_source: r.product_source,
                variant_price: r.variant_price !== undefined && r.variant_price !== null ? parseFloat(r.variant_price) : null,
                variant_title: r.variant_title || null,
                product_name: r.product_name || null
            }
        ])
    );

    const conflicts = [];

    const enrichedItems = cartItems.map(item => {
        const key = \`\${item.product_id}-\${item.variant_id}\`;
        const enrichment = enrichmentMap.get(key) || {};

        let acknowledgedPrice = null;
        if (item.price !== undefined && item.price !== null) {
            const rawPrice = typeof item.price === 'string' ? item.price.replace(/[$]/g, '').trim() : item.price;
            const parsed = parseFloat(rawPrice);
            if (!isNaN(parsed)) acknowledgedPrice = parsed;
        }

        const currentPrice = enrichment.variant_price !== null && !isNaN(enrichment.variant_price)
            ? enrichment.variant_price
            : acknowledgedPrice;

        // C3/M4: Detect price differences between client acknowledged price and server ground-truth DB price
        if (
            rejectOnPriceConflict &&
            acknowledgedPrice !== null &&
            currentPrice !== null &&
            Math.abs(acknowledgedPrice - currentPrice) > 0.009
        ) {
            conflicts.push({
                productId: parseInt(item.product_id),
                variantId: parseInt(item.variant_id),
                title: item.product_name || enrichment.product_name || enrichment.variant_title || \`Item #\${item.variant_id}\`,
                acknowledgedPrice: Math.round(acknowledgedPrice * 100) / 100,
                currentPrice: Math.round(currentPrice * 100) / 100
            });
        }

        const effectivePrice = currentPrice !== null && !isNaN(currentPrice) ? currentPrice : acknowledgedPrice;

        return {
            ...item,
            product_id: parseInt(item.product_id),
            variant_id: parseInt(item.variant_id),
            price: effectivePrice !== null ? effectivePrice.toFixed(2) : item.price,
            printify_variant_id: enrichment.printify_variant_id || null,
            printify_product_id: enrichment.printify_product_id || null,
            printify_blueprint_id: enrichment.printify_blueprint_id || null,
            printify_print_provider_id: enrichment.printify_print_provider_id || null,
            shopify_variant_id: enrichment.shopify_variant_id || null,
            source: enrichment.product_source || item.source || 'printify',
            creator_id: enrichment.creator_id || null
        };
    });

    if (rejectOnPriceConflict && conflicts.length > 0) {
        const conflictError = new Error('One or more item prices have changed. Please review the updated prices before proceeding.');
        conflictError.status = 409;
        conflictError.code = 'PRICE_CHANGED';
        conflictError.conflicts = conflicts;
        throw conflictError;
    }

    return enrichedItems;
};`;

if (serviceContent.includes(oldEnrichBlock)) {
    serviceContent = serviceContent.split(oldEnrichBlock).join(newEnrichBlock);
    console.log('Updated enrichCartItems in unifiedCheckoutService.js');
} else {
    console.error('Could not find oldEnrichBlock in unifiedCheckoutService.js');
}

// Update sessionToken handling in processCheckout
const oldSessionBlock = `    if (sessionToken) {
        const session = await unifiedCheckoutQueries.findGuestCheckoutSession(sessionToken);

        if (!session) {
            throw new Error('Invalid or expired checkout session');
        }

        orderData = {
            email: session.email,
            customerInfo: session.customer_info,
            shippingAddress: session.shipping_address,
            billingAddress: session.billing_address,
            cartItems: session.cart_items,
            totalAmount: parseFloat(session.total_amount)
        };
        if (loginCredentials) {
            userId = await handleCheckoutAuthentication(loginCredentials, orderData);
        }
    }`;

const newSessionBlock = `    if (sessionToken) {
        const session = await unifiedCheckoutQueries.findGuestCheckoutSession(sessionToken);

        if (!session) {
            throw new Error('Invalid or expired checkout session');
        }

        // Revalidate all cart item prices against current DB ground truth to catch changes between session creation and checkout confirmation
        const revalidatedCartItems = await enrichCartItems(session.cart_items);
        const subtotal = revalidatedCartItems.reduce((sum, item) =>
            sum + (parseFloat(item.price) * item.quantity), 0
        );
        const { shippingCost, taxAmount } = await calculateShippingAndTax(
            revalidatedCartItems,
            session.shipping_address,
            subtotal
        );
        const totalAmount = subtotal + shippingCost + taxAmount;

        orderData = {
            email: session.email,
            customerInfo: session.customer_info,
            shippingAddress: session.shipping_address,
            billingAddress: session.billing_address,
            cartItems: revalidatedCartItems,
            totalAmount,
            subtotal,
            shippingCost,
            taxAmount
        };
        if (loginCredentials) {
            userId = await handleCheckoutAuthentication(loginCredentials, orderData);
        }
    }`;

if (serviceContent.includes(oldSessionBlock)) {
    serviceContent = serviceContent.split(oldSessionBlock).join(newSessionBlock);
    console.log('Updated sessionToken revalidation in processCheckout');
} else {
    console.error('Could not find oldSessionBlock in unifiedCheckoutService.js');
}

fs.writeFileSync(servicePath, serviceContent, 'utf8');

// 3. Update store-api.loka.media/src/controllers/unifiedCheckoutController.js
const controllerPath = path.resolve('../store-api.loka.media/src/controllers/unifiedCheckoutController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8').replace(/\r\n/g, '\n');

const oldGuestCatch = `    } catch (error) {
        console.error('Error creating guest checkout:', error);
        res.status(500).json(new ErrorDTO('Failed to create guest checkout session'));
    }`;

const newGuestCatch = `    } catch (error) {
        if (error.status === 409 || error.code === 'PRICE_CHANGED') {
            return res.status(409).json({
                error: 'Price conflict',
                code: 'PRICE_CHANGED',
                message: error.message || 'One or more item prices have changed. Please review the updated prices before proceeding.',
                conflicts: error.conflicts || []
            });
        }
        console.error('Error creating guest checkout:', error);
        res.status(500).json(new ErrorDTO('Failed to create guest checkout session'));
    }`;

const oldProcessCatch = `    } catch (error) {
        res.status(500).json({
            error: 'Failed to process checkout',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }`;

const newProcessCatch = `    } catch (error) {
        if (error.status === 409 || error.code === 'PRICE_CHANGED') {
            return res.status(409).json({
                error: 'Price conflict',
                code: 'PRICE_CHANGED',
                message: error.message || 'One or more item prices have changed. Please review the updated prices before proceeding.',
                conflicts: error.conflicts || []
            });
        }
        res.status(500).json({
            error: 'Failed to process checkout',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }`;

if (controllerContent.includes(oldGuestCatch)) {
    controllerContent = controllerContent.split(oldGuestCatch).join(newGuestCatch);
    console.log('Updated createGuestCheckout catch in controller');
}

if (controllerContent.includes(oldProcessCatch)) {
    controllerContent = controllerContent.split(oldProcessCatch).join(newProcessCatch);
    console.log('Updated processUnifiedCheckout catch in controller');
}

fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log('All backend files updated for C3/M4 Option 1');
