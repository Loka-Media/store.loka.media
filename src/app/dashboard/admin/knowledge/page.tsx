'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  HelpCircle,
  Package,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Sliders,
  X,
  FileText,
  Tag,
  Check,
  Layers,
  RotateCcw
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import toast, { Toaster } from 'react-hot-toast';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  tags: string[];
  lastUpdated: string;
  enabled?: boolean;
}

interface ReindexStats {
  totalItems: number;
  activeItems: number;
  totalTokens: number;
  categoryCounts: Record<string, number>;
  lastReindexedAt: string;
  status: string;
}

export default function KnowledgeManagementPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [stats, setStats] = useState<ReindexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'faq' | 'products' | 'policies' | 'support'>('all');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    category: 'faq',
    content: '',
    source: '/help',
    tags: '',
    enabled: true
  });

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testTesting, setTestTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  // Fetch Knowledge Base
  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/knowledge');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setStats(data.stats || null);
      } else {
        toast.error(data.error || 'Failed to load knowledge base');
      }
    } catch (err) {
      console.error('Error loading knowledge:', err);
      toast.error('Failed to load knowledge items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // Reindex Action
  const handleReindex = async () => {
    try {
      setReindexing(true);
      const res = await fetch('/api/admin/knowledge/reindex', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        toast.success('Search index synchronized! Active items updated.', {
          icon: '⚡',
          style: { background: '#18181B', color: '#fff', border: '1px solid #3F3F46' }
        });
      } else {
        toast.error(data.error || 'Reindex failed');
      }
    } catch (err) {
      toast.error('Failed to trigger reindexing');
    } finally {
      setReindexing(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all knowledge items to initial system defaults? Custom items will be reset.')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/knowledge/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Knowledge base restored to default articles and FAQs!');
        fetchKnowledge();
      } else {
        toast.error(data.error || 'Reset failed');
      }
    } catch (err) {
      toast.error('Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  // Open Modal for Create or Edit
  const handleOpenAddModal = (defaultCategory = 'faq') => {
    setEditingItem(null);
    setFormData({
      id: '',
      title: '',
      category: defaultCategory,
      content: '',
      source: '/help',
      tags: '',
      enabled: true
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      source: item.source || '/help',
      tags: item.tags.join(', '),
      enabled: item.enabled !== false
    });
    setIsEditModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and Content are required');
      return;
    }

    try {
      const payload = {
        id: editingItem ? editingItem.id : formData.id || undefined,
        title: formData.title,
        category: formData.category,
        content: formData.content,
        source: formData.source,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        enabled: formData.enabled
      };

      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingItem ? 'Item updated successfully!' : 'Item created and indexed!');
        setIsEditModalOpen(false);
        fetchKnowledge();
      } else {
        toast.error(data.error || 'Failed to save item');
      }
    } catch (err) {
      toast.error('An error occurred while saving');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/admin/knowledge?id=${encodeURIComponent(itemToDelete.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Knowledge item removed and reindexed');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchKnowledge();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Test Search Action
  const handleRunTestSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim()) return;

    try {
      setTestTesting(true);
      const res = await fetch('/api/admin/knowledge/test-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data);
      } else {
        toast.error(data.error || 'Search test failed');
      }
    } catch (err) {
      toast.error('Search test request failed');
    } finally {
      setTestTesting(false);
    }
  };

  // Filter items based on active tab & search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab category filter
      let matchesTab = true;
      if (activeTab === 'faq') {
        matchesTab = item.category === 'faq';
      } else if (activeTab === 'products') {
        matchesTab = item.category === 'products';
      } else if (activeTab === 'policies') {
        matchesTab = ['shipping', 'returns', 'policies'].includes(item.category);
      } else if (activeTab === 'support') {
        matchesTab = ['brand', 'orders', 'payments', 'creator', 'support'].includes(item.category);
      }

      if (!matchesTab) return false;

      // Search keyword filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    const faq = items.filter(i => i.category === 'faq').length;
    const products = items.filter(i => i.category === 'products').length;
    const policies = items.filter(i => ['shipping', 'returns', 'policies'].includes(i.category)).length;
    const support = items.filter(i => ['brand', 'orders', 'payments', 'creator', 'support'].includes(i.category)).length;
    return { all: items.length, faq, products, policies, support };
  }, [items]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'faq':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FAQ</span>;
      case 'products':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Product Info</span>;
      case 'shipping':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Shipping Policy</span>;
      case 'returns':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Returns Policy</span>;
      case 'policies':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Platform Policy</span>;
      case 'brand':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Brand & About</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">{category}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white">
      <Toaster position="top-right" />
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/dashboard/admin" className="hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Admin
            </Link>
            <span>/</span>
            <span className="text-orange-400 font-medium">Knowledge & AI Grounding</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Knowledge Management
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold tracking-normal flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Chatbot Live
                </span>
              </h1>
              <p className="text-gray-400 mt-1 text-sm max-w-2xl">
                Centrally manage FAQs, customer-facing product information, shipping/return policies, and platform knowledge.
                All updates instantly ground the customer support assistant without rebuilding.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-sm font-semibold border border-zinc-700 flex items-center gap-2 transition-all hover:border-gray-500"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                Test AI Search
              </button>

              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-sm font-semibold border border-zinc-700 flex items-center gap-2 transition-all disabled:opacity-50"
                title="Refresh and sync in-memory search index"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${reindexing ? 'animate-spin' : ''}`} />
                {reindexing ? 'Indexing...' : 'Reindex'}
              </button>

              <button
                onClick={() => handleOpenAddModal(activeTab === 'faq' ? 'faq' : activeTab === 'products' ? 'products' : activeTab === 'policies' ? 'shipping' : 'faq')}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Total Articles</span>
              <BookOpen className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.totalItems || items.length}</div>
            <div className="text-xs text-gray-400 mt-1">{stats?.activeItems || items.length} active in chatbot</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">FAQs Managed</span>
              <HelpCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{counts.faq}</div>
            <div className="text-xs text-emerald-400 mt-1">Instant Q&A grounding</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Product Content</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{counts.products}</div>
            <div className="text-xs text-blue-400 mt-1">Catalog, sizing & specs</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Store Policies</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{counts.policies}</div>
            <div className="text-xs text-purple-400 mt-1">Shipping & 30-day returns</div>
          </div>

          <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Search Index</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Synchronized
            </div>
            <div className="text-xs text-gray-400 mt-1 truncate">
              {stats?.totalTokens ? `${stats.totalTokens.toLocaleString()} tokens indexed` : 'Live RAG Ready'}
            </div>
          </div>
        </div>

        {/* Tab Selector & Search Filter Bar */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Content ({counts.all})
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'faq'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              FAQs ({counts.faq})
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              Products ({counts.products})
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'policies'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Policies ({counts.policies})
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'support'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              Platform & Articles ({counts.support})
            </button>
          </div>

          {/* Search Box & Reset */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, content, or tag..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={handleResetDefaults}
              title="Reset knowledge base to factory defaults"
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Items List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading knowledge articles & search index...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-center px-4">
            <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-300">No knowledge items found</h3>
            <p className="text-gray-500 text-xs mt-1 max-w-md">
              {searchQuery
                ? `No items match the filter "${searchQuery}". Try clearing search.`
                : 'No articles under this category yet. Click Add Item to create one.'}
            </p>
            <button
              onClick={() => handleOpenAddModal(activeTab === 'all' ? 'faq' : activeTab)}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-all rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {getCategoryBadge(item.category)}
                    <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">#{item.id}</span>
                    <span className="text-xs text-gray-500">• Updated {item.lastUpdated}</span>
                    {item.source && (
                      <span className="text-xs text-gray-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-gray-500" /> {item.source}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-gray-300 text-xs sm:text-sm mt-1.5 line-clamp-3 whitespace-pre-line leading-relaxed">
                    {item.content}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      <Tag className="w-3 h-3 text-gray-500" />
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-md border border-zinc-700/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                    title="Edit item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setItemToDelete(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 bg-zinc-800/80 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 rounded-lg border border-zinc-700 hover:border-rose-800/60 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── ADD / EDIT MODAL ────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingItem ? <Edit2 className="w-5 h-5 text-orange-500" /> : <Plus className="w-5 h-5 text-orange-500" />}
                {editingItem ? 'Edit Knowledge Item' : 'Add New Knowledge / FAQ'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="faq">FAQ (Frequently Asked Question)</option>
                    <option value="products">Products (Catalog, Sizing, Materials)</option>
                    <option value="shipping">Shipping Policy & Delivery Times</option>
                    <option value="returns">Returns Policy & Quality Guarantee</option>
                    <option value="policies">Platform Policy & Rules</option>
                    <option value="orders">Orders & Tracking Support</option>
                    <option value="payments">Payments & Pricing</option>
                    <option value="creator">Creator Program & Earnings</option>
                    <option value="brand">Brand Information & Overview</option>
                    <option value="support">Customer Support & Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Source Link / Route
                  </label>
                  <input
                    type="text"
                    placeholder="/returns, /help"
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Title / Question <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., How do I track my order? or Unisex T-Shirt Fit & Sizing"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Content / Grounded Answer <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Write the clear factual answer that the AI Chatbot will use to answer customers..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 leading-relaxed font-sans"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Rule: Never mention internal supplier names (Printify, etc.). Answers must be customer-facing and accurate.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Search & Intent Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., returns, size chart, sizing, exchange, defective"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Keywords that customers frequently type. Matching tags give high-priority rank in search.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-zinc-900 border-zinc-700"
                />
                <label htmlFor="enabledCheck" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Active in Chatbot (Uncheck to temporarily exclude from AI search)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-orange-600/30"
                >
                  {editingItem ? 'Save & Reindex' : 'Create & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TEST SEARCH MODAL (RAG SANDBOX) ────────────────────────── */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Test AI Knowledge Search (Live Sandbox)
              </h2>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Type any customer question to verify which knowledge snippet is retrieved, check confidence, and see if direct shortcuts trigger.
            </p>

            <form onSubmit={handleRunTestSearch} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="e.g., Do you accept returns on hoodies? or How long is shipping?"
                value={testQuery}
                onChange={e => setTestQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={testTesting || !testQuery.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {testTesting ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Test Results */}
            {testResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-400 font-mono">Latency: {testResult.latencyMs}ms</span>
                    <span className="text-gray-400">
                      Intent: <strong className="text-orange-400 uppercase">{testResult.intent}</strong>
                    </span>
                    <span className="text-gray-400">
                      Confidence: <strong className="text-emerald-400">{Math.round(testResult.confidence * 100)}%</strong>
                    </span>
                  </div>

                  {testResult.directAnswer && (
                    <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        ⚡ Direct Instant Answer (0-Token Shortcut)
                      </div>
                      <p className="text-xs text-gray-200">{testResult.directAnswer}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Retrieved Knowledge Snippets ({testResult.matchedItems?.length || 0})
                  </h4>

                  {testResult.matchedItems?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No matching articles met the score threshold.</p>
                  ) : (
                    <div className="space-y-2">
                      {testResult.matchedItems.map((item: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{item.title}</span>
                            <span className="text-[10px] text-gray-400 uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{item.contentSnippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ────────────────────────────────────── */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Delete Knowledge Item?</h3>
            <p className="text-xs text-gray-400 mt-2">
              Are you sure you want to remove <strong className="text-white">"{itemToDelete.title}"</strong>?
              It will no longer be available in customer chatbot answers.
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
