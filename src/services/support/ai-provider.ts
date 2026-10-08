/**
 * Loka Media Support - AI Provider & Multi-Model Orchestration Engine
 * 
 * Supports Groq LPU (Ultra-Fast) & Google Gemini (High Intelligence).
 * Features intelligent auto-failover:
 * - If Groq is primary and throttles/fails -> automatically fails over to Gemini.
 * - If Gemini is primary and throttles/fails -> automatically fails over to Groq.
 * - If both external AI providers are unavailable -> zero-cost deterministic grounded fallback.
 * Strictly enforces supplier privacy (NEVER mentions Printify).
 */

import { KnowledgeItem, CANNED_RESPONSES } from '@/config/support-knowledge';
import { sanitizeOutput } from './knowledge-retriever';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  reply: string;
  provider: string;
  model: string;
  usedFallback: boolean;
  requiresEscalation: boolean;
}

// Master Grounding System Prompt for Loka Media Support AI
const SYSTEM_PROMPT_TEMPLATE = `You are the official, highly intelligent customer support and platform assistant for Loka Media (store.loka.media).
You help both customers (fans/shoppers) and creators with 100% accurate, up-to-date, grounded information.

=== MASTER LOKA MEDIA KNOWLEDGE & FLOW ===
1. PLATFORM OVERVIEW & LEADERSHIP:
- Platform: Loka Media (store.loka.media) is a premium creator commerce marketplace and on-demand merchandise ecosystem.
- Founder & CEO: Perry Mangat.
- Co-Founder: Rupan Bal.
- Mission: Empower independent creators, influencers, and artists worldwide to launch custom branded product lines with zero upfront inventory risk.
- Community & Scale: Over 10,000+ active creators, over $2 Million+ paid out to creators, shipping to 180+ countries worldwide.
- Official Contact Channels:
  * Customer Support: support@loka.media (Mon–Fri, 9:00 AM – 6:00 PM EST)
  * Creator Onboarding & Partnerships: creators@loka.media
  * Corporate & Executive Inquiries: hello@loka.media

2. CUSTOMER PURCHASING JOURNEY ("Customers kaise products buy karein?"):
- Step 1: Browse designs at store.loka.media/products or on any individual creator's shop storefront.
- Step 2: Open product page, view real-garment photos and interactive 360° 3D mockups.
- Step 3: Check detailed size charts (inches & cm) and select desired color and size (XS–5XL).
- Step 4: Click "Add to Cart" and proceed to the Unified Checkout (/checkout-unified).
- Step 5: Enter shipping address and choose shipping speed:
  * Standard Shipping: US/Domestic 3–7 business days, UK/EU 5–10 business days, International 7–15 business days.
  * Express Shipping: Expedited courier delivery where available.
- Step 6: Pay securely via Credit/Debit Cards (Stripe), PayPal, Apple Pay, Google Pay, Klarna, or AfterPay.
- Step 7: Receive instant email confirmation with order number, followed by live courier tracking link once dispatched.

3. CREATOR CUSTOMIZATION & SELLING JOURNEY ("Hum product kaise customize karein? / Sell on Loka"):
- Step 1: Apply or sign in at store.loka.media/creators.
- Step 2: Access creator dashboard and open "Canvas Studio" (Loka's 3D web-based design workspace).
- Step 3: Choose blank premium product from catalog (Heavyweight T-shirts, Premium Fleece Hoodies, Crewnecks, Ceramic Coffee Mugs, Hard-shell Polycarbonate Suitcases, Wall art posters, Phone cases, Stickers).
- Step 4: Upload high-resolution artwork (PNG or SVG with transparent background, recommended 300 DPI), add custom text/typography, and layer clipart.
- Step 5: Inspect real-time 360° interactive 3D mockup spinner across all angles (front, back, sleeves) and all garment colorways.
- Step 6: Set retail price markup: base manufacturing cost is fixed; creators set their selling price and keep up to 90% of their custom profit markup!
- Step 7: Click "Publish"—product goes live immediately on creator's storefront with zero inventory cost.
- Step 8: When customers purchase, Loka automatically prints, packs, and delivers worldwide. Creators receive automated payouts via Stripe/PayPal/Bank.

4. PRODUCTION & DELIVERY TIMELINES:
- Made-to-Order Production: Each item is printed and quality-checked individually in 2 to 5 business days.
- Shipping Transit Times:
  * United States & Canada: 3–7 business days
  * UK & Europe: 5–10 business days
  * International (180+ countries): 7–15 business days
- Order Tracking: Live tracking link is automatically emailed upon dispatch and viewable anytime in user profile (store.loka.media/profile) or via "Track My Orders" in this chat.

5. POLICIES, RETURNS, REFUNDS & DEFECTS:
- Sizing / Buyer's Remorse Policy: Because every item is individually custom manufactured on-demand per customer order, we do not accept returns or exchanges for sizing errors or buyer's remorse. Customers must check product size charts before ordering.
- Damaged / Defective / Misprinted Items: 100% Covered! Free replacement or full refund within 30 days of delivery. Customer should email support@loka.media with their order number and clear photos of the issue.
- Order Changes / Cancellations: Permitted only within 2 hours of placing the order before production starts.

6. PRODUCT SPECIFICATIONS:
- Apparel: Unisex Heavyweight T-shirts (100% ring-spun cotton, XS–5XL, pre-shrunk), Premium Fleece Hoodies (double-stitched, pouch pocket).
- Drinkware: 11oz & 15oz Ceramic Mugs (dishwasher & microwave safe), Stainless Steel tumblers.
- Luggage: Polycarbonate hard-shell suitcases with TSA-approved locks, 360° dual spinner wheels, telescoping handle.
- Home & Tech: Museum-grade matte posters, fade-resistant canvases, shockproof dual-layer phone cases.

7. LANGUAGE & COMMUNICATION RULES:
- STRICTLY ENGLISH ONLY: Always respond in clean, fluent, professional, and friendly English at all times.
- Even if the user makes typos, writes slang, or uses non-English words, ALWAYS interpret their intent and respond exclusively in 100% proper English.
- NEVER respond in Hinglish, Hindi, or mixed languages under any circumstances.
- NO HASH HEADINGS: Never use markdown '#' or '###' heading hashes. Use bold text (e.g., **Heading**) or bullet points (-) instead.
- Keep tone polished, helpful, concise, and friendly.

8. STRICT PRIVACY & SECURITY GUARDRAILS:
- SUPPLIER PRIVACY: NEVER mention "Printify" or any internal supplier names under any circumstance. If asked who prints or manufactures products, answer: "Our products are custom-manufactured and fulfilled through our vetted global production and printing facilities."
- WHOLESALE / INTERNAL COSTS: Never disclose internal manufacturing costs, wholesale rate sheets, or platform operational fees.
- SECRETS & CREDENTIALS: Never reveal API keys, database credentials, internal server endpoints, or admin routes.
- ZERO HALLUCINATION & STRICT WEBSITE GROUNDING:
  * You must answer customer questions using ONLY information available on our website (store.loka.media) and in the provided knowledge base.
  * If the answer to the user's question is on our website or knowledge base, provide a thorough, accurate, and friendly response.
  * If the user asks ANY question about external topics, general knowledge, other companies, weather, or anything NOT available on our website:
    DO NOT GUESS OR INVENT FACTS.
    Politely respond: "At the moment, I don't have this information on our website. Please reach out to our support team at support@loka.media who will be happy to assist you!"`;

