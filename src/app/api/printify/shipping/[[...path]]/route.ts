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
  {
    code: 'GB', name: 'United Kingdom', region: 'europe', states: [
      { code: 'ENG', name: 'England' }, { code: 'SCT', name: 'Scotland' },
      { code: 'WLS', name: 'Wales' }, { code: 'NIR', name: 'Northern Ireland' }
    ]
  },
  {
    code: 'DE', name: 'Germany', region: 'europe', states: [
      { code: 'BW', name: 'Baden-Württemberg' }, { code: 'BY', name: 'Bavaria' },
      { code: 'BE', name: 'Berlin' }, { code: 'BB', name: 'Brandenburg' },
      { code: 'HB', name: 'Bremen' }, { code: 'HH', name: 'Hamburg' },
      { code: 'HE', name: 'Hesse' }, { code: 'NI', name: 'Lower Saxony' },
      { code: 'MV', name: 'Mecklenburg-Vorpommern' }, { code: 'NW', name: 'North Rhine-Westphalia' },
      { code: 'RP', name: 'Rhineland-Palatinate' }, { code: 'SL', name: 'Saarland' },
      { code: 'SN', name: 'Saxony' }, { code: 'ST', name: 'Saxony-Anhalt' },
      { code: 'SH', name: 'Schleswig-Holstein' }, { code: 'TH', name: 'Thuringia' }
    ]
  },
  { code: 'FR', name: 'France', region: 'europe', states: [] },
  { code: 'IT', name: 'Italy', region: 'europe', states: [] },
  { code: 'ES', name: 'Spain', region: 'europe', states: [] },
  { code: 'NL', name: 'Netherlands', region: 'europe', states: [] },
  { code: 'BE', name: 'Belgium', region: 'europe', states: [] },
  { code: 'SE', name: 'Sweden', region: 'europe', states: [] },
  { code: 'NO', name: 'Norway', region: 'europe', states: [] },
  { code: 'DK', name: 'Denmark', region: 'europe', states: [] },
  { code: 'FI', name: 'Finland', region: 'europe', states: [] },
  {
    code: 'AT', name: 'Austria', region: 'europe', states: [
      { code: 'B', name: 'Burgenland' }, { code: 'K', name: 'Carinthia' },
      { code: 'NÖ', name: 'Lower Austria' }, { code: 'OÖ', name: 'Upper Austria' },
      { code: 'S', name: 'Salzburg' }, { code: 'St', name: 'Styria' },
      { code: 'T', name: 'Tyrol' }, { code: 'V', name: 'Vorarlberg' },
      { code: 'W', name: 'Vienna' }
    ]
  },
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
  {
    code: 'IN', name: 'India', region: 'asia', states: [
      { code: 'AP', name: 'Andhra Pradesh' }, { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' }, { code: 'BR', name: 'Bihar' },
      { code: 'CG', name: 'Chhattisgarh' }, { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' }, { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' }, { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' }, { code: 'KL', name: 'Kerala' },
      { code: 'MP', name: 'Madhya Pradesh' }, { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' }, { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' }, { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' }, { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' }, { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' }, { code: 'TG', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' }, { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UK', name: 'Uttarakhand' }, { code: 'WB', name: 'West Bengal' },
      { code: 'AN', name: 'Andaman and Nicobar Islands' },
      { code: 'CH', name: 'Chandigarh' },
      { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { code: 'DL', name: 'Delhi' }, { code: 'JK', name: 'Jammu and Kashmir' },
      { code: 'LA', name: 'Ladakh' }, { code: 'LD', name: 'Lakshadweep' },
      { code: 'PY', name: 'Puducherry' }
    ]
  },
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

async function calculateDynamicRates(lineItems: any[], countryCode: string): Promise<{ totalCents: number; itemized: any[] }> {
  const calculatedItems: any[] = [];

  for (const item of lineItems) {
    let blueprintId = item.blueprint_id || item.printify_blueprint_id;
    let printProviderId = item.print_provider_id || item.printify_print_provider_id;
    let printifyVariantId = item.printify_variant_id || item.variant_id;

    if (!blueprintId || !printProviderId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/products/${item.product_id}`);
        if (res.ok) {
          const productData = await res.json();
          blueprintId = productData.printify_blueprint_id
            || productData.blueprint_id
            || (typeof productData.printify_product_id === 'number' ? productData.printify_product_id : null)
            || (typeof productData.printify_product_id === 'string' && /^\d{1,5}$/.test(productData.printify_product_id) ? parseInt(productData.printify_product_id) : null)
            || blueprintId
            || 15;

          printProviderId = productData.printify_print_provider_id
            || productData.print_provider_id
            || printProviderId
            || 61;
          
          if (productData.variants && Array.isArray(productData.variants)) {
            const matchedVariant = productData.variants.find((v: any) => 
              v.id == item.variant_id || v.printify_variant_id == item.variant_id
            );
            if (matchedVariant) {
              printifyVariantId = matchedVariant.printify_variant_id || matchedVariant.id || item.variant_id;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch product for shipping rate calculation:', e);
      }
    }

    if (!blueprintId) blueprintId = 15;
    if (!printProviderId) printProviderId = 61;

    try {
      console.log(`[Shipping Rate] Fetching Printify profiles for blueprint: ${blueprintId}, provider: ${printProviderId}, country: ${countryCode}`);
      const shippingData = await printifyCatalogAPI.getShippingProfiles(Number(blueprintId), Number(printProviderId));
      const profiles = (shippingData as any).profiles || [];
      
      let matchingProfiles = profiles.filter((p: any) => 
        p.variant_ids && p.variant_ids.includes(Number(printifyVariantId))
      );
      
      if (matchingProfiles.length === 0) {
        matchingProfiles = profiles;
      }

      let matchedProfile = matchingProfiles.find((p: any) => 
        p.countries && p.countries.some((c: string) => c.toUpperCase() === countryCode.toUpperCase())
      );

      if (!matchedProfile) {
        matchedProfile = matchingProfiles.find((p: any) => 
          p.countries && p.countries.some((c: string) => c.toUpperCase() === 'REST_OF_THE_WORLD')
        );
      }

      if (!matchedProfile && matchingProfiles.length > 0) {
        matchedProfile = matchingProfiles[0];
      }

      if (matchedProfile) {
        const firstCost = typeof matchedProfile.first_item === 'object' ? matchedProfile.first_item.cost : Number(matchedProfile.first_item || 599);
        const addCost = typeof matchedProfile.additional_items === 'object' ? matchedProfile.additional_items.cost : Number(matchedProfile.additional_items || 200);

        calculatedItems.push({
          print_provider_id: Number(printProviderId),
          blueprint_id: Number(blueprintId),
          quantity: Number(item.quantity || 1),
          first_item: firstCost,
          additional_items: addCost,
          variant_id: Number(item.variant_id || printifyVariantId)
        });
      } else {
        calculatedItems.push({
          print_provider_id: Number(printProviderId),
          blueprint_id: Number(blueprintId),
          quantity: Number(item.quantity || 1),
          first_item: 599,
          additional_items: 200,
          variant_id: Number(item.variant_id || printifyVariantId)
        });
      }
    } catch (err: any) {
      console.error(`Failed to fetch shipping profile for blueprint ${blueprintId}, provider ${printProviderId}:`, err.message);
      calculatedItems.push({
        print_provider_id: Number(printProviderId) || 0,
        blueprint_id: Number(blueprintId) || 0,
        quantity: Number(item.quantity || 1),
        first_item: 599,
        additional_items: 200,
        variant_id: Number(item.variant_id || printifyVariantId)
      });
    }
  }

  if (calculatedItems.length === 0) {
    return { totalCents: 599, itemized: [] };
  }

  const providerGroups: Record<number, any[]> = {};
  calculatedItems.forEach(item => {
    const providerId = item.print_provider_id;
    if (!providerGroups[providerId]) {
      providerGroups[providerId] = [];
    }
    providerGroups[providerId].push(item);
  });

  let totalShippingCents = 0;

  for (const providerId of Object.keys(providerGroups)) {
    const itemsInGroup = providerGroups[Number(providerId)];
    
    let maxFirstItemIndex = 0;
    for (let i = 1; i < itemsInGroup.length; i++) {
      if (itemsInGroup[i].first_item > itemsInGroup[maxFirstItemIndex].first_item) {
        maxFirstItemIndex = i;
      }
    }

    totalShippingCents += itemsInGroup[maxFirstItemIndex].first_item;
    totalShippingCents += (itemsInGroup[maxFirstItemIndex].quantity - 1) * itemsInGroup[maxFirstItemIndex].additional_items;

    for (let i = 0; i < itemsInGroup.length; i++) {
      if (i !== maxFirstItemIndex) {
        totalShippingCents += itemsInGroup[i].quantity * itemsInGroup[i].additional_items;
      }
    }
  }

  return {
    totalCents: totalShippingCents,
    itemized: calculatedItems.map(x => ({
      variant_id: x.variant_id,
      blueprint_id: x.blueprint_id,
      print_provider_id: x.print_provider_id,
      first_item: x.first_item,
      additional_items: x.additional_items
    }))
  };
}

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
        const itemSource = item.source || 'printify';
        if (itemSource === 'printful') {
          continue; // Skip Printful items (handled separately)
        }

        line_items.push({
          product_id: item.product_id || item.id,
          variant_id: Number(item.printify_variant_id || item.variant_id || 0),
          quantity: Number(item.quantity || 1),
          blueprint_id: item.blueprint_id || item.printify_blueprint_id,
          print_provider_id: item.print_provider_id || item.printify_print_provider_id,
        });
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
        let isPrintify = true;
        
        // Before calculating shipping, fetch the actual product linked to the cart item.
        try {
          const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/products/${item.product_id}`);
          if (res.ok) {
            const productData = await res.json();
            if (productData.source === 'printful') {
              isPrintify = false;
            }
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

        if (isPrintify) {
          line_items.push({
            product_id: String(printifyProductId),
            variant_id: Number(printifyVariantId),
            quantity: Number(item.quantity || 1),
            blueprint_id: item.blueprint_id,
            print_provider_id: item.print_provider_id
          });
        }
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
    let rates: any;
    if (!printifyPayload.line_items || printifyPayload.line_items.length === 0) {
      console.log('Calculating dynamic shipping rates for fallback items list...');
      const fallbackItems = (body.items && body.items.length > 0) ? body.items : (body.line_items || []);
      const countryCode = printifyPayload.address_to?.country || body.recipient?.country_code || 'US';
      const resultObj = await calculateDynamicRates(fallbackItems, countryCode);
      rates = {
        standard: resultObj.totalCents,
        itemized: resultObj.itemized
      };
    } else {
      try {
        const countryCode = printifyPayload.address_to?.country || 'US';
        console.log(`Calculating dynamic shipping rates using blueprint profiles for country: ${countryCode}`);
        const resultObj = await calculateDynamicRates(printifyPayload.line_items, countryCode);
        rates = {
          standard: resultObj.totalCents,
          itemized: resultObj.itemized
        };
        console.log(`✅ Calculated dynamic shipping total: ${resultObj.totalCents} cents ($${(resultObj.totalCents/100).toFixed(2)})`);
      } catch (error: any) {
        console.error(
          '❌ DYNAMIC SHIPPING CALCULATION ERROR',
          error.message
        );
        rates = {
          standard: 599, // $5.99 fallback
          itemized: []
        };
      }
    }

    // Normalize to a format compatible with existing checkout code
    const allRates: any[] = [];

    if (rates) {
      // Standard Rate
      if (typeof rates.standard === 'number') {
        allRates.push({
          id: 'standard',
          name: 'Standard Shipping',
          carrier: 'Standard',
          rate: (rates.standard / 100).toFixed(2),
          minDeliveryDays: 3,
          maxDeliveryDays: 7,
          currency: 'USD',
          itemized: rates.itemized || []
        });
      } else if (Array.isArray(rates.standard)) {
        rates.standard.forEach((rate: any) => {
          allRates.push({
            id: rate.id || 'standard',
            name: rate.title || 'Standard Shipping',
            carrier: rate.carrier || 'Standard',
            rate: ((rate.rate || 0) / 100).toFixed(2),
            minDeliveryDays: rate.minDeliveryDays || 3,
            maxDeliveryDays: rate.maxDeliveryDays || 7,
            currency: rate.currency || 'USD',
          });
        });
      }

      // Express Rate
      if (typeof rates.express === 'number') {
        allRates.push({
          id: 'express',
          name: 'Express Shipping',
          carrier: 'Express',
          rate: (rates.express / 100).toFixed(2),
          minDeliveryDays: 2,
          maxDeliveryDays: 3,
          currency: 'USD',
        });
      } else if (Array.isArray(rates.express)) {
        rates.express.forEach((rate: any) => {
          allRates.push({
            id: rate.id || 'express',
            name: rate.title || 'Express Shipping',
            carrier: rate.carrier || 'Express',
            rate: ((rate.rate || 0) / 100).toFixed(2),
            minDeliveryDays: rate.minDeliveryDays || 2,
            maxDeliveryDays: rate.maxDeliveryDays || 3,
            currency: rate.currency || 'USD',
          });
        });
      }

      // Priority Rate
      if (typeof rates.priority === 'number') {
        allRates.push({
          id: 'priority',
          name: 'Priority Shipping',
          carrier: 'Priority',
          rate: (rates.priority / 100).toFixed(2),
          minDeliveryDays: 1,
          maxDeliveryDays: 2,
          currency: 'USD',
        });
      } else if (Array.isArray(rates.priority)) {
        rates.priority.forEach((rate: any) => {
          allRates.push({
            id: rate.id || 'priority',
            name: rate.title || 'Priority Shipping',
            carrier: rate.carrier || 'Priority',
            rate: ((rate.rate || 0) / 100).toFixed(2),
            minDeliveryDays: rate.minDeliveryDays || 1,
            maxDeliveryDays: rate.maxDeliveryDays || 2,
            currency: rate.currency || 'USD',
          });
        });
      }

      // Printify Express Rate
      if (typeof rates.printify_express === 'number') {
        allRates.push({
          id: 'printify_express',
          name: 'Printify Express Shipping',
          carrier: 'Printify Express',
          rate: (rates.printify_express / 100).toFixed(2),
          minDeliveryDays: 2,
          maxDeliveryDays: 5,
          currency: 'USD',
        });
      } else if (Array.isArray(rates.printify_express)) {
        rates.printify_express.forEach((rate: any) => {
          allRates.push({
            id: rate.id || 'printify_express',
            name: rate.title || 'Printify Express Shipping',
            carrier: rate.carrier || 'Printify Express',
            rate: ((rate.rate || 0) / 100).toFixed(2),
            minDeliveryDays: rate.minDeliveryDays || 2,
            maxDeliveryDays: rate.maxDeliveryDays || 5,
            currency: rate.currency || 'USD',
          });
        });
      }

      // Economy Rate
      if (typeof rates.economy === 'number') {
        allRates.push({
          id: 'economy',
          name: 'Economy Shipping',
          carrier: 'Economy',
          rate: (rates.economy / 100).toFixed(2),
          minDeliveryDays: 5,
          maxDeliveryDays: 10,
          currency: 'USD',
        });
      } else if (Array.isArray(rates.economy)) {
        rates.economy.forEach((rate: any) => {
          allRates.push({
            id: rate.id || 'economy',
            name: rate.title || 'Economy Shipping',
            carrier: rate.carrier || 'Economy',
            rate: ((rate.rate || 0) / 100).toFixed(2),
            minDeliveryDays: rate.minDeliveryDays || 5,
            maxDeliveryDays: rate.maxDeliveryDays || 10,
            currency: rate.currency || 'USD',
          });
        });
      }
    }

    return NextResponse.json({ success: true, result: allRates });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Shipping calculation failed';
    console.error('[Printify Shipping POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
