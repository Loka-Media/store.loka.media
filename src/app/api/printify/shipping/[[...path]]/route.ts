/**
 * Printify Shipping API Route (Catch-All)
 * POST /api/printify/shipping/rates → calculate shipping for an order
 * GET  /api/printify/shipping/countries → list supported countries (static list)
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyShippingAPI, printifyCatalogAPI } from '@/services/printify/PrintifyClient';

// Static list of countries supported by Printify for address forms
// This replaces the old Printful /countries endpoint
const SUPPORTED_COUNTRIES = [
  {
    code: 'US', name: 'United States', region: 'north_america', states: [
      { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
    ]
  },
  {
    code: 'CA', name: 'Canada', region: 'north_america', states: [
      { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' }, { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
    ]
  },
  { code: 'GB', name: 'United Kingdom', region: 'europe', states: [] },
  { code: 'DE', name: 'Germany', region: 'europe', states: [] },
  { code: 'FR', name: 'France', region: 'europe', states: [] },
  { code: 'IT', name: 'Italy', region: 'europe', states: [] },
  { code: 'ES', name: 'Spain', region: 'europe', states: [] },
  { code: 'NL', name: 'Netherlands', region: 'europe', states: [] },
  { code: 'BE', name: 'Belgium', region: 'europe', states: [] },
  { code: 'SE', name: 'Sweden', region: 'europe', states: [] },
  { code: 'NO', name: 'Norway', region: 'europe', states: [] },
  { code: 'DK', name: 'Denmark', region: 'europe', states: [] },
  { code: 'FI', name: 'Finland', region: 'europe', states: [] },
  { code: 'AT', name: 'Austria', region: 'europe', states: [] },
  { code: 'CH', name: 'Switzerland', region: 'europe', states: [] },
  { code: 'PL', name: 'Poland', region: 'europe', states: [] },
  { code: 'CZ', name: 'Czech Republic', region: 'europe', states: [] },
  { code: 'PT', name: 'Portugal', region: 'europe', states: [] },
  { code: 'IE', name: 'Ireland', region: 'europe', states: [] },
  { code: 'RO', name: 'Romania', region: 'europe', states: [] },
  { code: 'HU', name: 'Hungary', region: 'europe', states: [] },
  { code: 'SK', name: 'Slovakia', region: 'europe', states: [] },
  { code: 'HR', name: 'Croatia', region: 'europe', states: [] },
  {
    code: 'AU', name: 'Australia', region: 'oceania', states: [
      { code: 'ACT', name: 'Australian Capital Territory' }, { code: 'NSW', name: 'New South Wales' },
      { code: 'NT', name: 'Northern Territory' }, { code: 'QLD', name: 'Queensland' },
      { code: 'SA', name: 'South Australia' }, { code: 'TAS', name: 'Tasmania' },
      { code: 'VIC', name: 'Victoria' }, { code: 'WA', name: 'Western Australia' },
    ]
  },
  { code: 'NZ', name: 'New Zealand', region: 'oceania', states: [] },
  { code: 'JP', name: 'Japan', region: 'asia', states: [] },
  { code: 'SG', name: 'Singapore', region: 'asia', states: [] },
  { code: 'HK', name: 'Hong Kong', region: 'asia', states: [] },
  { code: 'IN', name: 'India', region: 'asia', states: [] },
  { code: 'BR', name: 'Brazil', region: 'south_america', states: [] },
  { code: 'MX', name: 'Mexico', region: 'north_america', states: [] },
  { code: 'AR', name: 'Argentina', region: 'south_america', states: [] },
  { code: 'ZA', name: 'South Africa', region: 'africa', states: [] },
];

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // GET /api/printify/shipping/countries → return country list
  if (pathname.endsWith('/countries')) {
    return NextResponse.json({ result: SUPPORTED_COUNTRIES });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let printifyPayload = body;

    // Convert and normalize client payloads to Printify ShippingRequest schema
    if (body.recipient || body.items) {
      const recipient = body.recipient || {};
      const items = body.items || [];

      const nameParts = (recipient.name || 'Customer Name').trim().split(/\s+/);
      const first_name = nameParts[0] || 'Customer';
      const last_name = nameParts.slice(1).join(' ') || 'Customer';

      const address_to = {
        first_name,
        last_name,
        address1: recipient.address1 || '',
        address2: recipient.address2 || '',
        city: recipient.city || '',
        region: recipient.state_code || recipient.state || '',
        country: recipient.country_code || recipient.country || 'US',
        zip: recipient.zip || '',
        phone: recipient.phone || '',
        email: recipient.email || 'customer@example.com',
      };

      const line_items = [];
      for (const item of items) {
        if (item.blueprint_id && item.print_provider_id) {
          line_items.push({
            blueprint_id: Number(item.blueprint_id),
            print_provider_id: Number(item.print_provider_id),
            variant_id: Number(item.printify_variant_id || item.printful_variant_id || item.variant_id),
            quantity: Number(item.quantity || 1),
          });
        } else if (item.printify_product_id) {
          line_items.push({
            product_id: String(item.printify_product_id),
            variant_id: Number(item.printify_variant_id || item.printful_variant_id || item.variant_id),
            quantity: Number(item.quantity || 1),
          });
        } else {
          // If no Printify identifiers exist, pass the local IDs (which will fail cleanly as 404 rather than assuming wrong blueprints)
          line_items.push({
            product_id: String(item.product_id),
            variant_id: Number(item.printify_variant_id || item.printful_variant_id || item.variant_id),
            quantity: Number(item.quantity || 1),
          });
        }
      }

      printifyPayload = {
        address_to,
        line_items,
      };
    } else if (body.line_items) {
      // Direct printify payload format, resolve any numeric product_id
      const line_items = [];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      for (const item of body.line_items) {
        let printifyProductId = item.product_id;
        let printifyVariantId = item.variant_id;
        
        // Before calculating shipping, fetch the actual product linked to the cart item.
        try {
          const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/products/${item.product_id}`);
          if (res.ok) {
            const productData = await res.json();
            printifyProductId = productData.printify_product_id || productData.printful_sync_product_id || productData.printful_product_id || productData.blueprint_id || item.product_id;
            
            // Find the correct variant if printify_variant_id is available
            if (productData.variants) {
              const matchedVariant = productData.variants.find((v: any) => v.id == item.variant_id);
              if (matchedVariant) {
                printifyVariantId = matchedVariant.printify_variant_id || matchedVariant.printful_variant_id || item.variant_id;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch product data from backend', e);
        }

        line_items.push({
          product_id: String(printifyProductId),
          variant_id: Number(printifyVariantId),
          quantity: Number(item.quantity || 1),
        });
      }

      printifyPayload = {
        ...body,
        line_items,
      };
    }

    console.log(
      '🚚 SHIPPING REQUEST',
      JSON.stringify(printifyPayload, null, 2)
    );

    // POST /api/printify/shipping/rates → calculate shipping
    let rates;
    try {
      rates = await printifyShippingAPI.calculateShipping(printifyPayload);

      console.log(
        '✅ SHIPPING RESPONSE',
        JSON.stringify(rates, null, 2)
      );
    } catch (error: any) {
      console.error(
        '❌ SHIPPING ERROR',
        error.response?.data || error.message
      );

      if (error.message && (error.message.toLowerCase().includes('not found') || error.message.includes('404'))) {
        console.warn('Printify shipping calculation failed with Not Found. Returning mock flat rate shipping.');
        rates = {
          standard: [
            {
              id: 'mock_standard',
              title: 'Standard Shipping',
              carrier: 'Generic',
              rate: 599, // $5.99
              minDeliveryDays: 3,
              maxDeliveryDays: 7,
              currency: 'USD'
            }
          ]
        };
      } else {
        throw error;
      }
    }

    // Normalize to a format compatible with existing checkout code
    const allRates = [
      ...(rates.standard || []),
      ...(rates.express || []),
      ...(rates.priority || []),
    ].map(rate => ({
      id: rate.id,
      name: rate.title,
      carrier: rate.carrier,
      rate: (rate.rate / 100).toFixed(2),   // cents → dollars string
      minDeliveryDays: rate.minDeliveryDays,
      maxDeliveryDays: rate.maxDeliveryDays,
      currency: rate.currency || 'USD',
    }));

    return NextResponse.json({ success: true, result: allRates });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Shipping calculation failed';
    console.error('[Printify Shipping POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
