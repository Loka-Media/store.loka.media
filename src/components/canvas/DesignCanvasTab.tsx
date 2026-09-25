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
}) => {
  const [allValidationResults, setAllValidationResults] = React.useState<AspectRatioIssue[]>([]);
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const canvasDims = getCanvasDimensions(activePrintFile);

  // Listen for window resize to update orientation
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate dynamic scale for mobile - ensure canvas fits within viewport
  const calculateMobileScale = () => {
    if (windowWidth >= 640) {
      return 1;
    }
    // Available width with padding (16px left + 16px right)
    const availableWidth = windowWidth - 32;
    // Calculate scale to fit canvas width within available space
    const scale = Math.min(availableWidth / canvasDims.width, 1);
    return Math.max(scale, 0.4); // Minimum scale of 0.4
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
    <div className="flex-1 bg-black flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Placement Tabs - Switch between selected placements */}
        {selectedPlacements.length > 0 && (
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
          <div className="flex flex-col sm:flex-row justify-center items-center sm:items-start gap-2 sm:gap-4 w-full max-w-full overflow-hidden">
            {/* Canvas Container */}
            <div
              className="gradient-border-white-bottom rounded-lg relative shadow-[0_10px_30px_rgba(255,133,27,0.2)] overflow-hidden max-w-full"
              style={{
                width: `${canvasDims.width}px`,
                height: `${canvasDims.height}px`,
                maxWidth: "100%",
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                boxShadow:
                  "0 20px 40px rgba(255,133,27,0.1), inset 0 1px 0 rgba(255,133,27,0.05)",
                transform: `scale(${calculateMobileScale()})`,
                transformOrigin: "center center",
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
              </div>
            </div>
          ) : null}

          {/* Design elements container */}
          <div className="absolute inset-0 w-full h-full">
            {/* Design elements will appear here */}
            {designFiles
              .filter((design) => design.placement === activePlacement)
              .map((design) => {
                // Scale design to fit in dynamic canvas
                const canvasWidth = canvasDims.width;
                const canvasHeight = canvasDims.height;
                const printFile = activePrintFile;

                // Calculate scaling factor to fit print file in canvas
                const scaleX = printFile ? canvasWidth / printFile.width : 0.5;
                const scaleY = printFile
                  ? canvasHeight / printFile.height
                  : 0.5;
                const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

                const scaledSize = {
                  width: design.position.width * scale,
                  height: design.position.height * scale,
                };

                const scaledPosition = {
                  x: design.position.left * scale,
                  y: design.position.top * scale,
                };

                return (
                  <Rnd
                    key={design.id}
                    size={scaledSize}
                    position={scaledPosition}
                    lockAspectRatio={true}
                    onDragStop={(_e, data) => {
                      updateDesignPosition(design.id, {
                        left: Math.round(data.x / scale),
                        top: Math.round(data.y / scale),
                      });
                    }}
                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                      updateDesignPosition(design.id, {
                        width: Math.max(1, Math.round(parseFloat(ref.style.width) / scale)),
                        height: Math.max(1, Math.round(parseFloat(ref.style.height) / scale)),
                        left: Math.round(position.x / scale),
                        top: Math.round(position.y / scale),
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

          {/* Auto-Fix Aspect Ratio Button */}
          <div className="flex items-start pt-2">
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
