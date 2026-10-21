import test from 'node:test';
import assert from 'node:assert/strict';

// Mock DB with variant prices
function createMockQueries(dbVariants) {
    return {
        enrichCartItemsWithVariantIds: async (productIds, variantIds) => {
            return variantIds.map(vid => {
                const found = dbVariants.find(v => v.variant_id === vid);
                if (!found) return null;
                return {
                    product_id: found.product_id,
                    product_name: found.product_name,
                    created_by: found.created_by || 10,
                    product_source: found.source || 'printify',
                    printify_product_id: 'pf_prod_1',
                    printify_blueprint_id: 100,
                    printify_print_provider_id: 200,
                    variant_id: found.variant_id,
                    variant_price: found.price,
                    variant_title: found.title,
                    shopify_variant_id: null
                };
            }).filter(Boolean);
        }
    };
}

// Emulate enrichCartItems logic from unifiedCheckoutService.js
async function enrichCartItemsWithMock(cartItems, mockQueries, options = {}) {
    const { rejectOnPriceConflict = true } = options;
    const productIds = cartItems.map(item => parseInt(item.product_id)).filter(id => !isNaN(id));
    const variantIds = cartItems.map(item => parseInt(item.variant_id)).filter(id => !isNaN(id));

    const enrichmentData = await mockQueries.enrichCartItemsWithVariantIds(productIds, variantIds);

    const enrichmentMap = new Map(
        enrichmentData.map(r => [
            `${r.product_id}-${r.variant_id}`,
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
        const key = `${item.product_id}-${item.variant_id}`;
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

        if (
            rejectOnPriceConflict &&
            acknowledgedPrice !== null &&
            currentPrice !== null &&
            Math.abs(acknowledgedPrice - currentPrice) > 0.009
        ) {
            conflicts.push({
                productId: parseInt(item.product_id),
                variantId: parseInt(item.variant_id),
                title: item.product_name || enrichment.product_name || enrichment.variant_title || `Item #${item.variant_id}`,
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
}

test('C3/M4: Unchanged prices allow checkout to proceed with trusted server prices', async () => {
    const dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', title: 'Black - L', price: 45.00 },
        { product_id: 2, variant_id: 201, product_name: 'Sticker Pack', title: 'Default', price: 12.00 }
    ];
    const mockQueries = createMockQueries(dbVariants);

    const clientCart = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', price: '45.00', quantity: 2 },
        { product_id: 2, variant_id: 201, product_name: 'Sticker Pack', price: '12.00', quantity: 1 }
    ];

    const enriched = await enrichCartItemsWithMock(clientCart, mockQueries);
    assert.equal(enriched.length, 2);
    assert.equal(enriched[0].price, '45.00');
    assert.equal(enriched[1].price, '12.00');

    // Subtotal derived from server prices
    const subtotal = enriched.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    assert.equal(subtotal, 102.00); // 45*2 + 12*1 = 102
});

test('C3/M4: Price increase throws 409 Conflict with structured old vs new price data', async () => {
    const dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', title: 'Black - L', price: 49.99 } // Price increased in DB
    ];
    const mockQueries = createMockQueries(dbVariants);

    const clientCart = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', price: '45.00', quantity: 1 } // Customer had $45.00
    ];

    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(clientCart, mockQueries);
        },
        (err) => {
            assert.equal(err.status, 409);
            assert.equal(err.code, 'PRICE_CHANGED');
            assert.equal(err.conflicts.length, 1);
            assert.equal(err.conflicts[0].variantId, 101);
            assert.equal(err.conflicts[0].acknowledgedPrice, 45.00);
            assert.equal(err.conflicts[0].currentPrice, 49.99);
            return true;
        }
    );
});

test('C3/M4: Price decrease throws 409 Conflict requiring customer acknowledgement', async () => {
    const dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', title: 'Black - L', price: 39.99 } // Price dropped in DB
    ];
    const mockQueries = createMockQueries(dbVariants);

    const clientCart = [
        { product_id: 1, variant_id: 101, product_name: 'Graphic Hoodie', price: '45.00', quantity: 1 }
    ];

    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(clientCart, mockQueries);
        },
        (err) => {
            assert.equal(err.status, 409);
            assert.equal(err.code, 'PRICE_CHANGED');
            assert.equal(err.conflicts[0].acknowledgedPrice, 45.00);
            assert.equal(err.conflicts[0].currentPrice, 39.99);
            return true;
        }
    );
});

