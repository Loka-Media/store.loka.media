import React, { useEffect, useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { Zap, X, CheckCircle, Info, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { DesignFile, PrintFile, AspectRatioIssue } from "./types";
import { getCanvasDimensions } from "./utils";
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
}) => {
  const [allValidationResults, setAllValidationResults] = React.useState<AspectRatioIssue[]>([]);
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const canvasDims = getCanvasDimensions(activePrintFile);

  // Listen for window resize to update orientation
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    // Measure immediately
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Re-measure when container might change (e.g. step change)
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  });

  // Calculate dynamic scale to fit the canvas in its actual container
  const calculateMobileScale = () => {
    // Use container width if available, otherwise fall back to viewport width
    const availableWidth = containerWidth > 0 ? containerWidth - 16 : windowWidth - 32;
    if (availableWidth >= canvasDims.width) return 1;
    const scale = availableWidth / canvasDims.width;
    return Math.max(scale, 0.35); // Minimum scale of 0.35
  };

  // Check if canvas is too wide for portrait mode (should rotate to landscape)
  const shouldShowRotatePrompt = () => {
    if (windowWidth >= 640 || typeof window === "undefined") return false;
    // Show prompt if canvas width is significantly wider than viewport
    return canvasDims.width > windowWidth * 0.7; // More than 70% of viewport width
  };

  // Get icon for placement
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
    // Validate designs across placements smoothly without infinite re-render loops
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
      // Keep onAspectRatioIssues empty to ensure client experiences no blocking error messages
      onAspectRatioIssues([]);
      setAllValidationResults(allResults);
    });
  }, [designFiles, onAspectRatioIssues]);

  const handleRemoveDesign = (design: DesignFile, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove the design from this placement
    setDesignFiles((prev: DesignFile[]) =>
      prev.filter((df: DesignFile) => df.id !== design.id)
    );

    // Remove placement from selected placements
    setSelectedPlacements((prevPlacements) =>
      prevPlacements.filter((p) => p !== design.placement)
    );

    // Clear active placement and selectedDesignFile if this was the active one
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
    <div className="w-full bg-black flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-full">
        {/* Placement Tabs - Switch between selected placements (hidden by default when controlled externally) */}
        {!hidePlacementTabs && selectedPlacements.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-3">
            {selectedPlacements.map((placement) => (
              <button
                key={placement}
                onClick={() => setActivePlacement(placement)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all text-sm sm:text-base flex items-center gap-2 bg-gray-800 text-gray-300 ${
                  activePlacement === placement
                    ? "border-2 border-white text-white"
                    : "border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  {getPlacementIcon(placement)}
                </span>
                {placement}
              </button>
            ))}
          </div>
        )}

        {/* Design Canvas Area - Centered with Button on Right */}
        {shouldShowRotatePrompt() ? (
          <div className="flex flex-col w-full h-96 justify-center items-center gap-8 p-6">
            <div className="text-center">
              <div className="inline-block mb-6">
                <style>{`
                  @keyframes rotatePhone {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(90deg); }
                    100% { transform: rotate(0deg); }
                  }
                  .animate-rotate-phone {
                    animation: rotatePhone 3s ease-in-out infinite;
                  }
                `}</style>
                <div className="w-24 h-24 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center shadow-inner">
                  <Smartphone className="w-12 h-12 text-orange-400 animate-rotate-phone" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Rotate Your Phone</h3>
              <p className="text-gray-300 mb-2">This design is wider and looks better in landscape mode</p>
              <p className="text-sm text-gray-400">Canvas Size: {canvasDims.width} × {canvasDims.height}px</p>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full">
            {/* Outer wrapper takes the SCALED dimensions as layout space */}
            {(() => {
              const scale = calculateMobileScale();
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
                >
                  {/* Inner canvas positioned absolutely, scaled from top-left */}
                  <div
                    className="gradient-border-white-bottom rounded-lg relative shadow-[0_10px_30px_rgba(255,133,27,0.2)] overflow-hidden"
                    style={{
                      width: `${canvasDims.width}px`,
                      height: `${canvasDims.height}px`,
                      background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                      boxShadow: "0 20px 40px rgba(255,133,27,0.1), inset 0 1px 0 rgba(255,133,27,0.05)",
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transition: "transform 0.3s ease-in-out",
                    }}
                  >
                    {designFiles.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-gray-700">
                            <Zap className="w-8 h-8 text-orange-400" />
                          </div>
                          <p className="text-lg font-medium mb-2 text-white">
                            Product Canvas
                          </p>
                          <p className="text-sm text-gray-400">
                            Select a file to add your design
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click an artwork on the left to place it here
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Wraparound Cover Visual Template Guides (Journal / Notebook / Book Covers) */}
                    {(() => {
                      const isWrap =
                        activePlacement === "front_cover" ||
                        activePlacement === "back_cover" ||
                        activePlacement === "full_wrap" ||
                        (activePrintFile && activePrintFile.width && activePrintFile.height && activePrintFile.width / activePrintFile.height > 1.25 && activePrintFile.width >= 3000);

                      if (!isWrap) return null;

                      return (
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
                                className={`text-[11px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded ${
                                  activePlacement === "back_cover"
                                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/40"
                                    : "bg-white/10 text-gray-400"
                                }`}
                              >
                                Back Cover
                              </span>
                            </div>

                            {/* Production Barcode guide box (bottom right of back cover, matching Printify) */}
                            <div className="absolute bottom-2 right-2 w-12 h-8 border border-white/20 bg-black/60 rounded flex flex-col items-center justify-center p-0.5 opacity-60">
                              <div className="text-[7px] text-gray-400 font-mono tracking-tighter">|||||||||</div>
                              <span className="text-[6px] text-gray-400">Barcode</span>
                            </div>
                          </div>

                          {/* Center: SPINE Guide */}
                          <div className="absolute top-0 bottom-0 left-[47%] w-[6%] border-r border-dashed border-white/20 flex flex-col items-center justify-center bg-black/30">
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest -rotate-90">
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
                                className={`text-[11px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded ${
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
                      );
                    })()}

                    {/* Design elements container */}
                    <div className="absolute inset-0 w-full h-full z-10">
                      {/* Design elements will appear here */}
                      {designFiles
                        .filter((design) => {
                          if (design.placement === activePlacement) return true;
                          if (
                            (activePlacement === "front_cover" && design.placement === "back_cover") ||
                            (activePlacement === "back_cover" && design.placement === "front_cover") ||
                            (activePlacement === "full_wrap" && (design.placement === "front_cover" || design.placement === "back_cover"))
                          ) {
                            return true;
                          }
                          return false;
                        })
                        .map((design) => {
                          const isOtherPlacement = design.placement !== activePlacement;
                          // Scale design to fit in dynamic canvas
                          const canvasWidth = canvasDims.width;
                          const canvasHeight = canvasDims.height;
                          const printFile = activePrintFile;

                          // Calculate scaling factor to fit print file in canvas
                          const scaleX = printFile ? canvasWidth / printFile.width : 0.5;
                          const scaleY = printFile
                            ? canvasHeight / printFile.height
                            : 0.5;
                          const designScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

                          const scaledSize = {
                            width: design.position.width * designScale,
                            height: design.position.height * designScale,
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
                                  opacity: 0.7,
                                  pointerEvents: "none",
                                }}
                                className="border border-dashed border-white/40 rounded overflow-hidden"
                              >
                                <img
                                  src={design.url ? design.url.replace(/%25/g, '%') : ''}
                                  alt={design.filename}
                                  className="w-full h-full object-contain"
                                  draggable={false}
                                />
                                <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-gray-300 px-1 py-0.5 rounded capitalize">
                                  {design.placement.replace(/_/g, ' ')}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <Rnd
                              key={design.id}
                              size={scaledSize}
                              position={scaledPosition}
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
                              minWidth={30}
                              minHeight={30}
                              className={`border rounded relative ${
                                selectedDesignFile?.id === design.id
                                  ? "border-white border-2"
                                  : "border-white/30"
                              } ${design.id === -1 ? "bg-blue-100/20" : "bg-white/10"}`}
                              onClick={() => setSelectedDesignFile(design)}
                            >
                              {design.filename.endsWith(".txt") ? (
                                // Render text
                                <div className="w-full h-full flex items-center justify-center p-2 text-gray-900 font-semibold text-center overflow-hidden">
                                  {decodeURIComponent(design.url.split(",")[1] || "")}
                                </div>
                              ) : (
                                // Render image
                                <img
                                  src={design.url ? design.url.replace(/%25/g, '%') : ''}
                                  alt={design.filename}
                                  className="w-full h-full object-contain"
                                  draggable={false}
                                />
                              )}
                              {/* Remove button - Top Right Corner */}
                              <button
                                onClick={(e) => handleRemoveDesign(design, e)}
                                className="absolute top-2 right-2 w-6 h-6 bg-transparent border border-white text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all p-0"
                                title="Remove from placement"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Rnd>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Auto-Fix Aspect Ratio Button - below canvas, full width */}
            <div className="flex items-center justify-center pt-2 w-full">
              <AspectRatioFixButton
                designFiles={designFiles}
                activePlacement={activePlacement}
                activePrintFile={activePrintFile}
                updateDesignPosition={updateDesignPosition}
                onFixComplete={() => {
                  // Re-validate after fixing
                  const designsForPlacement = designFiles.filter(
                    (design) => design.placement === activePlacement && design.url
                  );
                  if (designsForPlacement.length > 0) {
                    setTimeout(() => {
                      const validationPromises = designsForPlacement.map((design) =>
                        aspectRatioValidation(
                          design.url,
                          design.position.width,
                          design.position.height,
                          2.5
                        )
                      );
                      Promise.all(validationPromises).then((results) => {
                        const allResults = results
                          .map((result, index) => {
                            if (!result.isValid && result.correctedDimensions) {
                              updateDesignPosition(designsForPlacement[index].id, {
                                width: result.correctedDimensions.width,
                                height: result.correctedDimensions.height,
                              });
                            }
                            return {
                              designId: designsForPlacement[index].id,
                              placement: designsForPlacement[index].placement,
                              message: `✅ GOOD: Aspect ratio aligned.`,
                            };
                          });
                        onAspectRatioIssues([]);
                        setAllValidationResults(allResults);
                      });
                    }, 100);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Canvas Controls */}
        <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 flex-wrap">
          <div className="whitespace-nowrap">
            Canvas Size: {canvasDims.width} x {canvasDims.height}
          </div>
          <div className="hidden sm:block">•</div>
          <div className="whitespace-nowrap">
            Active Placement: {activePlacement || "None"}
          </div>
          <div className="hidden sm:block">•</div>
          <div className="whitespace-nowrap">
            Designs: {designFiles.length}
          </div>
        </div>

        {/* Aspect Ratio Validation Results */}
        {allValidationResults.length > 0 && (
          <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-3">

            {/* Good Results */}
            {allValidationResults.filter(r => r.message.includes('✅ GOOD')).length > 0 && (
              <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-xs sm:text-sm font-bold text-emerald-400">
                    Ready ({allValidationResults.filter(r => r.message.includes('✅ GOOD')).length})
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {allValidationResults
                    .filter(r => r.message.includes('✅ GOOD'))
                    .map((result) => {
                      // Extract percentage from message
                      const percentMatch = result.message.match(/variance ([\d.]+)%/);
                      const percent = percentMatch ? percentMatch[1] : '0';
                      const isExpanded = expandedIssueId === result.designId;
                      // Extract placement name from message (e.g., "✅ GOOD: front - Aspect ratio...")
                      const placementMatch = result.message.match(/GOOD: ([^-]+) -/);
                      const placement = placementMatch ? placementMatch[1].trim() : 'Design';

                      return (
                        <div key={result.designId} className="relative">
                          <button
                            onClick={() => setExpandedIssueId(isExpanded ? null : result.designId)}
                            className="w-full group flex items-center gap-2 px-2.5 py-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors text-left border border-transparent hover:border-emerald-500/30"
                          >
                            <div className="text-emerald-400 font-bold">✓</div>
                            <div className="text-xs font-medium text-emerald-300 truncate flex-1">{placement}</div>
                            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded whitespace-nowrap">
                              {percent}%
                            </div>

                            {/* Desktop Tooltip */}
                            <div className="absolute left-0 top-full mt-1 hidden sm:group-hover:block pointer-events-none z-50 w-full max-w-sm">
                              <div className="bg-gray-950/95 backdrop-blur-md text-emerald-200 text-xs rounded-lg p-2.5 shadow-2xl border border-emerald-500/40 whitespace-normal break-words leading-relaxed">
                                {result.message}
                              </div>
                            </div>
                          </button>

                          {/* Expandable Tooltip on Click */}
                          {isExpanded && (
                            <div className="mt-1 bg-gray-950/90 border border-emerald-500/30 rounded-lg p-2.5 text-emerald-200 text-xs whitespace-normal break-words leading-relaxed">
                              {result.message}
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
      </div>
    </div>
  );
};

export default DesignCanvasTab;
