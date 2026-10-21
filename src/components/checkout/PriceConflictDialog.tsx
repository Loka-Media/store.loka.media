'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';

export interface PriceConflictItem {
  productId: number;
  variantId: number;
  title: string;
  acknowledgedPrice: number;
  currentPrice: number;
}

interface PriceConflictDialogProps {
  conflicts: PriceConflictItem[];
  isOpen: boolean;
  onClose: () => void;
  onAcceptUpdatedPrices: (conflicts: PriceConflictItem[]) => void;
}

export default function PriceConflictDialog({
  conflicts,
  isOpen,
  onClose,
  onAcceptUpdatedPrices,
}: PriceConflictDialogProps) {
  if (!isOpen || !conflicts || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#121214] border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Price Update Detected</h3>
            <p className="text-xs text-zinc-400">Prices have changed since items were added to your cart</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-4">
          One or more items in your cart have been updated by creators. Please review the updated prices before proceeding.
        </p>

        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
          {conflicts.map((item, idx) => {
            const diff = item.currentPrice - item.acknowledgedPrice;
            const isIncrease = diff > 0;
            return (
              <div
                key={`${item.productId}-${item.variantId}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm"
              >
                <div className="flex-1 pr-3">
                  <div className="font-medium text-zinc-200 truncate">{item.title}</div>
                  <div className="text-xs text-zinc-400">Variant #{item.variantId}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="line-through text-zinc-500 text-xs">${item.acknowledgedPrice.toFixed(2)}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                    <span className="font-semibold text-white">${item.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className={`text-[11px] font-medium ${isIncrease ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isIncrease ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onAcceptUpdatedPrices(conflicts)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Accept & Update Cart
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-sm transition-colors"
          >
            Review Cart
          </button>
        </div>
      </div>
    </div>
  );
}
