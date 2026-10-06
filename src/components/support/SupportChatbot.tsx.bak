'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Mail,
  Copy,
  Check,
  ChevronDown,
  Bot,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiresEscalation?: boolean;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! 👋 How can I help you today? I can answer questions about our products, sizing, shipping, returns, and orders.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTED_QUESTIONS = [
  "Tell me about your products",
  "Where is my order?",
  "What are your shipping options?",
  "What's your return policy?",
  "I need help with an order"
];

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile screen width dynamically
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize or restore session ID
  useEffect(() => {
    let sId = sessionStorage.getItem('loka_support_session_id');
    if (!sId) {
      sId = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('loka_support_session_id', sId);
    }
    setSessionId(sId);

    // Restore chat history if exists in current session
    const savedChat = sessionStorage.getItem('loka_support_chat_history');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }, []);

  // Save chat history to session storage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem('loka_support_chat_history', JSON.stringify(messages));
      } catch { }
    }
  }, [messages]);

  // Initialize scoped Lenis instance for chatbot messages smooth scrolling
  useEffect(() => {
    if (!isOpen) return;

    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      prevent: () => false,
    } as any);

    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Initial resize to measure inner content
    lenis.resize();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isOpen]);

  // Smooth scroll to bottom on message change or open
  useEffect(() => {
    if (!isOpen) return;

    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 150);

    const timer = setTimeout(() => {
      if (lenisRef.current && scrollWrapperRef.current) {
        lenisRef.current.resize();
        const maxScroll = scrollWrapperRef.current.scrollHeight;
        lenisRef.current.scrollTo(maxScroll, {
          duration: 0.8,
          immediate: false
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, messages, isLoading]);

  // Prevent background scrolling on mobile when chatbot is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen && window.innerWidth < 640) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setError(null);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .slice(-4)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          sessionId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to reach support server');
      }

      const data = await res.json();
      const assistantReply = data.reply || "I'm here to help. If you need immediate assistance, please email support@loka.media.";

      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requiresEscalation: !!data.requiresEscalation
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('[SupportChat] Error:', err);
      setError('Unable to send message. Please check your connection or email support@loka.media.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText('support@loka.media');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);

    // Track contact button event
    fetch('/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'contact_click', sessionId })
    }).catch(() => { });
  };

  return (
    <>
      {/* ── CHAT BUTTON (WHEN CLOSED) ────────────────────────── */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            zIndex: 99999,
            bottom: isMobile ? '6rem' : '1.5rem',
            right: isMobile ? '1rem' : '1.5rem',
          }}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-[#FF6D1F] to-[#FF8C38] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-[0_10px_30px_rgba(255,109,31,0.4)] hover:shadow-[0_15px_40px_rgba(255,109,31,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            aria-label="Open Customer Support Chat"
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6 transition-transform group-hover:rotate-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
            </div>

            <span className="hidden sm:inline font-bold text-sm tracking-wide">
              Support Chat
            </span>

            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── CHAT WINDOW (WHEN OPEN) ──────────────────────────── */}
      {isOpen && (
        <div
          data-lenis-prevent="true"
          data-modal-scroll="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className={`flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            isMobile
              ? 'bg-[#0A0A0C]'
              : 'bg-[#0A0A0C]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
          }`}
          style={{
            position: 'fixed',
            zIndex: 999999,
            overscrollBehavior: 'contain',
            ...(isMobile
              ? { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh' }
              : { bottom: '1.5rem', right: '1.5rem', width: '410px', height: '620px', maxHeight: '85vh' }
            )
          }}
        >
          {/* THEMED CLEAR CONVERSATION CONFIRMATION DIALOG */}
          {showClearConfirm && (
            <div 
              data-lenis-prevent="true"
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-full max-w-[310px] bg-[#121216] border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6D1F]/15 border border-[#FF6D1F]/30 flex items-center justify-center text-[#FF6D1F] shadow-lg shadow-[#FF6D1F]/20">
                  <RotateCcw className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm tracking-tight">Clear conversation?</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    This will reset your messages and start a fresh support session.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessages([DEFAULT_WELCOME_MESSAGE]);
                      sessionStorage.removeItem('loka_support_chat_history');
                      setError(null);
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6D1F] to-[#FF8C38] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[#FF6D1F]/20 transition-all cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] bg-[#121216] sm:bg-gradient-to-r sm:from-white/[0.04] sm:to-transparent border-b border-white/10 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#FF6D1F] to-[#FFA14A] p-0.5 flex items-center justify-center shadow-lg shadow-[#FF6D1F]/20">
                <div className="w-full h-full bg-[#121216] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#FF6D1F]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm tracking-tight">Loka Support</h3>
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">First-line customer assistance</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear Conversation"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 sm:hidden" />
                <X className="w-5 h-5 hidden sm:block" />
              </button>
            </div>
          </div>

          {/* MESSAGES AREA - LENIS SMOOTH SCROLL WRAPPER */}
          <div
            ref={scrollWrapperRef}
            data-lenis-prevent="true"
            data-modal-scroll="true"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 scrollbar-thin scrollbar-thumb-[#FF6D1F]/40 hover:scrollbar-thumb-[#FF6D1F]/70"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* INNER SCROLL CONTENT (REQUIRED BY LENIS) */}
            <div ref={scrollContentRef} className="space-y-4">
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${isAssistant
                        ? 'bg-white/[0.06] text-gray-200 border border-white/5 shadow-sm'
                        : 'bg-gradient-to-r from-[#FF6D1F] to-[#FF8C38] text-white font-medium shadow-md shadow-[#FF6D1F]/20'
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Human Escalation Card inside Assistant Message */}
                      {msg.requiresEscalation && (
                        <div className="mt-3 p-3 bg-black/40 border border-[#FF6D1F]/30 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-[#FF8C38] font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Human Support Escalation</span>
                          </div>
                          <p className="text-[11px] text-gray-300">
                            Need help with a damaged item, refund, or order problem? Email our support team directly:
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a
                              href="mailto:support@loka.media"
                              className="inline-flex items-center gap-1.5 bg-[#FF6D1F] hover:bg-[#FF8C38] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Mail className="w-3 h-3" />
                              Email Support
                            </a>
                            <button
                              type="button"
                              onClick={copySupportEmail}
                              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-gray-200 text-[11px] px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                            >
                              {copiedEmail ? (
                                <>
                                  <Check className="w-3 h-3 text-green-400" />
                                  <span className="text-green-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Email</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* TYPING INDICATOR */}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2 px-3 bg-white/[0.04] border border-white/5 rounded-2xl w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6D1F] animate-spin" />
                  <span>Finding answer...</span>
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D1F] animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              )}

              {/* ERROR STATE */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center justify-between gap-2">
                  <span className="truncate">{error}</span>
                  <button
                    onClick={() => handleSendMessage()}
                    className="font-bold underline hover:text-white shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* SUGGESTED QUESTIONS (VISIBLE WHEN CONVERSATION IS SHORT) */}
          {messages.length <= 3 && !isLoading && (
            <div
              data-lenis-prevent="true"
              data-modal-scroll="true"
              className="px-4 py-2 bg-black/30 border-t border-white/5 shrink-0"
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Quick Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] text-gray-300 hover:text-white bg-white/5 hover:bg-[#FF6D1F]/20 hover:border-[#FF6D1F]/40 border border-white/10 px-2.5 py-1 rounded-full transition-all cursor-pointer text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT FORM */}
          <div
            data-lenis-prevent="true"
            data-modal-scroll="true"
            className="p-3 sm:p-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] bg-[#0E0F14] sm:bg-black/60 border-t border-white/10 backdrop-blur-md shrink-0"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                maxLength={500}
                placeholder="Ask about shipping, returns, products..."
                disabled={isLoading}
                className="flex-1 bg-white/[0.05] border border-white/10 focus:border-[#FF6D1F]/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FF6D1F]/50 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-[#FF6D1F] to-[#FF8C38] text-white p-2.5 rounded-xl hover:shadow-lg hover:shadow-[#FF6D1F]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1">
              <span>Grounded in Loka Media policies</span>
              <span>{inputMessage.length}/500</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
