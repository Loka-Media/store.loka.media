/**
 * Loka Media Support - Knowledge Retrieval & Grounding Engine (RAG)
 *
 * Lightweight, high-precision retrieval mechanism.
 * Uses BM25-style term frequency, token overlap, and tag matching to find top-k relevant snippets.
 * Never leaks internal backend infrastructure or supplier names.
 */

import {
  SUPPORT_KNOWLEDGE_BASE,
  KnowledgeItem,
  CANNED_RESPONSES,
  FORBIDDEN_SUPPLIER_NAMES
} from '@/config/support-knowledge';
import { getSearchableKnowledgeBase } from './knowledge-manager';

export interface RetrievalResult {
  items: KnowledgeItem[];
  intent: 'greeting' | 'supplier_probe' | 'security_probe' | 'support_escalation' | 'unsupported_query' | 'general';
  directAnswer?: string;
  confidence: number;
}

// Security patterns for prompt injection & internal secret extraction
const INJECTION_PATTERNS = [
  /ignore (all|your|previous|any) instructions/i,
  /system prompt/i,
  /hidden instructions/i,
  /developer (mode|instructions|prompt)/i,
  /reveal (your|the) (prompt|instructions|secret|api key)/i,
  /show (me|your) (prompt|api key|credentials|database|env|system message)/i,
  /what (is|are) your (system prompt|internal instructions)/i,
  /jailbreak/i,
  /repeat (everything|the above|your initial)/i,
  /(wholesale|production|supplier|internal) (cost|price|margin|fee)/i,
  /(database|admin|secret) (password|credential|token|url)/i
];

// Supplier probing patterns
const SUPPLIER_PATTERNS = [
  /\bprintify\b/i,
  /\bprintful\b/i,
  /\bgelato\b/i,
  /who (is|are) your supplier/i,
  /who fulfills (your|the) product/i,
  /where do you source/i,
  /what supplier do you use/i,
  /do you use printify/i,
  /are your products from printify/i,
  /what is your backend supplier/i
];

// Direct human escalation patterns
const ESCALATION_PATTERNS = [
  /talk to (a )?human/i,
  /contact (a )?(human|person|agent|representative)/i,
  /speak with (a )?representative/i,
  /customer service number/i,
  /phone number/i,
  /real person/i,
  /file a complaint/i,
  /legal action/i
];

// Greetings
const GREETING_PATTERNS = [
  /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|greetings)[\s!.]*$/i,
  /^(who are you|what can you do|help me)[\s!?.]*$/i
];

/**
 * Fast Levenshtein distance computation for fuzzy string matching
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[] = [];
  for (let i = 0; i <= b.length; i++) d[i] = i;
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? d[j - 1] : Math.min(d[j - 1], d[j], prev) + 1;
      d[j - 1] = prev;
      prev = val;
    }
    d[b.length] = prev;
  }
  return d[b.length];
}

// Common customer support typos map
const COMMON_TYPOS: Record<string, string> = {
  oder: 'order',
  oders: 'orders',
  ordr: 'order',
  ordrs: 'orders',
  odr: 'order',
  shippin: 'shipping',
  shping: 'shipping',
  shiping: 'shipping',
  shippment: 'shipment',
  delivry: 'delivery',
  delvery: 'delivery',
  dilvery: 'delivery',
  trak: 'track',
  traking: 'tracking',
  trakin: 'tracking',
  trck: 'track',
  trake: 'track',
  retun: 'return',
  retuns: 'returns',
  retrn: 'return',
  refnd: 'refund',
  refunds: 'refund',
  rfund: 'refund',
  exchnge: 'exchange',
  cancle: 'cancel',
  canceld: 'canceled',
  produc: 'product',
  prodct: 'product',
  porduct: 'product',
  produts: 'products',
  tshirt: 't-shirt',
  hoddie: 'hoodie',
  hodie: 'hoodie',
  suitcas: 'suitcase',
  lugag: 'luggage',
  lugage: 'luggage',
  adress: 'address',
  adres: 'address',
  paymnt: 'payment',
  paymt: 'payment',
  damagd: 'damaged',
  damged: 'damaged',
  dmged: 'damaged',
  brokn: 'broken',
  suport: 'support',
  qualtiy: 'quality',
  staus: 'status',
  cusotmised: 'customized',
  cusotmize: 'customize',
  customise: 'customize',
  customised: 'customized',
  customisation: 'customization',
  kese: 'how',
  kaise: 'how',
  kharide: 'buy',
  kharidna: 'buy',
  kharid: 'buy'
};

const CORE_SUPPORT_KEYWORDS = [
  'order', 'orders', 'tracking', 'shipping', 'delivery',
  'return', 'returns', 'refund', 'exchange', 'cancel', 'cancellation',
  'address', 'product', 'products', 'apparel', 't-shirt', 'hoodie',
  'suitcase', 'luggage', 'mug', 'poster', 'canvas', 'payment', 'paypal',
  'stripe', 'damaged', 'defective', 'defect', 'support', 'creator', 'creators',
  'payout', 'payouts', 'customize', 'customized', 'customization', 'design',
  'buy', 'buying', 'purchase', 'founder', 'mangat', 'perry', 'rupan', 'bal',
  'loka', 'media', 'store', 'website', 'catalog', 'sizing', 'size', 'chart',
  'policy', 'contact', 'email', 'checkout', 'cart', 'markup', 'studio', 'spinner'
];

/**
 * Normalizes spelling errors and applies fuzzy correction
 */
