import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Type,
  Shapes,
  Sparkles,
  Loader2,
  Check,
  Plus,
  Palette,
  Maximize2,
  FolderOpen,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  GOOGLE_FONTS_CATALOG,
  loadGoogleFont,
  convertTextToImage,
  uploadTextAsImage,
  TextToImageOptions,
} from '@/utils/textToImage';
import {
  SHAPES_CATALOG,
  TYPOGRAPHY_BADGES,
  GraphicShape,
  TypographyBadge,
  uploadShapeAsImage,
} from '@/utils/iconToImage';

interface StudioToolsPanelProps {
  activePlacement: string;
  activePlacementLabel: string;
  onAddDesignFile: (file: any) => void;
  uploadedFiles: any[];
  designFiles: any[];
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

const COLOR_SWATCHES = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Loka Orange', hex: '#FF6D1F' },
  { name: 'Crimson', hex: '#EF4444' },
  { name: 'Gold', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Royal Blue', hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#EC4899' },
  { name: 'Silver', hex: '#9CA3AF' },
];

export const StudioToolsPanel: React.FC<StudioToolsPanelProps> = ({
  activePlacement,
  activePlacementLabel,
  onAddDesignFile,
  uploadedFiles,
  designFiles,
  onUploadFile,
  uploadingFile,
  fileInputRef,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'graphics'>('upload');

  // Text Studio State
  const [textContent, setTextContent] = useState('YOUR TEXT HERE');
  const [selectedFont, setSelectedFont] = useState('Bebas Neue');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [isCurved, setIsCurved] = useState(false);
  const [curveAngle, setCurveAngle] = useState(-50); // Arch up by default
  const [isUppercase, setIsUppercase] = useState(true);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [textPreviewUrl, setTextPreviewUrl] = useState<string>('');

  // Graphics & Shapes State
  const [selectedShapeCategory, setSelectedShapeCategory] = useState<'all' | 'shapes' | 'badges'>('all');
  const [shapeColor, setShapeColor] = useState('#FFFFFF');
  const [isAddingShape, setIsAddingShape] = useState<string | null>(null);

  // Active custom badge editing
  const [editingBadge, setEditingBadge] = useState<TypographyBadge | null>(null);
  const [badgeCustomText, setBadgeCustomText] = useState('');
  const [badgeColor, setBadgeColor] = useState('#FFFFFF');
  const [isAddingBadge, setIsAddingBadge] = useState(false);

  // Load selected font and generate live preview for text
  useEffect(() => {
    let isCancelled = false;
    loadGoogleFont(selectedFont);

    const updatePreview = async () => {
      if (!textContent.trim()) {
        setTextPreviewUrl('');
        return;
      }
      try {
        const blob = await convertTextToImage(textContent, {
          fontFamily: selectedFont,
          color: textColor,
          strokeColor: strokeWidth > 0 ? strokeColor : '',
          strokeWidth,
          curveAngle: isCurved ? curveAngle : 0,
          uppercase: isUppercase,
          fontSize: 60,
        });
        if (!isCancelled) {
          const url = URL.createObjectURL(blob);
          setTextPreviewUrl(url);
        }
      } catch (err) {
        console.warn('Text preview error:', err);
      }
    };

    const timer = setTimeout(updatePreview, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [textContent, selectedFont, textColor, strokeColor, strokeWidth, isCurved, curveAngle, isUppercase]);

  // Handle adding custom text to the active placement
  const handleApplyText = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsGeneratingText(true);
    try {
      const result = await uploadTextAsImage(textContent, {
        fontFamily: selectedFont,
        color: textColor,
        strokeColor: strokeWidth > 0 ? strokeColor : '',
        strokeWidth,
        curveAngle: isCurved ? curveAngle : 0,
        uppercase: isUppercase,
        fontSize: 80,
      });

      onAddDesignFile({
        id: result.id,
        file_url: result.url,
        thumbnail_url: result.url,
        preview_url: result.url,
        filename: result.filename,
      });

      toast.success(`Text added to ${activePlacementLabel}!`);
    } catch (err: any) {
      console.error('Failed to add text to product:', err);
      toast.error(err?.message || 'Failed to upload text graphic');
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Handle adding shape to the active placement
  const handleApplyShape = async (shape: GraphicShape) => {
    setIsAddingShape(shape.id);
    try {
      const result = await uploadShapeAsImage(shape, shapeColor);
      onAddDesignFile({
        id: result.id,
        file_url: result.url,
        thumbnail_url: result.url,
        preview_url: result.url,
        filename: result.filename,
      });
      toast.success(`${shape.name} added to ${activePlacementLabel}!`);
    } catch (err: any) {
      console.error('Failed to add shape:', err);
      toast.error(err?.message || 'Failed to add shape');
    } finally {
      setIsAddingShape(null);
    }
  };

  // Handle applying a customizable typography badge
  const handleApplyBadge = async () => {
    if (!editingBadge) return;
    const textToRender = badgeCustomText.trim() || editingBadge.defaultText;

    setIsAddingBadge(true);
    try {
      const result = await uploadTextAsImage(textToRender, {
        fontFamily: editingBadge.style === 'vintage' ? 'Permanent Marker' : 'Bebas Neue',
        color: badgeColor,
        strokeColor: '#000000',
        strokeWidth: 2,
        curveAngle: editingBadge.style === 'arch' ? -45 : 0,
        uppercase: true,
        fontSize: 70,
      });

      onAddDesignFile({
        id: result.id,
        file_url: result.url,
        thumbnail_url: result.url,
        preview_url: result.url,
        filename: result.filename,
      });

      setEditingBadge(null);
      toast.success(`Badge added to ${activePlacementLabel}!`);
    } catch (err: any) {
      console.error('Failed to apply badge:', err);
      toast.error(err?.message || 'Failed to add badge');
    } finally {
      setIsAddingBadge(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs matching Printify Studio (Uploads | Add Text | Graphics) */}
      <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-[#FF6D1F] text-white shadow-md shadow-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Uploads & Library</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-[#FF6D1F] text-white shadow-md shadow-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Add Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('graphics')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'graphics'
              ? 'bg-[#FF6D1F] text-white shadow-md shadow-orange-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shapes className="w-4 h-4" />
          <span>Graphics & Shapes</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: UPLOADS & ARTWORK LIBRARY
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'upload' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Upload Dropzone */}
          <div
            id="field-artwork"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
              isDragging
                ? 'border-[#FF6D1F] bg-[#FF6D1F]/20 scale-[1.01]'
                : 'border-[#8E5B37] bg-[#241A14] hover:bg-[#2C1F18]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={onUploadFile}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 flex items-center justify-center text-[#FF6D1F] flex-shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs sm:text-sm font-bold text-white">Upload New Artwork</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, SVG, JPG. Transparent PNG recommended</p>
            </div>
            {uploadingFile && (
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6D1F]" />
                <span>Uploading...</span>
              </div>
            )}
          </div>

          {/* Artwork Library */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Your Artwork Library ({uploadedFiles.length})</span>
                <span className="text-[11px] text-[#FF6D1F]">Click to place on {activePlacementLabel}</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[260px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent">
                {uploadedFiles.map((file) => {
                  const hasAssigned = designFiles.find(
                    (d) =>
                      d.placement === activePlacement &&
                      (d.file_id === file.id ||
                        d.url === (file.file_url || file.preview_url || file.thumbnail_url))
                  );
                  return (
                    <div
                      key={file.id}
                      onClick={() => onAddDesignFile(file)}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-black/60 ${
                        hasAssigned
                          ? 'border-[#FF6D1F] ring-2 ring-orange-500/50 shadow-md shadow-orange-500/30'
                          : 'border-white/10 hover:border-orange-500/50 hover:scale-[1.02]'
                      }`}
                      title="Click to place on product"
                    >
                      <img
                        src={file.thumbnail_url || file.file_url || file.preview_url}
                        alt="Artwork"
                        className="w-full h-full object-contain p-1.5 bg-gray-900"
                      />
                      {hasAssigned ? (
                        <div className="absolute top-1.5 right-1.5 bg-[#FF6D1F] text-white p-0.5 rounded-full shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: ADD TEXT & TYPOGRAPHY STUDIO (Google Fonts + Curved Text)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'text' && (
        <div className="space-y-4 p-4 bg-black/50 border border-white/10 rounded-2xl animate-fadeIn">
          {/* Text Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
              <label>Enter Custom Text:</label>
              <button
                type="button"
                onClick={() => setIsUppercase(!isUppercase)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                  isUppercase
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}
              >
                AA Uppercase
              </button>
            </div>
            <textarea
              rows={2}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type your design text here..."
              className="w-full bg-gray-900/90 border border-white/20 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF6D1F] resize-none"
            />
          </div>

          {/* Google Font Family Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-semibold block">
              Choose Google Font: ({selectedFont})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[140px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-orange-500/30">
              {GOOGLE_FONTS_CATALOG.map((font) => (
                <button
                  type="button"
                  key={font.name}
                  onClick={() => setSelectedFont(font.name)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedFont === font.name
                      ? 'border-[#FF6D1F] bg-orange-500/20 text-white ring-1 ring-orange-500/40'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold truncate" style={{ fontFamily: font.name }}>
                    {font.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{font.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Curved Text Controls (Screenshot 1 Feature) */}
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCurved}
                  onChange={(e) => setIsCurved(e.target.checked)}
                  className="rounded border-gray-600 text-[#FF6D1F] focus:ring-[#FF6D1F] cursor-pointer"
                />
                <span>Curved Text Effect</span>
              </label>
              {isCurved && (
                <span className="text-[11px] font-mono text-orange-400 font-bold">
                  {curveAngle < 0 ? `Arch Up (${Math.abs(curveAngle)}°)` : `Arch Down (${curveAngle}°)`}
                </span>
              )}
            </div>

            {isCurved && (
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Rainbow Arch</span>
                  <span>Flat</span>
                  <span>Smile Arch</span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={5}
                  value={curveAngle}
                  onChange={(e) => setCurveAngle(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6D1F]"
                />
              </div>
            )}
          </div>

          {/* Color Swatches & Stroke Outline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Font Color */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-orange-400" />
                Text Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    type="button"
                    key={swatch.hex}
                    onClick={() => setTextColor(swatch.hex)}
                    style={{ backgroundColor: swatch.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      textColor === swatch.hex
                        ? 'border-[#FF6D1F] scale-110 ring-2 ring-orange-500/40'
                        : 'border-white/30 hover:scale-105'
                    }`}
                    title={swatch.name}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Outline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
                <label>Outline Stroke:</label>
                <span className="text-[11px] font-mono text-gray-400">{strokeWidth}px</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6D1F]"
                />
                {strokeWidth > 0 && (
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-6 h-6 rounded-md bg-transparent border-0 cursor-pointer p-0"
                    title="Outline Color"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          {textPreviewUrl && (
            <div className="p-3 bg-gray-950/80 rounded-xl border border-white/10 flex flex-col items-center justify-center min-h-[90px]">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Live Preview</span>
              <img
                src={textPreviewUrl}
                alt="Text preview"
                className="max-h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              />
            </div>
          )}

          {/* Action Button: Direct Printify Upload & Placement */}
          <button
            type="button"
            onClick={handleApplyText}
            disabled={isGeneratingText || !textContent.trim()}
            className="w-full py-3 bg-[#FF6D1F] hover:bg-[#FF7A1A] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGeneratingText ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading to Printify...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Add Text to {activePlacementLabel}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: GRAPHICS & SHAPES (Screenshot 2 Feature)
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'graphics' && (
        <div className="space-y-4 p-4 bg-black/50 border border-white/10 rounded-2xl animate-fadeIn">
          {/* Sub-Category Filter */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedShapeCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedShapeCategory === 'all'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              All Assets
            </button>
            <button
              type="button"
              onClick={() => setSelectedShapeCategory('badges')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedShapeCategory === 'badges'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Typography Badges
            </button>
            <button
              type="button"
              onClick={() => setSelectedShapeCategory('shapes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedShapeCategory === 'shapes'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Shapes & Symbols
            </button>
          </div>

          {/* Section 1: Personalizable Typography Badges (Screenshot 2: R.I.P TWENTIES, MAMA DUDE, etc.) */}
          {(selectedShapeCategory === 'all' || selectedShapeCategory === 'badges') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
                <span>Personalizable Text & Badges (Embroidery & Print Ready)</span>
                <span className="text-[11px] text-[#FF6D1F]">Click to edit & place</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {TYPOGRAPHY_BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => {
                      setEditingBadge(badge);
                      setBadgeCustomText(badge.defaultText);
                    }}
                    className="p-3 rounded-xl border border-white/15 bg-gray-900/80 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center aspect-square shadow"
                  >
                    <span className="text-white font-extrabold text-xs whitespace-pre-line font-mono tracking-tight leading-tight">
                      {badge.title}
                    </span>
                    {badge.subtext && (
                      <span className="text-[10px] text-gray-400 mt-1">{badge.subtext}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badge Customizer Modal / Drawer */}
          {editingBadge && (
            <div className="p-3.5 bg-gray-900 border-2 border-orange-500/60 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Customize Badge: {editingBadge.title}</span>
                <button
                  type="button"
                  onClick={() => setEditingBadge(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <textarea
                rows={3}
                value={badgeCustomText}
                onChange={(e) => setBadgeCustomText(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-xl p-2.5 text-white text-xs font-mono resize-none focus:outline-none focus:border-orange-500"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Color:</span>
                  {COLOR_SWATCHES.slice(0, 6).map((swatch) => (
                    <button
                      type="button"
                      key={swatch.hex}
                      onClick={() => setBadgeColor(swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-5 h-5 rounded-full border ${
                        badgeColor === swatch.hex ? 'border-orange-500 scale-110' : 'border-white/30'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyBadge}
                  disabled={isAddingBadge}
                  className="px-4 py-2 bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAddingBadge ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Place Badge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Shapes & Symbols */}
          {(selectedShapeCategory === 'all' || selectedShapeCategory === 'shapes') && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-300 font-semibold">
                <span>Shapes & Symbols</span>
                {/* Shape Color Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Color:</span>
                  {COLOR_SWATCHES.slice(0, 6).map((swatch) => (
                    <button
                      type="button"
                      key={swatch.hex}
                      onClick={() => setShapeColor(swatch.hex)}
                      style={{ backgroundColor: swatch.hex }}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        shapeColor === swatch.hex
                          ? 'border-orange-500 scale-110 ring-1 ring-orange-500/40'
                          : 'border-white/30'
                      }`}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {SHAPES_CATALOG.map((shape) => (
                  <button
                    type="button"
                    key={shape.id}
                    onClick={() => handleApplyShape(shape)}
                    disabled={isAddingShape === shape.id}
                    className="p-3 rounded-xl border border-white/10 bg-gray-900/60 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 aspect-square group disabled:opacity-50"
                  >
                    {isAddingShape === shape.id ? (
                      <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                    ) : (
                      <svg
                        viewBox={shape.viewBox || '0 0 24 24'}
                        className="w-7 h-7 transition-transform group-hover:scale-110"
                        style={{ fill: shapeColor }}
                      >
                        <path d={shape.path} />
                      </svg>
                    )}
                    <span className="text-[10px] text-gray-400 group-hover:text-white truncate max-w-full">
                      {shape.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioToolsPanel;