test('C3/M4: Multiple changed items return all conflicting items without sensitive data', async () => {
    const dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'Item A', title: 'Size S', price: 25.00 }, // was 20.00
        { product_id: 2, variant_id: 201, product_name: 'Item B', title: 'Size M', price: 15.00 }, // unchanged
        { product_id: 3, variant_id: 301, product_name: 'Item C', title: 'Size L', price: 60.00 }  // was 50.00
    ];
    const mockQueries = createMockQueries(dbVariants);

    const clientCart = [
        { product_id: 1, variant_id: 101, product_name: 'Item A', price: '20.00', quantity: 1 },
        { product_id: 2, variant_id: 201, product_name: 'Item B', price: '15.00', quantity: 2 },
        { product_id: 3, variant_id: 301, product_name: 'Item C', price: '50.00', quantity: 1 }
    ];

    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(clientCart, mockQueries);
        },
        (err) => {
            assert.equal(err.status, 409);
            assert.equal(err.conflicts.length, 2);
            assert.equal(err.conflicts[0].variantId, 101);
            assert.equal(err.conflicts[1].variantId, 301);

            // Confirm no sensitive provider wholesale costs or secret keys leaked
            const jsonStr = JSON.stringify(err.conflicts);
            assert.equal(jsonStr.includes('baseCost'), false);
            assert.equal(jsonStr.includes('wholesaleCost'), false);
            assert.equal(jsonStr.includes('password'), false);
            return true;
        }
    );
});

test('C3/M4: Client price tampering ($0.01 spoof) is rejected with 409', async () => {
    const dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'Expensive Item', title: 'Gold', price: 150.00 }
    ];
    const mockQueries = createMockQueries(dbVariants);

    const tamperedCart = [
        { product_id: 1, variant_id: 101, product_name: 'Expensive Item', price: '0.01', quantity: 1 }
    ];

    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(tamperedCart, mockQueries);
        },
        (err) => {
            assert.equal(err.status, 409);
            assert.equal(err.conflicts[0].acknowledgedPrice, 0.01);
            assert.equal(err.conflicts[0].currentPrice, 150.00);
            return true;
        }
    );
});

test('C3/M4: Repeated checkout attempt after customer acknowledges new price succeeds', async () => {
    let dbVariants = [
        { product_id: 1, variant_id: 101, product_name: 'T-Shirt', title: 'L', price: 28.00 }
    ];
    let mockQueries = createMockQueries(dbVariants);

    // Attempt 1: Customer had $25.00 in cart
    const cartAttempt1 = [
        { product_id: 1, variant_id: 101, product_name: 'T-Shirt', price: '25.00', quantity: 1 }
    ];
    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(cartAttempt1, mockQueries);
        },
        { status: 409 }
    );

    // Customer accepts the 409 conflict: UI updates cart price to $28.00
    const cartAttempt2 = [
        { product_id: 1, variant_id: 101, product_name: 'T-Shirt', price: '28.00', quantity: 1 }
    ];

    // Attempt 2: Re-validation succeeds because acknowledged price matches DB ground truth
    const result = await enrichCartItemsWithMock(cartAttempt2, mockQueries);
    assert.equal(result.length, 1);
    assert.equal(result[0].price, '28.00');
});

test('C3/M4: Price changes again between acknowledgement and final payment re-triggers 409', async () => {
    let dbPrice = 28.00;
    const dynamicQueries = {
        enrichCartItemsWithVariantIds: async () => [{
            product_id: 1,
            product_name: 'T-Shirt',
            created_by: 10,
            product_source: 'printify',
            printify_product_id: 'pf_1',
            printify_blueprint_id: 100,
            printify_print_provider_id: 200,
            variant_id: 101,
            variant_price: dbPrice,
            variant_title: 'L',
            shopify_variant_id: null
        }]
    };

    // Step 1: Customer acknowledges $28.00
    const acknowledgedCart = [
        { product_id: 1, variant_id: 101, product_name: 'T-Shirt', price: '28.00', quantity: 1 }
    ];
    const initialSessionEnrich = await enrichCartItemsWithMock(acknowledgedCart, dynamicQueries);
    assert.equal(initialSessionEnrich[0].price, '28.00');

    // Step 2: While customer reviews or before final confirmation, creator changes DB price to $32.00
    dbPrice = 32.00;

    // Step 3: Server revalidates before creating order or confirming payment (Requirement 6)
    await assert.rejects(
        async () => {
            await enrichCartItemsWithMock(acknowledgedCart, dynamicQueries);
        },
        (err) => {
            assert.equal(err.status, 409);
            assert.equal(err.code, 'PRICE_CHANGED');
            assert.equal(err.conflicts[0].acknowledgedPrice, 28.00);
            assert.equal(err.conflicts[0].currentPrice, 32.00);
            return true;
        }
    );
});