/**
 * Builds the context payload to inject into LLM
 */
function buildContextString(knowledgeItems: KnowledgeItem[]): string {
  if (!knowledgeItems || knowledgeItems.length === 0) {
    return 'No specific knowledge articles found for this query.';
  }

  return knowledgeItems
    .map((item, idx) => `[Source ${idx + 1}: ${item.title}]\n${item.content}`)
    .join('\n\n');
}

/**
 * Deterministic grounding fallback when external LLMs are unavailable.
 * Zero-latency, zero-cost, guaranteed 100% accurate to knowledge base.
 */
function generateDeterministicReply(query: string, items: KnowledgeItem[]): AIResponse {
  if (!items || items.length === 0) {
    return {
      reply: CANNED_RESPONSES.UNKNOWN_FALLBACK,
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: true
    };
  }

  const primary = items[0];
  const qLower = query.toLowerCase();

  // Explicit out of scope / unrelated queries
  if (
    qLower.includes('weather') ||
    qLower.includes('stock price') ||
    qLower.includes('bitcoin') ||
    qLower.includes('crypto') ||
    qLower.includes('recipe') ||
    qLower.includes('movie') ||
    qLower.includes('president')
  ) {
    return {
      reply: CANNED_RESPONSES.UNKNOWN_FALLBACK,
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: true
    };
  }

  // Founder / Leadership queries
  if (
    qLower.includes('founder') ||
    qLower.includes('perry') ||
    qLower.includes('mangat') ||
    qLower.includes('rupan') ||
    qLower.includes('ceo') ||
    qLower.includes('who started') ||
    qLower.includes('who created loka') ||
    qLower.includes('owner') ||
    qLower.includes('leadership')
  ) {
    return {
      reply: "The founder of Loka Media is **Perry Mangat** (Founder & CEO). The platform was established by Perry Mangat alongside co-founder Rupan Bal to empower creators and artists worldwide. For corporate inquiries, partnerships, or executive contact, you can reach the team directly at **hello@loka.media**.",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // What is Loka / About
  if (
    qLower.includes('what is loka') ||
    qLower.includes('who is loka') ||
    qLower.includes('tell me about loka') ||
    qLower.includes('about loka')
  ) {
    return {
      reply: "Loka Media (store.loka.media) is a premium creator marketplace that empowers artists, influencers, and creators worldwide to launch custom merchandise lines with zero upfront costs, automated production, and global shipping.",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // How to customize products / Canvas Studio / Design
  if (
    qLower.includes('customiz') ||
    qLower.includes('customis') ||
    qLower.includes('cusotm') ||
    qLower.includes('design') ||
    qLower.includes('canvas') ||
    qLower.includes('artwork')
  ) {
    return {
      reply: "Customizing products on Loka Media is simple with our built-in **Canvas Studio**:\n1. Apply or sign in as a creator at **store.loka.media/creators**.\n2. Pick a blank product from our catalog (Unisex T-Shirts, Hoodies, Mugs, Suitcases, etc.).\n3. Open Canvas Studio to upload your high-res artwork, add custom typography, and layer clipart.\n4. Use the **360° interactive mockup spinner** to inspect front, back, and sleeve views on real garment colors.\n5. Set your retail price and profit margin (you keep up to 90% profit), then publish to your shop with zero upfront cost!",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // How customers buy products / Shopping flow
  if (
    qLower.includes('buy') ||
    qLower.includes('purchase') ||
    qLower.includes('how to order') ||
    qLower.includes('how customers order') ||
    qLower.includes('shopping guide')
  ) {
    return {
      reply: "Buying products on Loka Media is fast and secure:\n1. Discover designs at **store.loka.media/products** or on any creator's storefront.\n2. Choose your preferred color and size on the product page (check the 360° preview and size chart).\n3. Click **Add to Cart** and proceed to **/checkout-unified**.\n4. Enter your delivery address and choose your shipping speed.\n5. Pay securely via Card (Stripe), PayPal, Apple Pay, Google Pay, or Klarna.\nYou will receive instant email confirmation and automated tracking once shipped!",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // Returns / Sizing
  if (primary.category === 'returns' || qLower.includes('return') || qLower.includes('refund') || qLower.includes('size') || qLower.includes('sizing')) {
    if (qLower.includes('damage') || qLower.includes('defect') || qLower.includes('broken') || qLower.includes('tear') || qLower.includes('misprint')) {
      return {
        reply: "We offer a 100% Quality Guarantee within 30 days! If your item arrived damaged or with a print defect, please email **support@loka.media** with your order number and photos for an immediate free replacement or full refund.",
        provider: 'loka-knowledge-engine',
        model: 'intelligent-local',
        usedFallback: true,
        requiresEscalation: true
      };
    }
    return {
      reply: "Because every item on Loka Media is custom made-to-order especially for each customer, we do not accept returns or exchanges for sizing errors or buyer's remorse. Please check our detailed size charts on each product page before ordering. If your item arrived defective or damaged, we replace or refund it 100%!",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // Shipping
  if (primary.category === 'shipping' || qLower.includes('ship') || qLower.includes('deliver') || qLower.includes('tracking') || qLower.includes('how long')) {
    return {
      reply: "Production takes 2 to 5 business days as each product is custom printed on demand. Shipping transit times are:\n- **US & Canada**: 3–7 business days\n- **UK & Europe**: 5–10 business days\n- **International (180+ countries)**: 7–15 business days\nYou will receive an automated tracking link as soon as your package ships!",
      provider: 'loka-knowledge-engine',
      model: 'intelligent-local',
      usedFallback: true,
      requiresEscalation: false
    };
  }

  // General grounded synthesis from top knowledge item
  const formattedContent = primary.content
    .split('\n')
    .filter(Boolean)
    .slice(0, 3)
    .join(' ');

  return {
    reply: `${formattedContent} For additional help or specific questions, feel free to email our team at support@loka.media!`,
    provider: 'loka-knowledge-engine',
    model: 'intelligent-local',
    usedFallback: true,
    requiresEscalation: false
  };
}

/**
 * Executes a chat query using Groq LPU (Ultra-Fast Inference).
 */
async function callGroqEngine(
  systemMessage: string,
  userMessage: string,
  recentHistory: ChatMessage[],
  apiKey: string,
  modelName: string
): Promise<{ text: string; model: string } | null> {
  const modelsToTry = [
    modelName || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
  ].filter(Boolean);

  // De-duplicate model candidates
  const uniqueModels = Array.from(new Set(modelsToTry));

  for (const currentModel of uniqueModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: 'system', content: systemMessage },
            ...recentHistory,
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content?.trim();
        if (replyText && replyText.length > 0) {
          return { text: replyText, model: currentModel };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[GroqEngine] Model ${currentModel} error ${res.status}:`, errData?.error?.message || res.statusText);
      }
    } catch (err: any) {
      console.warn(`[GroqEngine] Network/Timeout error on model ${currentModel}:`, err?.message || err);
    }
  }

  return null;
}

/**
 * Executes a chat query using Google Gemini API.
 */
async function callGeminiEngine(
  systemMessage: string,
  userMessage: string,
  recentHistory: ChatMessage[],
  apiKey: string,
  modelName: string
): Promise<{ text: string; model: string } | null> {
  const modelsToTry = [
    modelName || process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash'
  ].filter(Boolean);

  const uniqueModels = Array.from(new Set(modelsToTry));

  // Build Gemini multi-turn conversation format
  const geminiContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of recentHistory) {
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  geminiContents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  for (const currentModel of uniqueModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemMessage }]
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (replyText && replyText.length > 0) {
          return { text: replyText, model: currentModel };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[GeminiEngine] Model ${currentModel} error ${res.status}:`, errData?.error?.message || res.statusText);
      }
    } catch (err: any) {
      console.warn(`[GeminiEngine] Network/Timeout error on model ${currentModel}:`, err?.message || err);
    }
  }

  return null;
}

/**
 * Free Cloud Fallback Engine (for zero-config resilience).
 */
async function callFreeAIEngine(
  systemMessage: string,
  userMessage: string,
  recentHistory: ChatMessage[]
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const messages = [
      { role: 'system', content: systemMessage },
      ...recentHistory,
      { role: 'user', content: userMessage }
    ];

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: 42
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const replyText = await res.text();
    return replyText?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Main AI Generation Router supporting GROQ and GEMINI with seamless auto-failover.
 */
export async function generateSupportAnswer(
  userMessage: string,
  history: ChatMessage[],
  knowledgeItems: KnowledgeItem[]
): Promise<AIResponse> {
  const groqApiKey = process.env.GROQ_API_KEY || (process.env.AI_PROVIDER === 'groq' ? process.env.AI_API_KEY : '');
  const geminiApiKey = process.env.GEMINI_API_KEY || (process.env.AI_PROVIDER === 'gemini' ? process.env.AI_API_KEY : '');

  const configuredProvider = (process.env.AI_PROVIDER || (groqApiKey ? 'groq' : (geminiApiKey ? 'gemini' : 'free'))).toLowerCase();
  const groqModel = process.env.GROQ_MODEL || (configuredProvider === 'groq' && process.env.AI_MODEL ? process.env.AI_MODEL : 'openai/gpt-oss-120b');
  const geminiModel = process.env.GEMINI_MODEL || (configuredProvider === 'gemini' && process.env.AI_MODEL?.startsWith('gemini') ? process.env.AI_MODEL : 'gemini-3.5-flash');

  const contextText = buildContextString(knowledgeItems);
  const systemMessage = `${SYSTEM_PROMPT_TEMPLATE}\n\n=== RELEVANT KNOWLEDGE BASE ===\n${contextText}`;

  // Limit conversation history to last 4 messages to save tokens and prevent drift
  const recentHistory = history
    .slice(-4)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Helper to wrap and sanitize AI output
  const formatSuccessResponse = (rawText: string, providerName: string, modelName: string): AIResponse => {
    const sanitized = sanitizeOutput(rawText.trim());
    const requiresEscalation =
      sanitized.toLowerCase().includes('support@loka.media') ||
      sanitized.toLowerCase().includes('contact our support team');

    return {
      reply: sanitized,
      provider: providerName,
      model: modelName,
      usedFallback: false,
      requiresEscalation
    };
  };

  // ── STRATEGY 1: IF PREFERRED PROVIDER IS GROQ ──────────────────────────────
  if (configuredProvider === 'groq' || (!geminiApiKey && groqApiKey)) {
    // 1. Try Groq
    if (groqApiKey) {
      const groqResult = await callGroqEngine(systemMessage, userMessage, recentHistory, groqApiKey, groqModel);
      if (groqResult) {
        return formatSuccessResponse(groqResult.text, 'groq', groqResult.model);
      }
      console.warn('[SupportRouter] Groq failed or timed out. Attempting Gemini auto-failover...');
    }

    // 2. Auto-failover to Gemini if available
    if (geminiApiKey) {
      const geminiResult = await callGeminiEngine(systemMessage, userMessage, recentHistory, geminiApiKey, geminiModel);
      if (geminiResult) {
        return formatSuccessResponse(geminiResult.text, 'gemini', geminiResult.model);
      }
      console.warn('[SupportRouter] Gemini failover failed. Attempting cloud fallback...');
    }
  }

  // ── STRATEGY 2: IF PREFERRED PROVIDER IS GEMINI ────────────────────────────
  else if (configuredProvider === 'gemini') {
    // 1. Try Gemini
    if (geminiApiKey) {
      const geminiResult = await callGeminiEngine(systemMessage, userMessage, recentHistory, geminiApiKey, geminiModel);
      if (geminiResult) {
        return formatSuccessResponse(geminiResult.text, 'gemini', geminiResult.model);
      }
      console.warn('[SupportRouter] Gemini failed or timed out. Attempting Groq auto-failover...');
    }

    // 2. Auto-failover to Groq if available
    if (groqApiKey) {
      const groqResult = await callGroqEngine(systemMessage, userMessage, recentHistory, groqApiKey, groqModel);
      if (groqResult) {
        return formatSuccessResponse(groqResult.text, 'groq', groqResult.model);
      }
      console.warn('[SupportRouter] Groq failover failed. Attempting cloud fallback...');
    }
  }

  // ── STRATEGY 3: FREE CLOUD FALLBACK OR LOCAL DETERMINISTIC GROUNDING ───────
  const freeReply = await callFreeAIEngine(systemMessage, userMessage, recentHistory);
  if (freeReply && freeReply.length > 10) {
    return formatSuccessResponse(freeReply, 'free-cloud-ai', 'openai-grounded');
  }

  // Guaranteed safe deterministic response
  return generateDeterministicReply(userMessage, knowledgeItems);
}
