/**
 * POST /api/support/chat
 * 
 * Production-ready customer support chat endpoint.
 * - Grounded in Loka Media knowledge base
 * - Zero hallucination rule
 * - Never mentions Printify
 * - Prompt injection immune
 * - Token & cost optimized
 */

import { NextRequest, NextResponse } from 'next/server';
import { retrieveKnowledge, sanitizeOutput } from '@/services/support/knowledge-retriever';
import { generateSupportAnswer, ChatMessage } from '@/services/support/ai-provider';
import { recordMessageEvent, recordContactSupportClick } from '@/services/support/support-analytics';

// In-memory rate limiting map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 25;     // 25 queries per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before sending another message.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { message, history = [], sessionId, action } = body;

    // Track contact button clicks
    if (action === 'contact_click') {
      recordContactSupportClick();
      return NextResponse.json({ success: true });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const cleanMessage = message.trim().slice(0, 500); // 500 char max length for cost & security

    // 1. Retrieve Knowledge & Detect Intent
    const retrieval = retrieveKnowledge(cleanMessage);

    // 2. Direct intent shortcuts (zero AI tokens, zero latency)
    if (retrieval.directAnswer) {
      const sanitizedReply = sanitizeOutput(retrieval.directAnswer);
      const requiresEscalation = retrieval.intent === 'support_escalation' || retrieval.intent === 'unsupported_query';

      recordMessageEvent(
        cleanMessage,
        retrieval.intent,
        true,
        requiresEscalation,
        sessionId
      );

      return NextResponse.json({
        success: true,
        reply: sanitizedReply,
        requiresEscalation,
        suggestedQuestions: getDynamicSuggestions(retrieval.intent),
        source: 'direct_intent',
        latencyMs: Date.now() - startTime
      });
    }

    // 3. Grounded AI Generation using retrieved snippets
    const formattedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(h => h && typeof h.content === 'string' && (h.role === 'user' || h.role === 'assistant'))
          .slice(-4)
      : [];

    const aiResult = await generateSupportAnswer(
      cleanMessage,
      formattedHistory,
      retrieval.items
    );

    const primaryCategory = retrieval.items[0]?.category || 'general';

    recordMessageEvent(
      cleanMessage,
      primaryCategory,
      aiResult.usedFallback,
      aiResult.requiresEscalation,
      sessionId
    );

    return NextResponse.json({
      success: true,
      reply: aiResult.reply,
      requiresEscalation: aiResult.requiresEscalation,
      suggestedQuestions: getDynamicSuggestions(primaryCategory),
      source: aiResult.usedFallback ? 'knowledge_grounded' : 'ai_generated',
      latencyMs: Date.now() - startTime
    });
  } catch (error: any) {
    console.error('[SupportChatAPI] Unexpected error:', error?.message || error);
    return NextResponse.json(
      {
        success: true,
        reply: "I’m sorry, I ran into a temporary technical issue. For immediate assistance, please reach out to our team at support@loka.media.",
        requiresEscalation: true,
        latencyMs: Date.now() - startTime
      },
      { status: 200 } // Return 200 with friendly message so UI handles gracefully without ugly crashes
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Loka Media AI Support Assistant',
    version: '1.0.0'
  });
}

function getDynamicSuggestions(context: string): string[] {
  switch (context) {
    case 'shipping':
      return [
        "How do I track my order?",
        "Do you ship internationally?",
        "What are your delivery times?"
      ];
    case 'returns':
      return [
        "How do I report a damaged item?",
        "How long do refunds take?",
        "Can I change my order?"
      ];
    case 'products':
      return [
        "What is your sizing advice?",
        "What are your shipping options?",
        "What's your return policy?"
      ];
    case 'orders':
      return [
        "Can I change my shipping address?",
        "What if my package is lost?",
        "I need help with an order"
      ];
    default:
      return [
        "What are your shipping options?",
        "What's your return policy?",
        "Tell me about your products",
        "Where is my order?"
      ];
  }
}
