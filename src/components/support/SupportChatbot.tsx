'use client';

import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { checkoutAPI } from '@/lib/api';
import {
  MessageSquare, X, Send, RotateCcw, Sparkles, Mail,
  Copy, Check, ChevronDown, Bot, AlertCircle, Zap,
  Package, Truck, RefreshCcw, ShoppingBag, HelpCircle,
  ExternalLink, Clock, CheckCircle2, XCircle, LogIn, ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export interface OrderItemPreview {
  product_name: string;
  quantity: number;
  image_url?: string;
  price?: string | number;
}

export interface UserOrderSummary {
  id: number | string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  item_count: number;
  items: OrderItemPreview[];
  tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
  shipping_address?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiresEscalation?: boolean;
  orders?: UserOrderSummary[];
  specificOrder?: UserOrderSummary;
  showAuthPrompt?: boolean;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi there! 👋 I'm **Loka Assistant** — your personal support guide.\n\nI can help you with products, sizing, shipping, returns, and live order tracking. What can I help you with today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const ORDER_INTENT_REGEX = /\b(track|tracking|order|orders|parcel|package|shipment|delivery|kaha hai|status)\b/i;

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part: string, i: number) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600, color: 'white' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function formatOrderDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') || s === 'completed') {
    return { label: 'Delivered', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', Icon: CheckCircle2 };
  }
  if (s.includes('ship') || s.includes('transit')) {
    return { label: 'Shipped', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)', Icon: Truck };
  }
  if (s.includes('product') || s.includes('print') || s.includes('process')) {
    return { label: 'In Production', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', Icon: Clock };
  }
  if (s.includes('cancel')) {
    return { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', Icon: XCircle };
  }
  return { label: 'Order Placed', color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)', border: 'rgba(161,161,170,0.25)', Icon: Package };
}

function getOrderTimeline(status: string) {
  const s = (status || '').toLowerCase();
  const isDelivered = s.includes('deliver') || s === 'completed';
  const isShipped = isDelivered || s.includes('ship') || s.includes('transit');
  const isProduction = isShipped || s.includes('product') || s.includes('print') || s.includes('process');
  const isCancelled = s.includes('cancel');

  if (isCancelled) {
    return [
      { step: 1, title: 'Order Placed', status: 'done' },
      { step: 2, title: 'Cancelled', status: 'cancelled' },
    ];
  }

  return [
    { step: 1, title: 'Placed', status: 'done' },
    { step: 2, title: 'Production', status: isProduction ? (isShipped ? 'done' : 'active') : 'upcoming' },
    { step: 3, title: 'Shipped', status: isShipped ? (isDelivered ? 'done' : 'active') : 'upcoming' },
    { step: 4, title: 'Delivered', status: isDelivered ? 'done' : 'upcoming' },
  ];
}

function getStatusDescription(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') || s === 'completed') {
    return 'Your order has been safely delivered! If you have any questions or sizing concerns, please let us know.';
  }
  if (s.includes('ship') || s.includes('transit')) {
    return 'Your package is on the way! It has been handed over to the courier. Standard delivery takes 3–7 business days.';
  }
  if (s.includes('product') || s.includes('print') || s.includes('process')) {
    return 'Your custom merchandise is currently being crafted and quality-checked by our production team.';
  }
  if (s.includes('cancel')) {
    return 'This order has been cancelled. If you believe this is an error, please reach out to support.';
  }
  return 'Your order has been confirmed and is waiting to enter the production queue shortly.';
}

export default function SupportChatbot() {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Session ID & History restore
  useEffect(() => {
    let sId = sessionStorage.getItem('loka_support_session_id');
    if (!sId) {
      sId = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('loka_support_session_id', sId);
    }
    setSessionId(sId);
    const savedChat = sessionStorage.getItem('loka_support_chat_history');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      } catch { }
    }
  }, []);

  // Save history
  useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem('loka_support_chat_history', JSON.stringify(messages)); } catch { }
    }
  }, [messages]);

  // Personalize welcome message for logged-in user if conversation is fresh
  useEffect(() => {
    if (isAuthenticated && user) {
      const displayName = user.name || user.username || 'there';
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'welcome') {
          return [{
            ...prev[0],
            content: `Hi ${displayName}! 👋 Welcome back to **Loka Media**.\n\nI can help you track your live orders, check shipments, explore products, or answer any questions. What can I do for you today?`,
          }];
        }
        return prev;
      });
    }
  }, [isAuthenticated, user]);

  // Lenis smooth scroll
  useEffect(() => {
    if (!isOpen) return;
    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!wrapper || !content) return;
    const lenis = new Lenis({
      wrapper, content, duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true, syncTouch: false, prevent: () => false,
    } as any);
    lenisRef.current = lenis;
    let rafId: number;
    const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    lenis.resize();
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); lenisRef.current = null; };
  }, [isOpen]);

  // Scroll to bottom on message change
  useEffect(() => {
    if (!isOpen) return;
    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 150);
    const timer = setTimeout(() => {
      if (lenisRef.current && scrollWrapperRef.current) {
        lenisRef.current.resize();
        lenisRef.current.scrollTo(scrollWrapperRef.current.scrollHeight, { duration: 0.8 });
      } else { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, messages, isLoading]);

  // Prevent background scroll on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen && window.innerWidth < 640) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Helper to fetch and normalize user orders
  const fetchUserOrders = async (): Promise<UserOrderSummary[]> => {
    try {
      const res = await checkoutAPI.getUserOrders({ limit: 8 });
      const rawOrders = Array.isArray(res) ? res : (res?.orders || res?.data || res?.result || []);
      
      return rawOrders.map((order: any) => {
        const meta = order.metadata || {};
        const stripeAmountCents = meta.paymentDetails?.amount_received || meta.paymentDetails?.amount || 0;
        const stripeTotal = stripeAmountCents > 0 ? stripeAmountCents / 100 : null;
        const customerPaymentAmount = parseFloat(order.customer_payment_amount || order.customerPaymentAmount || '0');
        const backendTotal = parseFloat(order.total_amount || order.totalAmount || order.total || '0');
        const resolvedTotal = customerPaymentAmount > 0 ? customerPaymentAmount : (stripeTotal || backendTotal);

        const rawItems = order.order_items || order.orderItems || order.items || [];
        const items: OrderItemPreview[] = rawItems.map((item: any) => ({
          product_name: item.product_name || item.productName || item.title || 'Loka Item',
          quantity: Number(item.quantity) || 1,
          image_url: item.image_url || item.imageUrl || item.thumbnail_url || item.thumbnail || '',
          price: item.price || item.unit_price || 0,
        }));

        return {
          id: order.id,
          order_number: order.order_number || order.orderNumber || `ORD-${order.id}`,
          status: (order.order_status || order.status || 'pending').toLowerCase(),
          total_amount: resolvedTotal,
          created_at: order.created_at || order.createdAt || new Date().toISOString(),
          item_count: order.item_count || items.length,
          items,
          tracking_number: order.tracking_number || order.trackingNumber || meta?.tracking_number || meta?.trackingNumber,
          carrier: order.carrier || order.fulfillment?.carrier || meta?.carrier,
          tracking_url: order.tracking_url || order.trackingUrl || meta?.tracking_url,
          shipping_address: order.shipping_address || order.shippingAddress,
        };
      });
    } catch (err) {
      console.warn('Failed to fetch user orders for chatbot:', err);
      return [];
    }
  };

  // Dedicated action to track a specific order with full timeline details
  const handleTrackSpecificOrder = async (order: UserOrderSummary) => {
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: `What is the status of my order #${order.order_number}?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let detailedOrder = order;
    try {
      const res = await checkoutAPI.getOrderDetails(order.id);
      if (res) {
        const ordData = res.order || res;
        const fulfillment = res.fulfillment || {};
        detailedOrder = {
          ...order,
          status: (ordData.status || order.status).toLowerCase(),
          tracking_number: fulfillment.tracking_number || ordData.tracking_number || order.tracking_number,
          carrier: fulfillment.carrier || ordData.carrier || order.carrier,
          tracking_url: fulfillment.tracking_url || ordData.tracking_url || order.tracking_url,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch extra order details:', err);
    }

    setMessages(prev => [...prev, {
      id: 'ast_' + Date.now(),
      role: 'assistant',
      content: `Here is the live status & tracking timeline for order **#${detailedOrder.order_number}**:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      specificOrder: detailedOrder,
    }]);

    setIsLoading(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;
    setError(null);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(), role: 'user', content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Check if user is asking about a specific order number (e.g. ORD-1789995143664-Y3528P or #ORD-...)
    const orderNumberMatch = text.match(/ORD-[A-Za-z0-9_-]+/i) || text.match(/#([A-Za-z0-9_-]{5,})/i);
    const extractedOrderNum = orderNumberMatch
      ? (orderNumberMatch[0].startsWith('#') ? orderNumberMatch[0].slice(1) : orderNumberMatch[0])
      : null;

    const isOrderIntent = ORDER_INTENT_REGEX.test(text) || !!extractedOrderNum;

    try {
      // 1. If user is asking about order tracking
      if (isOrderIntent) {
        if (!isAuthenticated) {
          // Guest User asking for order tracking -> Prompt to log in or enter order number
          setMessages(prev => [...prev, {
            id: 'ast_' + Date.now(),
            role: 'assistant',
            content: "To automatically view your live order status and tracking details, please **sign in to your account**.\n\nIf you placed an order as a guest, you can also track it directly using your confirmation email or enter your **Order Number** (e.g. `ORD-10824`)!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            showAuthPrompt: true,
          }]);
          if (!isOpen) setUnreadCount(prev => prev + 1);
          setIsLoading(false);
          return;
        }

        // Authenticated user -> Fetch orders
        const fetchedOrders = await fetchUserOrders();

        // CASE 1A: Specific Order requested!
        if (extractedOrderNum) {
          const matchedOrder = fetchedOrders.find(o =>
            o.order_number.toLowerCase().includes(extractedOrderNum.toLowerCase()) ||
            String(o.id) === extractedOrderNum
          );

          if (matchedOrder) {
            let detailed = matchedOrder;
            try {
              const res = await checkoutAPI.getOrderDetails(matchedOrder.id);
              if (res) {
                const ordData = res.order || res;
                const fulfillment = res.fulfillment || {};
                detailed = {
                  ...matchedOrder,
                  status: (ordData.status || matchedOrder.status).toLowerCase(),
                  tracking_number: fulfillment.tracking_number || ordData.tracking_number || matchedOrder.tracking_number,
                  carrier: fulfillment.carrier || ordData.carrier || matchedOrder.carrier,
                  tracking_url: fulfillment.tracking_url || ordData.tracking_url || matchedOrder.tracking_url,
                };
              }
            } catch { }

            setMessages(prev => [...prev, {
              id: 'ast_' + Date.now(),
              role: 'assistant',
              content: `Here is the live status & tracking timeline for order **#${detailed.order_number}**:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              specificOrder: detailed,
            }]);
            if (!isOpen) setUnreadCount(prev => prev + 1);
            setIsLoading(false);
            return;
          }
        }

        // CASE 1B: General Orders List requested
        if (fetchedOrders.length === 0) {
          const userName = user?.name || user?.username || 'there';
          setMessages(prev => [...prev, {
            id: 'ast_' + Date.now(),
            role: 'assistant',
            content: `I checked your account (**${user?.email || userName}**), but no recent orders were found yet.\n\nIf you recently placed an order, it might take 1-2 minutes to sync. Would you like help browsing our creator store?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
        } else {
          const userName = user?.name || user?.username || 'there';
          setMessages(prev => [...prev, {
            id: 'ast_' + Date.now(),
            role: 'assistant',
            content: `Here are your recent orders, **${userName}**! You can view full tracking details or ask questions about any order:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            orders: fetchedOrders,
          }]);
        }
        if (!isOpen) setUnreadCount(prev => prev + 1);
        setIsLoading(false);
        return;
      }

      // 2. Regular Knowledge Base / Support Query via API
      const historyPayload = messages
        .filter(m => m.id !== 'welcome').slice(-4)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/support/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload, sessionId }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const assistantReply = data.reply || "If you need immediate assistance, please email support@loka.media.";

      setMessages(prev => [...prev, {
        id: 'ast_' + Date.now(), role: 'assistant', content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requiresEscalation: !!data.requiresEscalation,
      }]);

      if (!isOpen) setUnreadCount(prev => prev + 1);
    } catch {
      setError('Unable to send message. Please check your connection or email support@loka.media.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText('support@loka.media');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    fetch('/api/support/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'contact_click', sessionId }),
    }).catch(() => { });
  };

  const copyOrderNum = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(num);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  const suggestedQuestions = isAuthenticated
    ? [
        { icon: Package, label: 'Track My Orders', query: 'Where is my order?' },
        { icon: ShoppingBag, label: 'Our Products', query: 'Tell me about your products' },
        { icon: Truck, label: 'Shipping Info', query: 'What are your shipping options?' },
        { icon: RefreshCcw, label: 'Returns', query: "What's your return policy?" },
        { icon: HelpCircle, label: 'Order Help', query: 'I need help with an order' },
      ]
    : [
        { icon: Package, label: 'Track Order', query: 'Where is my order?' },
        { icon: ShoppingBag, label: 'Our Products', query: 'Tell me about your products' },
        { icon: Truck, label: 'Shipping Info', query: 'What are your shipping options?' },
        { icon: RefreshCcw, label: 'Returns', query: "What's your return policy?" },
        { icon: HelpCircle, label: 'Order Help', query: 'I need help with an order' },
      ];

  const showSuggestions = messages.length <= 3 && !isLoading;

  /* ─────────────── STYLES (inline for reliability) ─────────────── */
  const WIN_BORDER_RADIUS = '28px';
  const ORANGE = '#FF6D1F';
  const ORANGE_LIGHT = '#FF9A45';
  const GREEN = '#34D399';
  const BG_DARK = '#080809';

  return (
    <>
      {/* ─── LAUNCH BUTTON ───────────────────────────────────────── */}
      {!isOpen && (
        <div style={{
          position: 'fixed', zIndex: 99999,
          bottom: isMobile ? '5.5rem' : '1.75rem',
          right: isMobile ? '1rem' : '1.75rem',
        }}>
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Customer Support Chat"
            className="group relative flex items-center gap-2.5 text-white rounded-full cursor-pointer font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_LIGHT} 100%)`,
              padding: isMobile ? '0.875rem' : '0.875rem 1.4rem',
              fontSize: '0.8125rem', border: 'none', fontFamily: 'inherit',
              boxShadow: `0 10px 32px rgba(255,109,31,0.45), 0 0 0 1px rgba(255,255,255,0.08)`,
            }}
          >
            <div style={{ position: 'relative' }}>
              <MessageSquare size={20} className="transition-transform duration-300 group-hover:rotate-6" />
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px',
                width: '9px', height: '9px', background: GREEN,
                borderRadius: '50%', border: `2px solid ${ORANGE}`,
                animation: 'lokaPulse 2s ease infinite',
              }} />
            </div>
            {!isMobile && <span>Support Chat</span>}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: '#EF4444', color: 'white', fontSize: '10px', fontWeight: 900,
                width: '20px', height: '20px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #0A0A0C', animation: 'lokaBounce 1s infinite',
              }}>{unreadCount}</span>
            )}
          </button>
        </div>
      )}

      {/* ─── CHAT WINDOW ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          data-lenis-prevent="true"
          data-modal-scroll="true"
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          style={{
            position: 'fixed', zIndex: 999999,
            overscrollBehavior: 'contain',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'lokaChatIn 0.38s cubic-bezier(0.34,1.4,0.64,1) both',
            ...(isMobile
              ? { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh' }
              : { bottom: '1.75rem', right: '1.75rem', width: '430px', height: '650px', maxHeight: '88vh' }),
            background: isMobile ? BG_DARK : 'rgba(10,10,12,0.97)',
            backdropFilter: isMobile ? 'none' : 'blur(28px)',
            WebkitBackdropFilter: isMobile ? 'none' : 'blur(28px)',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: isMobile ? 0 : WIN_BORDER_RADIUS,
            boxShadow: isMobile ? 'none' : `0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,109,31,0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Top ambient glow */}
          {!isMobile && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '200px',
              background: `radial-gradient(ellipse at 50% 0%, rgba(255,109,31,0.09) 0%, transparent 70%)`,
              pointerEvents: 'none', zIndex: 0, borderRadius: `${WIN_BORDER_RADIUS} ${WIN_BORDER_RADIUS} 0 0`,
            }} />
          )}

          {/* ── CLEAR CONFIRM ── */}
          {showClearConfirm && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.25rem', animation: 'lokaFadeIn 0.2s ease both',
            }}>
              <div style={{
                width: '100%', maxWidth: '296px',
                background: 'linear-gradient(145deg, #141418, #0f0f13)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '1.5rem',
                boxShadow: '0 24px 60px rgba(0,0,0,0.95)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '1rem', textAlign: 'center',
              }}>
                <div style={{
                  width: '52px', height: '52px',
                  background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.22)',
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: ORANGE,
                }}>
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 6px' }}>Clear conversation?</h4>
                  <p style={{ color: '#6B7280', fontSize: '0.75rem', lineHeight: 1.55, margin: 0 }}>
                    Your messages will be deleted and a fresh session will start.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#D1D5DB', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Cancel</button>
                  <button
                    type="button"
                    onClick={() => { setMessages([DEFAULT_WELCOME_MESSAGE]); sessionStorage.removeItem('loka_support_chat_history'); setError(null); setShowClearConfirm(false); }}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, border: 'none', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,109,31,0.3)' }}
                  >Clear Chat</button>
                </div>
              </div>
            </div>
          )}

          {/* ── HEADER ── */}
          <div style={{
            position: 'relative', zIndex: 1, flexShrink: 0,
            padding: isMobile ? 'max(0.9rem, env(safe-area-inset-top)) 1rem 0.9rem' : '1rem 1.25rem',
            background: 'linear-gradient(180deg, rgba(255,109,31,0.08) 0%, rgba(14,14,18,0.98) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            userSelect: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Avatar with gradient + glow */}
              <div style={{
                width: '44px', height: '44px', flexShrink: 0,
                background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_LIGHT} 100%)`,
                borderRadius: '14px', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 20px rgba(255,109,31,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`,
              }}>
                <Bot size={20} color="white" />
                <span style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '11px', height: '11px', background: GREEN,
                  borderRadius: '50%', border: `2.5px solid ${BG_DARK}`,
                }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', margin: 0, letterSpacing: '-0.01em' }}>
                    Loka Assistant
                  </h3>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                    color: GREEN, fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '999px',
                  }}>
                    <span style={{ width: '5px', height: '5px', background: GREEN, borderRadius: '50%', animation: 'lokaPulse 2s infinite' }} />
                    Live
                  </span>
                </div>
                <p style={{ color: '#5B6070', fontSize: '11px', margin: 0, marginTop: '1px' }}>
                  {isAuthenticated && user?.name ? `Signed in as ${user.name}` : 'Loka Media · Instant support'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear Conversation"
                className="p-2 rounded-[10px] border-0 text-[#5B6070] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              ><RotateCcw size={15} /></button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-2 rounded-[10px] border-0 text-[#5B6070] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {isMobile ? <ChevronDown size={18} /> : <X size={18} />}
              </button>
            </div>
          </div>

          {/* ── MESSAGES CONTAINER ── */}
          <div
            ref={scrollWrapperRef}
            data-lenis-prevent="true"
            data-modal-scroll="true"
            style={{
              flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
              padding: '1.25rem 1rem',
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,109,31,0.25) transparent',
            }}
          >
            <div ref={scrollContentRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {messages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isAssistant ? 'flex-start' : 'flex-end',
                      animation: 'lokaMsgIn 0.32s cubic-bezier(0.34,1.3,0.64,1) both',
                    }}
                  >
                    {isAssistant && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', maxWidth: '94%', width: '100%' }}>
                        {/* Mini bot avatar */}
                        <div style={{
                          width: '28px', height: '28px', flexShrink: 0,
                          background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`,
                          borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(255,109,31,0.25)', marginBottom: '22px',
                        }}>
                          <Bot size={14} color="white" />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.028) 100%)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: idx === 0 ? '18px 18px 18px 4px' : '4px 18px 18px 18px',
                            padding: '0.85rem 1rem',
                            fontSize: '0.8125rem', lineHeight: 1.68, color: '#C9D1DB',
                            boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
                          }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {renderContent(msg.content)}
                            </p>

                            {/* ── GUEST AUTH PROMPT CARD ── */}
                            {msg.showAuthPrompt && (
                              <div style={{
                                marginTop: '0.85rem', padding: '0.85rem',
                                background: 'rgba(255,109,31,0.08)',
                                border: '1px solid rgba(255,109,31,0.22)', borderRadius: '14px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF8C38', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>
                                  <LogIn size={13} /><span>Account Login Required</span>
                                </div>
                                <p style={{ color: '#9CA3AF', fontSize: '11px', lineHeight: 1.5, margin: '0 0 10px' }}>
                                  Sign in to immediately access all your purchase history, live package tracking, and delivery updates.
                                </p>
                                <Link
                                  href="/auth/login"
                                  onClick={() => setIsOpen(false)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`,
                                    color: 'white', fontWeight: 700, fontSize: '11px',
                                    padding: '7px 14px', borderRadius: '10px', textDecoration: 'none',
                                    boxShadow: '0 4px 14px rgba(255,109,31,0.3)',
                                  }}
                                >
                                  <LogIn size={12} /><span>Sign In to View Orders</span><ChevronRight size={12} />
                                </Link>
                              </div>
                            )}

                            {/* ── SPECIFIC ORDER TRACKING TIMELINE CARD ── */}
                            {msg.specificOrder && (
                              <div style={{
                                marginTop: '0.85rem',
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px', padding: '0.9rem',
                              }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>
                                      #{msg.specificOrder.order_number}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyOrderNum(msg.specificOrder!.order_number)}
                                      title="Copy Order Number"
                                      style={{
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: copiedOrderNumber === msg.specificOrder.order_number ? GREEN : '#6B7280', padding: '2px', display: 'flex', alignItems: 'center',
                                      }}
                                    >
                                      {copiedOrderNumber === msg.specificOrder.order_number ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                  </div>

                                  {(() => {
                                    const b = getStatusBadge(msg.specificOrder.status);
                                    const Icon = b.Icon;
                                    return (
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        background: b.bg, border: `1px solid ${b.border}`,
                                        color: b.color, fontSize: '10px', fontWeight: 700,
                                        padding: '2px 8px', borderRadius: '999px',
                                      }}>
                                        <Icon size={10} />
                                        <span>{b.label}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Status explanation banner */}
                                <div style={{
                                  background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.2)',
                                  borderRadius: '10px', padding: '0.65rem 0.75rem', marginBottom: '12px',
                                }}>
                                  <p style={{ margin: 0, fontSize: '11px', color: '#D1D5DB', lineHeight: 1.5 }}>
                                    {getStatusDescription(msg.specificOrder.status)}
                                  </p>
                                </div>

                                {/* 4-Step Progress Tracker */}
                                <div style={{ marginBottom: '14px', padding: '0 4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                    {/* Connecting bar */}
                                    <div style={{
                                      position: 'absolute', top: '10px', left: '12px', right: '12px', height: '2px',
                                      background: 'rgba(255,255,255,0.08)', zIndex: 0,
                                    }} />

                                    {getOrderTimeline(msg.specificOrder.status).map(step => {
                                      const isDone = step.status === 'done';
                                      const isActive = step.status === 'active';
                                      const isCancelled = step.status === 'cancelled';

                                      const dotBg = isDone ? '#10B981' : isActive ? ORANGE : isCancelled ? '#EF4444' : 'rgba(255,255,255,0.15)';
                                      const textColor = isDone ? '#10B981' : isActive ? '#FF8C38' : isCancelled ? '#EF4444' : '#6B7280';

                                      return (
                                        <div key={step.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                          <div style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '10px', fontWeight: 800,
                                            boxShadow: isActive ? '0 0 10px rgba(255,109,31,0.5)' : isDone ? '0 0 8px rgba(16,185,129,0.35)' : 'none',
                                            border: `2px solid ${BG_DARK}`,
                                          }}>
                                            {isDone ? '✓' : isCancelled ? '✕' : step.step}
                                          </div>
                                          <span style={{ fontSize: '9px', fontWeight: 700, color: textColor, marginTop: '4px' }}>
                                            {step.title}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Items summary */}
                                {msg.specificOrder.items && msg.specificOrder.items.length > 0 && (
                                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                                      Package Contents
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {msg.specificOrder.items.map((itm, itmIdx) => (
                                        <div key={itmIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                            {itm.image_url ? (
                                              <img src={itm.image_url} alt={itm.product_name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                                            ) : (
                                              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Package size={12} color="#9CA3AF" />
                                              </div>
                                            )}
                                            <span style={{ fontSize: '11px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {itm.product_name} <span style={{ color: '#6B7280' }}>x{itm.quantity}</span>
                                            </span>
                                          </div>
                                          <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                                            {formatPrice(itm.price || 0)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tracking number if available */}
                                {msg.specificOrder.tracking_number && (
                                  <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Truck size={12} color="#38BDF8" />
                                      <span style={{ color: '#9CA3AF' }}>Tracking:</span>
                                      <span style={{ color: 'white', fontWeight: 600 }}>{msg.specificOrder.tracking_number}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => copyOrderNum(msg.specificOrder!.tracking_number!)}
                                      style={{ background: 'transparent', border: 'none', color: copiedOrderNumber === msg.specificOrder.tracking_number ? GREEN : '#9CA3AF', cursor: 'pointer' }}
                                    >
                                      {copiedOrderNumber === msg.specificOrder.tracking_number ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                  <Link
                                    href={`/orders/${msg.specificOrder.id}`}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                      flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                      background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`,
                                      border: 'none', color: 'white',
                                      padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                                      textDecoration: 'none', boxShadow: '0 4px 12px rgba(255,109,31,0.25)',
                                    }}
                                  >
                                    <span>Full Order Details</span><ExternalLink size={10} />
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => handleSendMessage('Track my orders')}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                      color: '#D1D5DB', padding: '6px 10px', borderRadius: '8px',
                                      fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                  >
                                    <ArrowLeft size={10} /><span>All Orders</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ── ALL RECENT ORDERS CARDS ── */}
                            {msg.orders && msg.orders.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.85rem' }}>
                                {msg.orders.map(ord => {
                                  const status = getStatusBadge(ord.status);
                                  const StatusIcon = status.Icon;
                                  const isCopied = copiedOrderNumber === ord.order_number;

                                  return (
                                    <div
                                      key={ord.id}
                                      style={{
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '14px', padding: '0.75rem 0.85rem',
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      {/* Top: Order # & Status Badge */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                          <span style={{ color: 'white', fontWeight: 700, fontSize: '12px', letterSpacing: '-0.01em' }}>
                                            #{ord.order_number}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => copyOrderNum(ord.order_number)}
                                            title="Copy Order Number"
                                            style={{
                                              background: 'transparent', border: 'none', cursor: 'pointer',
                                              color: isCopied ? GREEN : '#6B7280', padding: '2px', display: 'flex', alignItems: 'center',
                                            }}
                                          >
                                            {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                          </button>
                                        </div>

                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                                          background: status.bg, border: `1px solid ${status.border}`,
                                          color: status.color, fontSize: '10px', fontWeight: 700,
                                          padding: '2px 8px', borderRadius: '999px', flexShrink: 0,
                                        }}>
                                          <StatusIcon size={10} />
                                          <span>{status.label}</span>
                                        </span>
                                      </div>

                                      {/* Date & Amount */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF', marginBottom: '8px' }}>
                                        <span>{formatOrderDate(ord.created_at)}</span>
                                        <span style={{ color: 'white', fontWeight: 700 }}>
                                          {formatPrice(ord.total_amount)}
                                          <span style={{ color: '#6B7280', fontWeight: 500, marginLeft: '4px' }}>
                                            ({ord.item_count} {ord.item_count === 1 ? 'item' : 'items'})
                                          </span>
                                        </span>
                                      </div>

                                      {/* Item thumbnails or names preview */}
                                      {ord.items && ord.items.length > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                                          {ord.items.slice(0, 3).map((item, itmIdx) => (
                                            <div
                                              key={itmIdx}
                                              style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                                                padding: '4px 6px', border: '1px solid rgba(255,255,255,0.06)',
                                                maxWidth: '180px',
                                              }}
                                            >
                                              {item.image_url ? (
                                                <img
                                                  src={item.image_url}
                                                  alt={item.product_name}
                                                  style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                                />
                                              ) : (
                                                <div style={{ width: '22px', height: '22px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                  <Package size={11} color="#9CA3AF" />
                                                </div>
                                              )}
                                              <span style={{ fontSize: '10px', color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.product_name}
                                              </span>
                                            </div>
                                          ))}
                                          {ord.items.length > 3 && (
                                            <span style={{ fontSize: '10px', color: '#6B7280', padding: '0 4px' }}>
                                              +{ord.items.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Action buttons */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                        <Link
                                          href={`/orders/${ord.id}`}
                                          onClick={() => setIsOpen(false)}
                                          style={{
                                            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                                            padding: '5px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                            textDecoration: 'none', transition: 'all 0.15s ease',
                                          }}
                                        >
                                          <span>View Order Details</span><ExternalLink size={10} />
                                        </Link>

                                        <button
                                          type="button"
                                          onClick={() => handleTrackSpecificOrder(ord)}
                                          style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            background: 'rgba(255,109,31,0.12)', border: '1px solid rgba(255,109,31,0.3)',
                                            color: '#FF8C38', padding: '5px 12px', borderRadius: '8px',
                                            fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'all 0.15s ease',
                                          }}
                                        >
                                          <span>Track</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Escalation card */}
                            {msg.requiresEscalation && (
                              <div style={{
                                marginTop: '0.8rem', padding: '0.8rem',
                                background: 'rgba(255,109,31,0.07)',
                                border: '1px solid rgba(255,109,31,0.2)', borderRadius: '12px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF8C38', fontWeight: 700, fontSize: '11px', marginBottom: '6px' }}>
                                  <AlertCircle size={13} /><span>Need Human Support?</span>
                                </div>
                                <p style={{ color: '#9CA3AF', fontSize: '11px', lineHeight: 1.55, margin: '0 0 10px' }}>
                                  For complex issues like refunds or damaged items, reach our team directly:
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <a
                                    href="mailto:support@loka.media"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, color: 'white', fontWeight: 700, fontSize: '11px', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(255,109,31,0.28)' }}
                                  >
                                    <Mail size={11} />Email Support
                                  </a>
                                  <button
                                    type="button"
                                    onClick={copySupportEmail}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: copiedEmail ? GREEN : '#D1D5DB', fontSize: '11px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
                                  >
                                    {copiedEmail ? <><Check size={11} /><span>Copied!</span></> : <><Copy size={11} /><span>Copy Email</span></>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: '#374151', marginTop: '4px', display: 'block', paddingLeft: '2px' }}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isAssistant && (
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{
                          background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_LIGHT} 100%)`,
                          borderRadius: '18px 18px 4px 18px',
                          padding: '0.72rem 1rem',
                          fontSize: '0.8125rem', lineHeight: 1.65,
                          color: 'white', fontWeight: 500,
                          boxShadow: '0 6px 20px rgba(255,109,31,0.28)',
                          wordBreak: 'break-word',
                        }}>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        </div>
                        <span style={{ fontSize: '10px', color: '#374151', marginTop: '4px', display: 'block', textAlign: 'right', paddingRight: '2px' }}>
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', animation: 'lokaMsgIn 0.32s cubic-bezier(0.34,1.3,0.64,1) both' }}>
                  <div style={{ width: '28px', height: '28px', flexShrink: 0, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,109,31,0.25)', marginBottom: '4px' }}>
                    <Bot size={14} color="white" />
                  </div>
                  <div style={{
                    background: 'linear-gradient(145deg, rgba(255,109,31,0.06) 0%, rgba(255,255,255,0.035) 100%)',
                    border: '1px solid rgba(255,109,31,0.18)',
                    borderRadius: '4px 18px 18px 18px',
                    padding: '0.65rem 0.95rem',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    <Sparkles size={13} color={ORANGE} style={{ animation: 'lokaGlowPulse 1.8s ease-in-out infinite' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#D1D5DB', letterSpacing: '-0.01em' }}>
                      {inputMessage.toLowerCase().includes('order') || inputMessage.toLowerCase().includes('track') ? 'Checking orders' : 'Thinking'}
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '1px' }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span
                          key={i}
                          style={{
                            width: '4.5px', height: '4.5px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})`,
                            animation: 'lokaTypingWave 1.3s ease-in-out infinite both',
                            animationDelay: `${d}s`,
                            boxShadow: '0 0 6px rgba(255,109,31,0.4)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '12px', color: '#FCA5A5', flex: 1 }}>{error}</span>
                  <button onClick={() => handleSendMessage()} style={{ fontSize: '12px', fontWeight: 700, color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>Retry</button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── SUGGESTED QUESTIONS ── */}
          {showSuggestions && (
            <div
              data-lenis-prevent="true"
              style={{ flexShrink: 0, padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)' }}
            >
              <p style={{ fontSize: '10px', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                Quick start
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {suggestedQuestions.map(({ icon: Icon, label, query }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSendMessage(query)}
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#6B7280] hover:text-[#FF8C38] bg-white/[0.04] hover:bg-[#FF6D1F]/10 border border-white/[0.07] hover:border-[#FF6D1F]/30 px-2.5 py-1.5 rounded-full cursor-pointer transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INPUT BAR ── */}
          <div
            data-lenis-prevent="true"
            style={{
              flexShrink: 0,
              padding: isMobile ? '0.875rem 1rem max(0.875rem, env(safe-area-inset-bottom))' : '0.875rem 1rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(8,8,10,0.92)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <form
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] focus-within:border-[#FF6D1F]/50 focus-within:shadow-[0_0_0_3px_rgba(255,109,31,0.08)] rounded-2xl pl-4 pr-1.5 py-1.5 transition-all duration-200"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                maxLength={500}
                placeholder={isAuthenticated ? "Ask about orders, sizing, shipping..." : "Ask me anything..."}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 outline-none text-white text-[13px] placeholder-[#4B5563] disabled:opacity-50"
                style={{ fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-9 h-9 flex items-center justify-center rounded-xl border-0 cursor-pointer transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background: inputMessage.trim() && !isLoading ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE_LIGHT})` : 'rgba(255,255,255,0.05)',
                  color: inputMessage.trim() && !isLoading ? 'white' : '#4B5563',
                  boxShadow: inputMessage.trim() && !isLoading ? '0 4px 14px rgba(255,109,31,0.35)' : 'none',
                  fontFamily: 'inherit',
                }}
                aria-label="Send Message"
              ><Send size={15} /></button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0 0.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={10} color={ORANGE} />
                <span style={{ color: '#374151', fontSize: '10px' }}>Powered by Loka · Live Orders & Policy</span>
              </div>
              <span style={{ color: '#374151', fontSize: '10px' }}>{inputMessage.length}/500</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── KEYFRAMES ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes lokaChatIn {
          from { opacity: 0; transform: translateY(22px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lokaMsgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lokaFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lokaPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes lokaBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes lokaTypingWave {
          0%, 60%, 100% {
            transform: translateY(0) scale(0.75);
            opacity: 0.35;
          }
          30% {
            transform: translateY(-3px) scale(1.15);
            opacity: 1;
          }
        }
        @keyframes lokaGlowPulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.7;
            filter: drop-shadow(0 0 0 rgba(255,109,31,0));
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
            filter: drop-shadow(0 0 7px rgba(255,109,31,0.7));
          }
        }
        @keyframes lokaPing {
          0%   { transform: scale(1); opacity: 0.3; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes lokaSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
