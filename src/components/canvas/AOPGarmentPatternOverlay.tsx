import React, { useMemo } from 'react';
import { DesignFile } from './types';
import { Eye, Scissors, Layers, Check } from 'lucide-react';

interface AOPGarmentPatternOverlayProps {
  activePlacement: string;
  productTitle?: string;
  productType?: string;
  printAreaWidth: number;
  printAreaHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  designFiles?: DesignFile[];
  isAllAreasView?: boolean;
  onSelectPlacement?: (placement: string) => void;
}

export const AOPGarmentPatternOverlay: React.FC<AOPGarmentPatternOverlayProps> = ({
  activePlacement,
  productTitle = '',
  productType = '',
  canvasWidth,
  canvasHeight,
  designFiles = [],
  isAllAreasView = false,
  onSelectPlacement,
}) => {
  const normalizedPlacement = (activePlacement || '').toLowerCase().replace(/[\s-]/g, '_');

  // Detect if current product is Joggers, Sweatpants, Leggings, or Pants
  const isJoggersOrPants = useMemo(() => {
    const searchStr = `${productTitle} ${productType} ${activePlacement}`.toLowerCase();
    return (
      searchStr.includes('jogger') ||
      searchStr.includes('pant') ||
      searchStr.includes('sweatpant') ||
      searchStr.includes('trouser') ||
      searchStr.includes('legging') ||
      searchStr.includes('leg') ||
      searchStr.includes('waistband')
    );
  }, [productTitle, productType, activePlacement]);

  // Detect if current product is AOP Hoodie or T-Shirt
  const isAOPApparel = useMemo(() => {
    const searchStr = `${productTitle} ${productType}`.toLowerCase();
    return (
      (searchStr.includes('aop') || searchStr.includes('all-over') || searchStr.includes('all over')) &&
      (searchStr.includes('hoodie') || searchStr.includes('shirt') || searchStr.includes('tee') || searchStr.includes('crewneck') || searchStr.includes('sweater'))
    );
  }, [productTitle, productType]);

  if (!isJoggersOrPants && !isAOPApparel) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. ALL AREAS MULTI-PIECE CUTTING OVERVIEW (Printify Blueprint Style)
  // ═══════════════════════════════════════════════════════════════
  if (isAllAreasView && isJoggersOrPants) {
    const leftLegDesign = designFiles.find((d) => d.placement.includes('left_leg') || d.placement.includes('left leg'));
    const rightLegDesign = designFiles.find((d) => d.placement.includes('right_leg') || d.placement.includes('right leg'));
    const pocketDesign = designFiles.find((d) => d.placement.includes('pocket'));
    const waistbandDesign = designFiles.find((d) => d.placement.includes('waistband'));

    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3.5 bg-gray-950/95 backdrop-blur-md select-none rounded-2xl border-2 border-orange-500/30 shadow-2xl animate-in fade-in duration-200">
        {/* Header Ribbon */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[#FF6D1F]">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <div className="text-left">
              <span className="text-xs font-bold text-white tracking-wide block">
                All Areas Garment Cutting Layout
              </span>
              <span className="text-[10px] text-gray-400">
                Click any pattern piece below to edit artwork
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Scissors className="w-3 h-3 text-orange-400" /> Printify Cut & Sew Pattern
          </span>
        </div>

        {/* Both Legs side-by-side in real proportion */}
        <div className="flex-1 w-full flex items-center justify-center gap-4 sm:gap-6 py-2">
          {/* Left Leg Pattern Card */}
          <div
            onClick={() => onSelectPlacement && onSelectPlacement('left_leg')}
            className={`group relative w-[42%] h-[92%] border-2 border-dashed rounded-t-[32px] rounded-b-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all flex flex-col items-center justify-between p-2.5 overflow-hidden shadow-xl ${
              onSelectPlacement ? 'cursor-pointer hover:border-orange-500 hover:scale-[1.02]' : ''
            } border-gray-400/70`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-200 bg-black/80 border border-white/20 px-2.5 py-0.5 rounded-full shadow">
                Left Leg
              </span>
              {leftLegDesign && (
                <span className="text-[9px] font-bold text-green-400 bg-green-500/20 border border-green-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Placed
                </span>
              )}
            </div>

            {/* Pattern Silhouette & Design */}
            <div className="relative w-full flex-1 flex items-center justify-center my-1">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
                <path
                  d="M 12 5 Q 50 8 88 5 L 94 32 Q 88 65 72 95 L 32 95 Q 18 65 8 35 Z"
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#FF6D1F"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
              </svg>
              {leftLegDesign?.url ? (
                <img
                  src={leftLegDesign.url.replace(/%25/g, '%')}
                  alt="Left Leg Artwork"
                  className="max-h-28 max-w-[85%] object-contain z-10 drop-shadow-lg transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="text-[10px] text-gray-500 font-medium text-center z-10">
                  No artwork
                </span>
              )}
            </div>

            {/* Bottom Cuff Label */}
            <div className="w-full flex items-center justify-between text-[8px] text-gray-400 font-mono border-t border-white/10 pt-1">
              <span>Ankle Cuff</span>
              <span className="text-orange-400/80 group-hover:text-orange-400 font-semibold">
                Click to edit →
              </span>
            </div>
          </div>

          {/* Right Leg Pattern Card */}
          <div
            onClick={() => onSelectPlacement && onSelectPlacement('right_leg')}
            className={`group relative w-[42%] h-[92%] border-2 border-dashed rounded-t-[32px] rounded-b-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all flex flex-col items-center justify-between p-2.5 overflow-hidden shadow-xl ${
              onSelectPlacement ? 'cursor-pointer hover:border-orange-500 hover:scale-[1.02]' : ''
            } border-gray-400/70`}
          >
            {/* Top Label */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-200 bg-black/80 border border-white/20 px-2.5 py-0.5 rounded-full shadow">
                Right Leg
              </span>
              {rightLegDesign && (
                <span className="text-[9px] font-bold text-green-400 bg-green-500/20 border border-green-500/40 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Placed
                </span>
              )}
            </div>

            {/* Pattern Silhouette & Design */}
            <div className="relative w-full flex-1 flex items-center justify-center my-1">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
                <path
                  d="M 88 5 Q 50 8 12 5 L 6 32 Q 12 65 28 95 L 68 95 Q 82 65 92 35 Z"
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#FF6D1F"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
              </svg>
              {rightLegDesign?.url ? (
                <img
                  src={rightLegDesign.url.replace(/%25/g, '%')}
                  alt="Right Leg Artwork"
                  className="max-h-28 max-w-[85%] object-contain z-10 drop-shadow-lg transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="text-[10px] text-gray-500 font-medium text-center z-10">
                  No artwork
                </span>
              )}
            </div>

            {/* Bottom Cuff Label */}
            <div className="w-full flex items-center justify-between text-[8px] text-gray-400 font-mono border-t border-white/10 pt-1">
              <span>Ankle Cuff</span>
              <span className="text-orange-400/80 group-hover:text-orange-400 font-semibold">
                Click to edit →
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Pieces: Pocket & Waistband */}
        <div className="w-full flex items-center justify-center gap-4 pt-1.5 border-t border-white/10">
          {/* Pocket piece */}
          <div
            onClick={() => onSelectPlacement && onSelectPlacement('pocket')}
            className={`group w-36 h-12 border border-dashed border-gray-400/70 hover:border-orange-500 rounded-b-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between px-2.5 relative transition-all ${
              onSelectPlacement ? 'cursor-pointer hover:scale-[1.03]' : ''
            }`}
          >
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase text-gray-200">Pocket</span>
              <span className="text-[7px] text-gray-500">Pouch Hem</span>
            </div>
            {pocketDesign?.url ? (
              <img
                src={pocketDesign.url.replace(/%25/g, '%')}
                alt="Pocket"
                className="max-h-8 max-w-[40%] object-contain"
              />
            ) : (
              <span className="text-[8px] text-gray-500">Empty</span>
            )}
          </div>

          {/* Waistband piece */}
          <div
            onClick={() => onSelectPlacement && onSelectPlacement('waistband')}
            className={`group w-48 h-12 border border-dashed border-gray-400/70 hover:border-orange-500 rounded bg-white/[0.04] hover:bg-white/[0.08] flex flex-col items-center justify-between p-1 relative transition-all ${
              onSelectPlacement ? 'cursor-pointer hover:scale-[1.03]' : ''
            }`}
          >
            <div className="w-full h-[1px] border-b border-dashed border-orange-500/50 absolute top-1/2 left-0" />
            <div className="w-full flex items-center justify-between z-10 px-1">
              <span className="text-[9px] font-extrabold uppercase text-gray-200 bg-black/80 px-1.5 py-0.2 rounded">
                Waistband
              </span>
              <span className="text-[7px] font-mono text-orange-400 bg-orange-500/20 px-1 rounded">
                Center Fold
              </span>
            </div>
            {waistbandDesign?.url ? (
              <img
                src={waistbandDesign.url.replace(/%25/g, '%')}
                alt="Waistband"
                className="max-h-5 max-w-[80%] object-contain z-10"
              />
            ) : (
              <span className="text-[7px] text-gray-500 z-10">Elastic Belt Band</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. ATHLETIC JOGGERS CUTTING PATTERNS (Individual pieces)
  // ═══════════════════════════════════════════════════════════════

  // 2A. LEFT LEG PATTERN PIECE
  if (normalizedPlacement.includes('left_leg') || (isJoggersOrPants && normalizedPlacement.includes('left'))) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
        >
          {/* Garment Fabric Piece Base Cutline */}
          <path
            d="M 12 5 Q 50 8 88 5 L 94 32 Q 88 65 72 95 L 32 95 Q 18 65 8 35 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          {/* Inner Seam Allowance / Safe Bleed Line */}
          <path
            d="M 17 9 Q 50 11 83 9 L 88 33 Q 82 64 68 91 L 36 91 Q 23 64 14 36 Z"
            fill="none"
            stroke="#FF6D1F"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            opacity="0.6"
          />
        </svg>

        {/* Top Waist Seam Header */}
        <div className="absolute top-2 left-0 right-0 flex justify-center items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase bg-black/80 border border-orange-500/30 px-2.5 py-0.5 rounded-full shadow">
            WAIST SEAM (ATTACH TO BAND)
          </span>
        </div>

        {/* Inseam & Outseam Technical Annotation Badges */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 -rotate-90 origin-left">
          <span className="text-[8px] font-mono tracking-widest text-gray-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase">
            OUTSEAM (POCKET SIDE)
          </span>
        </div>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 origin-right">
          <span className="text-[8px] font-mono tracking-widest text-gray-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase">
            INSEAM / CROTCH SEAM
          </span>
        </div>

        {/* Bottom Ankle Cuff Hem */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest text-gray-300 uppercase bg-black/80 border border-white/20 px-2.5 py-0.5 rounded-full shadow">
            ANKLE CUFF (BOTTOM HEM)
          </span>
        </div>
      </div>
    );
  }

  // 2B. RIGHT LEG PATTERN PIECE (Mirrored)
  if (normalizedPlacement.includes('right_leg') || (isJoggersOrPants && normalizedPlacement.includes('right'))) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
        >
          {/* Garment Fabric Piece Base Cutline (Mirrored) */}
          <path
            d="M 88 5 Q 50 8 12 5 L 6 32 Q 12 65 28 95 L 68 95 Q 82 65 92 35 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          {/* Inner Seam Allowance / Safe Bleed Line */}
          <path
            d="M 83 9 Q 50 11 17 9 L 12 33 Q 18 64 32 91 L 64 91 Q 77 64 86 36 Z"
            fill="none"
            stroke="#FF6D1F"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            opacity="0.6"
          />
        </svg>

        {/* Top Waist Seam Header */}
        <div className="absolute top-2 left-0 right-0 flex justify-center items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase bg-black/80 border border-orange-500/30 px-2.5 py-0.5 rounded-full shadow">
            WAIST SEAM (ATTACH TO BAND)
          </span>
        </div>

        {/* Inseam & Outseam Technical Annotation Badges */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 -rotate-90 origin-left">
          <span className="text-[8px] font-mono tracking-widest text-gray-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase">
            INSEAM / CROTCH SEAM
          </span>
        </div>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 origin-right">
          <span className="text-[8px] font-mono tracking-widest text-gray-400 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase">
            OUTSEAM (POCKET SIDE)
          </span>
        </div>

        {/* Bottom Ankle Cuff Hem */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-1.5">
          <span className="text-[9px] font-bold tracking-widest text-gray-300 uppercase bg-black/80 border border-white/20 px-2.5 py-0.5 rounded-full shadow">
            ANKLE CUFF (BOTTOM HEM)
          </span>
        </div>
      </div>
    );
  }

  // 2C. WAISTBAND PATTERN STRIP
  if (normalizedPlacement.includes('waistband')) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Outer Cutting Edge */}
          <rect
            x="2"
            y="6"
            width="96"
            height="88"
            rx="2"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          {/* Center Fold Line (Fold over waistband elastic) */}
          <line
            x1="2"
            y1="50"
            x2="98"
            y2="50"
            stroke="#FF6D1F"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* Seam margins */}
          <rect
            x="4"
            y="12"
            width="92"
            height="76"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
            opacity="0.25"
          />
        </svg>

        {/* Center Fold Line Badges */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <span className="text-[8px] font-bold uppercase tracking-wider text-orange-400/90 bg-black/80 px-2 py-0.5 rounded border border-orange-500/30">
            --- FRONT (VISIBLE) ---
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-400 bg-black/90 px-3 py-1 rounded-full border border-orange-500/40 shadow">
            CENTER FOLD LINE
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wider text-orange-400/90 bg-black/80 px-2 py-0.5 rounded border border-orange-500/30">
            --- INSIDE (ELASTIC) ---
          </span>
        </div>
      </div>
    );
  }

  // 2D. POCKET POUCH PATTERN PIECE
  if (normalizedPlacement.includes('pocket')) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Pocket curved pouch cutting path */}
          <path
            d="M 10 10 L 90 10 L 90 60 Q 90 90 60 90 L 40 90 Q 10 90 10 60 Z"
            fill="rgba(255, 255, 255, 0.04)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />

          {/* Pocket opening seam stitch */}
          <line
            x1="12"
            y1="22"
            x2="88"
            y2="22"
            stroke="#FF6D1F"
            strokeWidth="0.7"
            strokeDasharray="1.5 1.5"
            opacity="0.6"
          />
        </svg>

        <div className="absolute top-3 left-0 right-0 text-center">
          <span className="text-[9px] font-bold text-orange-400 uppercase bg-black/80 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
            POCKET TOP OPENING (SLIT)
          </span>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <span className="text-[8px] font-mono text-gray-400 uppercase bg-black/60 px-2 py-0.5 rounded">
            POUCH BOTTOM HEM
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. AOP HOODIE & T-SHIRT PATTERN PIECES (Cut-and-Sew Outlines)
  // ═══════════════════════════════════════════════════════════════

  // 3A. FRONT TORSO
  if (normalizedPlacement === 'front') {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* T-Shirt/Hoodie Front Cut Pattern */}
          <path
            d="M 32 6 Q 50 18 68 6 L 82 12 L 76 32 Q 72 38 68 40 L 70 94 L 30 94 L 32 40 Q 28 38 24 32 L 18 12 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />
          {/* Safe bleed line */}
          <path
            d="M 35 11 Q 50 20 65 11 L 76 16 L 72 32 Q 68 37 65 39 L 67 90 L 33 90 L 35 39 Q 32 37 28 32 L 24 16 Z"
            fill="none"
            stroke="#FF6D1F"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute top-2 left-0 right-0 text-center">
          <span className="text-[8px] font-mono text-gray-400 uppercase bg-black/60 px-2 py-0.5 rounded">
            COLLAR / NECKLINE
          </span>
        </div>
      </div>
    );
  }

  // 3B. BACK TORSO
  if (normalizedPlacement === 'back') {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* T-Shirt/Hoodie Back Cut Pattern (shallower neck) */}
          <path
            d="M 32 8 Q 50 12 68 8 L 82 12 L 76 32 Q 72 38 68 40 L 70 94 L 30 94 L 32 40 Q 28 38 24 32 L 18 12 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />
          <path
            d="M 35 11 Q 50 15 65 11 L 76 16 L 72 32 Q 68 37 65 39 L 67 90 L 33 90 L 35 39 Q 32 37 28 32 L 24 16 Z"
            fill="none"
            stroke="#FF6D1F"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute top-2 left-0 right-0 text-center">
          <span className="text-[8px] font-mono text-gray-400 uppercase bg-black/60 px-2 py-0.5 rounded">
            BACK COLLAR SEAM
          </span>
        </div>
      </div>
    );
  }

  // 3C. SLEEVES
  if (normalizedPlacement.includes('sleeve') || normalizedPlacement.includes('left') || normalizedPlacement.includes('right')) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Sleeve Cap & Taper */}
          <path
            d="M 12 40 Q 50 6 88 40 L 76 92 L 24 92 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
          />
          <path
            d="M 16 42 Q 50 12 84 42 L 73 88 L 27 88 Z"
            fill="none"
            stroke="#FF6D1F"
            strokeWidth="0.6"
            strokeDasharray="1.5 1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute top-3 left-0 right-0 text-center">
          <span className="text-[8px] font-mono text-gray-400 uppercase bg-black/60 px-2 py-0.5 rounded">
            SHOULDER / SLEEVE CAP
          </span>
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[8px] font-mono text-gray-400 uppercase bg-black/60 px-2 py-0.5 rounded">
            WRIST CUFF HEM
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default AOPGarmentPatternOverlay;