function normalizeWord(word: string): string {
  const lower = word.toLowerCase().trim();
  if (COMMON_TYPOS[lower]) {
    return COMMON_TYPOS[lower];
  }

  // If word length >= 4, check fuzzy distance to core support vocabulary
  if (lower.length >= 4) {
    for (const kw of CORE_SUPPORT_KEYWORDS) {
      const maxAllowedDist = kw.length >= 6 ? 2 : 1;
      if (Math.abs(lower.length - kw.length) <= maxAllowedDist) {
        if (levenshtein(lower, kw) <= maxAllowedDist) {
          return kw;
        }
      }
    }
  }

  return lower;
}

const STOPWORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
  'with', 'as', 'by', 'that', 'this', 'it', 'from', 'or', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but',
  'if', 'then', 'else', 'when', 'up', 'down', 'out', 'over', 'under', 'again',
  'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'what'
]);

/**
 * Tokenizes, corrects spelling, and normalizes text into searchable word tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .map(w => normalizeWord(w));
}

/**
 * Searches the knowledge base and determines user intent
 */
export function retrieveKnowledge(query: string, customKnowledgeBase?: KnowledgeItem[]): RetrievalResult {
  const cleanQuery = (query || '').trim();
  const knowledgeBase = (customKnowledgeBase && customKnowledgeBase.length > 0)
    ? customKnowledgeBase
    : getSearchableKnowledgeBase();

  // 1. Check for prompt injection / security probes
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleanQuery)) {
      return {
        items: [],
        intent: 'security_probe',
        directAnswer: CANNED_RESPONSES.SECURITY_PROBE,
        confidence: 1.0
      };
    }
  }

  // 2. Check for supplier probing / Printify references
  for (const pattern of SUPPLIER_PATTERNS) {
    if (pattern.test(cleanQuery)) {
      return {
        items: [],
        intent: 'supplier_probe',
        directAnswer: CANNED_RESPONSES.SUPPLIER_PROBE,
        confidence: 1.0
      };
    }
  }

  // 3. Normalize query for typos
  const normalizedWords = cleanQuery
    .toLowerCase()
    .split(/\s+/)
    .map(w => normalizeWord(w));
  const normalizedQuery = normalizedWords.join(' ');
  const queryTokens = tokenize(cleanQuery);

  // 4. Check for direct greetings
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(cleanQuery) || pattern.test(normalizedQuery)) {
      return {
        items: [],
        intent: 'greeting',
        directAnswer: "Hi there! 👋 Welcome to Loka Media support. I can help answer questions about our products, sizing, shipping, returns, and orders. How can I assist you today?",
        confidence: 1.0
      };
    }
  }

  // 5. Check for direct escalation request
  for (const pattern of ESCALATION_PATTERNS) {
    if (pattern.test(cleanQuery) || pattern.test(normalizedQuery)) {
      const contactItem = knowledgeBase.find(k => k.id === 'support-contact-info') || knowledgeBase.find(k => k.category === 'support');
      return {
        items: contactItem ? [contactItem] : [],
        intent: 'support_escalation',
        directAnswer: "You can reach our human support team directly at support@loka.media (Monday–Friday, 9 AM – 6 PM EST). Please include your order number if applicable!",
        confidence: 1.0
      };
    }
  }

  // 6. Defect / damage indicator check (on both original and normalized query)
  const isDefectClaim = /\b(tear|torn|damaged?|defects?|defective|smudge[d]?|broken|misprints?|stained?|ripped|cracked)\b/i.test(normalizedQuery);

  // 7. Hybrid Search Ranking across Knowledge Base with Fuzzy Intelligence
  const scoredItems = knowledgeBase.map(item => {
    let score = 0;
    const itemText = (item.title + ' ' + item.content).toLowerCase();

    // Defect intent priority
    if (isDefectClaim && item.id === 'returns-damaged-defective') {
      score += 25;
    }

    // Exact title / phrase match bonus
    if (itemText.includes(normalizedQuery) || itemText.includes(cleanQuery.toLowerCase())) {
      score += 15;
    }

    // Tag matching bonus (tags represent core intent keywords)
    for (const tag of item.tags) {
      const lowerTag = tag.toLowerCase();
      if (normalizedQuery.includes(lowerTag) || lowerTag.includes(normalizedQuery)) {
        score += 15;
      }
      for (const qToken of queryTokens) {
        if (lowerTag === qToken) {
          score += 10;
        } else if (lowerTag.split(/\s+/).includes(qToken)) {
          score += 8;
        } else if (lowerTag.includes(qToken)) {
          score += 4;
        } else if (qToken.length >= 4 && lowerTag.length >= 4) {
          // Fuzzy tag match for words with small character difference
          if (levenshtein(qToken, lowerTag) <= 1) {
            score += 6;
          }
        }
      }
    }

    // Token overlap in title and body
    for (const token of queryTokens) {
      if (item.title.toLowerCase().includes(token)) {
        score += 6;
      }
      if (item.content.toLowerCase().includes(token)) {
        score += 2;
      }
    }

    return { item, score };
  });

  scoredItems.sort((a, b) => b.score - a.score);

  const highestScore = scoredItems[0]?.score || 0;

  // If score is too low, the query is not found on our website (out of scope)
  if (highestScore < 8) {
    return {
      items: [],
      intent: 'unsupported_query',
      directAnswer: CANNED_RESPONSES.UNKNOWN_FALLBACK,
      confidence: 0
    };
  }

  // Take top 2-3 most relevant items with score >= 8
  const topItems = scoredItems
    .filter(si => si.score >= 8)
    .slice(0, 3)
    .map(si => si.item);

  const confidence = Math.min(1.0, highestScore / 20);

  return {
    items: topItems,
    intent: 'general',
    confidence
  };
}

/**
 * Sanitizes any text string to ensure internal supplier names (Printify, etc.) never leak
 */
export function sanitizeOutput(text: string): string {
  if (!text) return '';
  let sanitized = text;

  // Mask any forbidden supplier mentions
  for (const forbidden of FORBIDDEN_SUPPLIER_NAMES) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'gi');
    sanitized = sanitized.replace(regex, 'our production and fulfillment partners');
  }

  // Redact potential leaked keys / internal URLs
  sanitized = sanitized.replace(/(sk_[a-zA-Z0-9_\-]+|pk_[a-zA-Z0-9_\-]+)/g, '[REDACTED]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9\-_.]+/gi, '[REDACTED]');
  sanitized = sanitized.replace(/(postgres|mongodb):\/\/[^\s]+/gi, '[DATABASE_REDACTED]');

  // Clean raw markdown header hashes (### Heading -> **Heading**)
  sanitized = sanitized.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

  return sanitized;
}
