import React, { useEffect, useState, useRef, useMemo } from "react";
import { Rnd } from "react-rnd";
import {
  Zap,
  X,
  CheckCircle,
  Smartphone,
  Maximize2,
  Trash2,
  Sparkles,
  Minus,
  Plus,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Move,
} from "lucide-react";
import toast from "react-hot-toast";
import { DesignFile, PrintFile, AspectRatioIssue } from "./types";
import { getCanvasDimensions, applyQuickPosition } from "./utils";
import { aspectRatioValidation } from "@/utils/aspectRatioValidation";
import AspectRatioFixButton from "./AspectRatioFixButton";
import {
  FrontSVG,
  BackSVG,
  LeftSleeveSVG,
  RightSleeveSVG,
  CollarSVG,
} from "./PlacementSVGs";

interface DesignCanvasTabProps {
  designFiles: DesignFile[];
  setDesignFiles: React.Dispatch<React.SetStateAction<DesignFile[]>>;
  activePlacement: string;
  selectedPlacements: string[];
  setSelectedPlacements: React.Dispatch<React.SetStateAction<string[]>>;
  setActivePlacement: (placement: string) => void;
  selectedDesignFile: DesignFile | null;
  setSelectedDesignFile: (file: DesignFile | null) => void;
  activePrintFile: PrintFile | null;
  updateDesignPosition: (designId: number, updates: any) => void;
  onAspectRatioIssues: (issues: AspectRatioIssue[]) => void;
  aspectRatioIssues: AspectRatioIssue[];
  hidePlacementTabs?: boolean;
  productTitle?: string;
  productType?: string;
  onRemoveDesign?: (placement: string) => void;
  onRemoveBackground?: () => void;
  isRemovingBackground?: boolean;
}

