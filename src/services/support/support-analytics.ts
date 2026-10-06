/**
 * Loka Media Support - Lightweight Non-Sensitive Analytics
 * 
 * Tracks conversation metrics, common topics, and escalation triggers without storing PII.
 */

interface SupportAnalyticsData {
  totalConversations: number;
  totalMessages: number;
  fallbackCount: number;
  escalationCount: number;
  contactClicks: number;
  topicCounts: Record<string, number>;
  recentQueries: Array<{ query: string; timestamp: number; topic: string }>;
}

const analyticsStore: SupportAnalyticsData = {
  totalConversations: 0,
  totalMessages: 0,
  fallbackCount: 0,
  escalationCount: 0,
  contactClicks: 0,
  topicCounts: {
    shipping: 0,
    returns: 0,
    products: 0,
    orders: 0,
    creator: 0,
    general: 0
  },
  recentQueries: []
};

// Track active sessions to count unique conversations
const activeSessions = new Set<string>();

export function recordMessageEvent(query: string, category: string, usedFallback: boolean, requiresEscalation: boolean, sessionId?: string) {
  analyticsStore.totalMessages++;

  if (sessionId && !activeSessions.has(sessionId)) {
    activeSessions.add(sessionId);
    analyticsStore.totalConversations++;
  }

  if (usedFallback) analyticsStore.fallbackCount++;
  if (requiresEscalation) analyticsStore.escalationCount++;

  const cat = category || 'general';
  analyticsStore.topicCounts[cat] = (analyticsStore.topicCounts[cat] || 0) + 1;

  // Keep last 50 sanitized queries
  const sanitizedQuery = (query || '').slice(0, 80).replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  analyticsStore.recentQueries.unshift({
    query: sanitizedQuery,
    timestamp: Date.now(),
    topic: cat
  });

  if (analyticsStore.recentQueries.length > 50) {
    analyticsStore.recentQueries.pop();
  }
}

export function recordContactSupportClick() {
  analyticsStore.contactClicks++;
}

export function getAnalyticsSummary() {
  return {
    ...analyticsStore,
    activeSessionsCount: activeSessions.size
  };
}