const DesignCanvasTab: React.FC<DesignCanvasTabProps> = ({
  designFiles,
  setDesignFiles,
  activePlacement,
  selectedPlacements,
  setSelectedPlacements,
  setActivePlacement,
  selectedDesignFile,
  setSelectedDesignFile,
  activePrintFile,
  updateDesignPosition,
  onAspectRatioIssues,
  aspectRatioIssues,
  hidePlacementTabs = true,
  productTitle = "",
  productType = "",
  onRemoveDesign,
  onRemoveBackground,
  isRemovingBackground = false,
}) => {
  const [allValidationResults, setAllValidationResults] = React.useState<AspectRatioIssue[]>([]);
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const canvasDims = getCanvasDimensions(activePrintFile, 620, 380);
  const printAreaWidth = activePrintFile?.width || canvasDims.printWidth || 0;
  const printAreaHeight = activePrintFile?.height || canvasDims.printHeight || 0;

  // Active design for current placement
  const activeDesign = useMemo(() => {
    if (selectedDesignFile && selectedDesignFile.placement === activePlacement) {
      return selectedDesignFile;
    }
    return designFiles.find((d) => d.placement === activePlacement) || null;
  }, [selectedDesignFile, designFiles, activePlacement]);

  // Keep selectedDesignFile in sync when activeDesign exists but selectedDesignFile is null
  useEffect(() => {
    if (activeDesign && (!selectedDesignFile || selectedDesignFile.placement !== activePlacement)) {
      setSelectedDesignFile(activeDesign);
    }
  }, [activeDesign, selectedDesignFile, activePlacement, setSelectedDesignFile]);

  // Listen for window resize to update orientation
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Re-measure container width on render
  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      if (w !== containerWidth) {
        setContainerWidth(w);
      }
    }
  });

  // Calculate dynamic scale to fit the canvas in its actual container
  const calculateMobileScale = () => {
    const availableWidth = containerWidth > 0 ? containerWidth - 16 : windowWidth - 32;
    if (availableWidth >= canvasDims.width) return 1;
    const scale = availableWidth / canvasDims.width;
    return Math.max(scale, 0.25);
  };

  const scale = calculateMobileScale();

  // Check if canvas is too wide for portrait mode (only on very small mobile screens)
  const shouldShowRotatePrompt = () => {
    if (windowWidth >= 640 || typeof window === "undefined") return false;
    return canvasDims.width > windowWidth * 0.95 && canvasDims.aspectRatio > 2.5;
  };

  // Check if this product is genuinely a book/journal wrap
  const isBookOrJournal = useMemo(() => {
    const searchString = `${productTitle || ""} ${productType || ""}`.toLowerCase();
    const isApparel = /\b(hoodie|sweatshirt|shirt|tee|t-shirt|apparel|pullover|jacket|tank|top|sweater|fleece|jogger|pant|pants|sock|socks|hat|cap|beanie)\b/i.test(searchString);
    if (isApparel) return false;
    const isBookProduct = /\b(journal|notebook|hardcover|spiral|planner|diary)\b/i.test(searchString);
    const isCoverPlacement = activePlacement === "front_cover" || activePlacement === "back_cover" || activePlacement === "full_wrap";
    return isBookProduct && isCoverPlacement;
  }, [productTitle, productType, activePlacement]);

  const showBookGuides = useMemo(() => {
    return (
      isBookOrJournal &&
      (activePlacement === "front_cover" ||
        activePlacement === "back_cover" ||
        activePlacement === "full_wrap")
    );
  }, [isBookOrJournal, activePlacement]);

  // Design scale factors for canvas (strictly preserving aspect ratio)
  const canvasWidth = canvasDims.width;
  const canvasHeight = canvasDims.height;
  const designScale = activePrintFile && activePrintFile.width > 0
    ? canvasWidth / activePrintFile.width
    : 0.5;

  // Calculate natural aspect ratio and max fit size of the active design
  const { currentScalePercent, maxFitWidth, maxFitHeight } = useMemo(() => {
    if (!activeDesign || !printAreaWidth || !printAreaHeight) {
      return { currentScalePercent: 70, maxFitWidth: 1000, maxFitHeight: 1000 };
    }
    const dWidth = activeDesign.position.width || 100;
    const dHeight = activeDesign.position.height || 100;

    // If design fills the print area width and height (or either is 100%), scale is 100%
    if (dWidth >= printAreaWidth && dHeight >= printAreaHeight) {
      return { currentScalePercent: 100, maxFitWidth: printAreaWidth, maxFitHeight: printAreaHeight };
    }

    const designRatio = dWidth / dHeight;

    const fitW = (printAreaWidth / printAreaHeight > designRatio)
      ? printAreaHeight * designRatio
      : printAreaWidth;
    const fitH = fitW / designRatio;

    const pct = Math.min(100, Math.max(10, Math.round((dWidth / fitW) * 100)));
    return { currentScalePercent: pct, maxFitWidth: fitW, maxFitHeight: fitH };
  }, [activeDesign, printAreaWidth, printAreaHeight]);

  // Handle scale change from slider or preset buttons
  const handleScaleChange = (targetPercent: number) => {
    if (!activeDesign || !activePrintFile) return;

    if (targetPercent >= 100) {
      handleQuickAlign("fit");
      return;
    }

    applyQuickPosition(
      "scale",
      activeDesign,
      activePrintFile,
      (updatedDesign) => {
        updateDesignPosition(activeDesign.id, {
          width: updatedDesign.position.width,
          height: updatedDesign.position.height,
          left: updatedDesign.position.left,
          top: updatedDesign.position.top,
        });
        setSelectedDesignFile(updatedDesign);
      },
      targetPercent / 100
    );
  };

  // Handle quick alignment (Center, Top, Bottom, Left, Right, Fit)
  const handleQuickAlign = (alignType: string) => {
    if (!activeDesign || !activePrintFile) return;

    applyQuickPosition(
      alignType,
      activeDesign,
      activePrintFile,
      (updatedDesign) => {
        updateDesignPosition(activeDesign.id, {
          width: updatedDesign.position.width,
          height: updatedDesign.position.height,
          left: updatedDesign.position.left,
          top: updatedDesign.position.top,
        });
        setSelectedDesignFile(updatedDesign);
      }
    );
  };

  const getPlacementIcon = (placement: string) => {
    const svgMap: Record<string, React.ReactNode> = {
      front: <FrontSVG className="w-4 h-4" />,
      back: <BackSVG className="w-4 h-4" />,
      left: <LeftSleeveSVG className="w-4 h-4" />,
      right: <RightSleeveSVG className="w-4 h-4" />,
      sleeve_left: <LeftSleeveSVG className="w-4 h-4" />,
      sleeve_right: <RightSleeveSVG className="w-4 h-4" />,
      collar: <CollarSVG className="w-4 h-4" />,
      chest_left: <FrontSVG className="w-4 h-4" />,
      chest_right: <FrontSVG className="w-4 h-4" />,
      label: <FrontSVG className="w-4 h-4" />,
      pocket: <FrontSVG className="w-4 h-4" />,
      default: <FrontSVG className="w-4 h-4" />,
    };

    return svgMap[placement.toLowerCase()] || svgMap.default;
  };

  const lastValidatedSigRef = useRef<string>("");

  useEffect(() => {
    const allDesignsWithUrl = designFiles.filter((design) => design.url);

    const currentSignature = allDesignsWithUrl
      .map((d) => `${d.id}_${d.position.width}_${d.position.height}_${d.url}`)
      .join("|");

    if (currentSignature === lastValidatedSigRef.current) {
      return;
    }
    lastValidatedSigRef.current = currentSignature;

    if (allDesignsWithUrl.length === 0) {
      onAspectRatioIssues([]);
      setAllValidationResults([]);
      return;
    }

    const validationPromises = allDesignsWithUrl.map((design) =>
      aspectRatioValidation(
        design.url,
        design.position.width,
        design.position.height,
        5.0
      )
        .then(({ isValid, percentDifference }) => {
          return {
            designId: design.id,
            placement: design.placement,
            message: `✅ GOOD: ${design.placement} - Aspect ratio compliant (${percentDifference.toFixed(1)}%)`,
          };
        })
        .catch((err) => {
          console.error("Aspect ratio validation error for", design.url, ":", err);
          return null;
        })
    );

    Promise.all(validationPromises).then((results) => {
      const allResults = results.filter((r) => r !== null) as AspectRatioIssue[];
      onAspectRatioIssues([]);
      setAllValidationResults(allResults);
    });
  }, [designFiles, onAspectRatioIssues]);

  const handleRemoveDesign = (design: DesignFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (onRemoveDesign) {
      onRemoveDesign(design.placement);
      return;
    }

    setDesignFiles((prev: DesignFile[]) =>
      prev.filter((df: DesignFile) => df.id !== design.id)
    );

    setSelectedPlacements((prevPlacements) =>
      prevPlacements.filter((p) => p !== design.placement)
    );

    if (activePlacement === design.placement) {
      const remainingPlacements = selectedPlacements.filter(
        (p) => p !== design.placement
      );
      if (remainingPlacements.length > 0) {
        setActivePlacement(remainingPlacements[0]);
      } else {
        setActivePlacement("");
        setSelectedDesignFile(null);
      }
    }

    toast.success(`Removed design from ${design.placement}`);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-full space-y-4">
        {/* Optional placement tabs (if not hidden) */}
        {!hidePlacementTabs && selectedPlacements.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {selectedPlacements.map((placement) => (
              <button
                type="button"
                key={placement}
                onClick={() => setActivePlacement(placement)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all text-xs sm:text-sm flex items-center gap-2 bg-gray-800 text-gray-300 ${
                  activePlacement === placement
                    ? "border-2 border-orange-500 text-white bg-orange-500/20"
                    : "border border-gray-700 hover:border-gray-600"
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  {getPlacementIcon(placement)}
                </span>
                <span className="capitalize">{placement.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
        )}

        {/* Rotate phone prompt for extreme aspect ratios on tiny screens */}
        {shouldShowRotatePrompt() ? (
          <div className="flex flex-col w-full h-80 justify-center items-center gap-4 p-6 bg-gray-900/40 rounded-2xl border border-white/10 text-center">
            <div className="w-20 h-20 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center shadow-inner">
              <Smartphone className="w-10 h-10 text-orange-400 animate-pulse" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white">Rotate Your Phone</h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xs">
              This print area is panoramic ({printAreaWidth} × {printAreaHeight}px). Landscape mode provides the best editing view.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="w-full flex flex-col items-center">
            {/* Outer wrapper sized to scaled canvas dimensions */}
            {(() => {
              const scaledW = Math.round(canvasDims.width * scale);
              const scaledH = Math.round(canvasDims.height * scale);

              return (
                <div
                  style={{
                    width: `${scaledW}px`,
                    height: `${scaledH}px`,
                    position: "relative",
                    margin: "0 auto",
                  }}
                  className="transition-all duration-200"
                >
                  {/* Studio Canvas Box */}
                  <div
                    className="rounded-2xl relative overflow-hidden select-none border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
                    style={{
                      width: `${canvasDims.width}px`,
                      height: `${canvasDims.height}px`,
                      background:
                        "radial-gradient(circle at center, #161b26 0%, #0d1117 100%)",
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  >
                    {/* Subtle Blueprint Studio Grid */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
                        `,
                        backgroundSize: "24px 24px",
                      }}
                    />

                    {/* Subtle Center Crosshair Guidelines */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-[1px] border-b border-dashed border-white/10" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="h-full w-[1px] border-r border-dashed border-white/10" />
                    </div>

                    {/* Safe Area Inner Boundary (5% inset) */}
                    <div className="absolute inset-[4%] border border-dashed border-white/10 rounded-xl pointer-events-none">
                      <span className="absolute bottom-1 right-2 text-[9px] uppercase tracking-widest text-white/20 font-mono select-none">
                        Safe Zone
                      </span>
                    </div>

                    {/* Empty Canvas Placeholder */}
                    {designFiles.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="text-center text-gray-400">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/10">
                            <Crosshair className="w-7 h-7 text-[#FF6D1F]" />
                          </div>
                          <p className="text-sm font-semibold text-white">
                            Print Area Canvas
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Select artwork above to place on this placement
                          </p>
                          <p className="text-[11px] text-orange-400/80 mt-1 font-mono">
                            {printAreaWidth} × {printAreaHeight} px
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Visual Template Guides (ONLY for actual journals/books/notebooks) */}
                    {showBookGuides && (
                      <div className="absolute inset-0 pointer-events-none select-none z-0">
                        {/* Left Half: BACK COVER */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 w-[47%] border-r border-dashed transition-all ${
                            activePlacement === "back_cover"
                              ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                              : "border-white/20 bg-white/[0.02]"
                          }`}
                        >
                          <div className="p-3">
                            <span
                              className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded ${
                                activePlacement === "back_cover"
                                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/40"
                                  : "bg-white/10 text-gray-400"
                              }`}
                            >
                              Back Cover
                            </span>
                          </div>

                          <div className="absolute bottom-2 right-2 w-12 h-7 border border-white/20 bg-black/60 rounded flex flex-col items-center justify-center p-0.5 opacity-60">
                            <div className="text-[7px] text-gray-400 font-mono tracking-tighter">|||||||||</div>
                            <span className="text-[6px] text-gray-400">Barcode</span>
                          </div>
                        </div>

                        {/* Center: SPINE Guide */}
                        <div className="absolute top-0 bottom-0 left-[47%] w-[6%] border-r border-dashed border-white/20 flex flex-col items-center justify-center bg-black/30">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest -rotate-90">
                            Spine
                          </span>
                        </div>

                        {/* Right Half: FRONT COVER */}
                        <div
                          className={`absolute top-0 bottom-0 right-0 w-[47%] transition-all ${
                            activePlacement === "front_cover"
                              ? "border-l border-dashed border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                              : "border-l border-dashed border-white/20 bg-white/[0.02]"
                          }`}
                        >
                          <div className="p-3 text-right">
                            <span
                              className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded ${
                                activePlacement === "front_cover"
                                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/40"
                                  : "bg-white/10 text-gray-400"
                              }`}
                            >
                              Front Cover
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Design elements container */}
                    <div className="absolute inset-0 w-full h-full z-10">
                      {designFiles
                        .filter((design) => {
                          if (design.placement === activePlacement) return true;
                          if (
                            showBookGuides &&
                            ((activePlacement === "front_cover" && design.placement === "back_cover") ||
                              (activePlacement === "back_cover" && design.placement === "front_cover") ||
                              (activePlacement === "full_wrap" && (design.placement === "front_cover" || design.placement === "back_cover")))
                          ) {
                            return true;
                          }
                          return false;
                        })
                        .map((design) => {
                          const isOtherPlacement = design.placement !== activePlacement;
                          const isSelected = selectedDesignFile?.id === design.id || activeDesign?.id === design.id;

                          const scaledSize = {
                            width: Math.max(20, design.position.width * designScale),
                            height: Math.max(20, design.position.height * designScale),
                          };

                          const scaledPosition = {
                            x: design.position.left * designScale,
                            y: design.position.top * designScale,
                          };

                          if (isOtherPlacement) {
                            return (
                              <div
                                key={design.id}
                                style={{
                                  width: `${scaledSize.width}px`,
                                  height: `${scaledSize.height}px`,
                                  left: `${scaledPosition.x}px`,
                                  top: `${scaledPosition.y}px`,
                                  position: "absolute",
                                  opacity: 0.6,
                                  pointerEvents: "none",
                                }}
                                className="border border-dashed border-white/30 rounded-lg overflow-hidden"
                              >
                                <img
                                  src={design.url ? design.url.replace(/%25/g, "%") : ""}
                                  alt={design.filename}
                                  className="w-full h-full object-contain"
                                  draggable={false}
                                />
                                <span className="absolute bottom-1 left-1 bg-black/80 text-[8px] text-gray-300 px-1 py-0.5 rounded capitalize font-medium">
                                  {design.placement.replace(/_/g, " ")}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <Rnd
                              key={design.id}
                              size={scaledSize}
                              position={scaledPosition}
                              scale={scale}
                              lockAspectRatio={true}
                              onDragStop={(_e, data) => {
                                updateDesignPosition(design.id, {
                                  left: Math.round(data.x / designScale),
                                  top: Math.round(data.y / designScale),
                                });
                              }}
                              onResizeStop={(_e, _direction, ref, _delta, position) => {
                                updateDesignPosition(design.id, {
                                  width: Math.max(1, Math.round(parseFloat(ref.style.width) / designScale)),
                                  height: Math.max(1, Math.round(parseFloat(ref.style.height) / designScale)),
                                  left: Math.round(position.x / designScale),
                                  top: Math.round(position.y / designScale),
                                });
                              }}
                              bounds="parent"
                              minWidth={20}
                              minHeight={20}
                              className={`rounded-lg relative group transition-shadow ${
                                isSelected
                                  ? "border-2 border-[#FF6D1F] shadow-[0_0_15px_rgba(255,109,31,0.4)]"
                                  : "border border-white/40 hover:border-white/70"
                              } ${design.id === -1 ? "bg-blue-100/20" : "bg-transparent"}`}
                              onClick={() => setSelectedDesignFile(design)}
                              resizeHandleComponent={{
                                topLeft: (
                                  <div
                                    className="w-3.5 h-3.5 bg-[#FF6D1F] border-2 border-white rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize hover:scale-125 transition-transform"
                                    title="Drag corner to resize"
                                  />
                                ),
                                topRight: (
                                  <div
                                    className="w-3.5 h-3.5 bg-[#FF6D1F] border-2 border-white rounded-full shadow-md translate-x-1/2 -translate-y-1/2 cursor-nesw-resize hover:scale-125 transition-transform"
                                    title="Drag corner to resize"
                                  />
                                ),
                                bottomLeft: (
                                  <div
                                    className="w-3.5 h-3.5 bg-[#FF6D1F] border-2 border-white rounded-full shadow-md -translate-x-1/2 translate-y-1/2 cursor-nesw-resize hover:scale-125 transition-transform"
                                    title="Drag corner to resize"
                                  />
                                ),
                                bottomRight: (
                                  <div
                                    className="w-3.5 h-3.5 bg-[#FF6D1F] border-2 border-white rounded-full shadow-md translate-x-1/2 translate-y-1/2 cursor-nwse-resize hover:scale-125 transition-transform"
                                    title="Drag corner to resize"
                                  />
                                ),
                              }}
                            >
                              {/* Artwork Graphic - 100% visible with NO overlapping button */}
                              {design.filename.endsWith(".txt") ? (
                                <div className="w-full h-full flex items-center justify-center p-2 text-white font-semibold text-center overflow-hidden">
                                  {decodeURIComponent(design.url.split(",")[1] || "")}
                                </div>
                              ) : (
                                <img
                                  src={design.url ? design.url.replace(/%25/g, "%") : ""}
                                  alt={design.filename}
                                  className="w-full h-full object-fill pointer-events-none select-none"
                                  draggable={false}
                                />
                              )}

                              {/* Floating Remove Button - Positioned safely inside top-right corner to prevent overflow clipping */}
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveDesign(design, e)}
                                  className="absolute top-2 right-2 z-30 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border border-white/80"
                                  title="Remove design from this placement"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              )}

                              {/* Floating Dimensions Tag (Only when selected) */}
                              {isSelected && (
                                <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap bg-black/90 backdrop-blur-md text-[10px] text-white font-medium px-2 py-0.5 rounded-full border border-orange-500/40 shadow-lg flex items-center gap-1.5 ${
                                  scaledPosition.y < 32 ? "top-2.5" : "-top-7"
                                }`}>
                                  <span className="text-orange-400 font-bold">
                                    {Math.round(design.position.width)} × {Math.round(design.position.height)}px
                                  </span>
                                </div>
                              )}
                            </Rnd>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Intuitive Studio Controls Toolbar (Always visible when a design exists) */}
            {activeDesign && (
              <div className="w-full max-w-2xl mt-4 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
                {/* Header row: Placement info & dimensions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6D1F] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5" />
                      Placement: {activePlacement.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      ● Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                    <span className="font-mono text-gray-300">
                      Area: {printAreaWidth} × {printAreaHeight}px
                    </span>
                  </div>
                </div>

                {/* Row 1: Interactive Size / Scale Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-orange-400" />
                      Artwork Size (Scale):
                    </span>
                    <span className="text-orange-400 font-bold font-mono text-xs bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      {currentScalePercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleScaleChange(Math.max(10, currentScalePercent - 5))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 transition-colors cursor-pointer"
                      title="Decrease size by 5%"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={currentScalePercent}
                      onChange={(e) => handleScaleChange(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6D1F]"
                      title="Drag to resize artwork"
                    />

                    <button
                      type="button"
                      onClick={() => handleScaleChange(Math.min(100, currentScalePercent + 5))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-200 transition-colors cursor-pointer"
                      title="Increase size by 5%"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 pl-1">
                      <button
                        type="button"
                        onClick={() => handleScaleChange(25)}
                        className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                          currentScalePercent === 25
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                        }`}
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(50)}
                        className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                          currentScalePercent === 50
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                        }`}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(75)}
                        className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                          currentScalePercent === 75
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                        }`}
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAlign("fit")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                          currentScalePercent === 100
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300"
                        }`}
                        title="Fit artwork to 100% of print area"
                      >
                        <Maximize2 className="w-3 h-3" />
                        Fit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Alignment & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                  {/* Position Alignment Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400 text-[11px] mr-1">Align:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickAlign("center")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-gray-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Center horizontally and vertically"
                    >
                      <Crosshair className="w-3 h-3 text-orange-400" />
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAlign("top-center")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-gray-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Align to top center"
                    >
                      <ArrowUp className="w-3 h-3 text-gray-400" />
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAlign("bottom-center")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-gray-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Align to bottom center"
                    >
                      <ArrowDown className="w-3 h-3 text-gray-400" />
                      Bottom
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAlign("center-left")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-gray-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Align to left"
                    >
                      <ArrowLeft className="w-3 h-3 text-gray-400" />
                      Left
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAlign("center-right")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-gray-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Align to right"
                    >
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      Right
                    </button>
                  </div>

                  {/* Actions: AI BG, Auto-Fix Ratio, Remove */}
                  <div className="flex items-center gap-2 ml-auto">
                    {onRemoveBackground && (
                      <button
                        type="button"
                        onClick={onRemoveBackground}
                        disabled={isRemovingBackground}
                        className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 text-[11px]"
                        title="Remove white/solid background using AI"
                      >
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        <span>{isRemovingBackground ? "Removing..." : "AI BG"}</span>
                      </button>
                    )}

                    <AspectRatioFixButton
                      designFiles={designFiles}
                      activePlacement={activePlacement}
                      activePrintFile={activePrintFile}
                      updateDesignPosition={updateDesignPosition}
                      className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span>Fix Ratio</span>
                    </AspectRatioFixButton>

                    <button
                      type="button"
                      onClick={() => handleRemoveDesign(activeDesign)}
                      className="px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Remove artwork from placement"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        
      </div>
    </div>
  );
};

export default DesignCanvasTab;
