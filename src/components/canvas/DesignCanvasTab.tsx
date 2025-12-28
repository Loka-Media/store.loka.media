import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { Zap, X, AlertCircle, CheckCircle, Info } from "lucide-react";
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

  useEffect(() => {
    // Validate ALL designs across ALL placements (not just active placement)
    const allDesignsWithUrl = designFiles.filter((design) => design.url);
    console.log("🎯 Starting aspect ratio validation for all placements");
    console.log("🎯 Found designs for validation:", allDesignsWithUrl.length, allDesignsWithUrl.map(d => d.filename));

    if (allDesignsWithUrl.length === 0) {
      console.log("🎯 No designs found for validation, clearing issues");
      onAspectRatioIssues([]);
      return;
    }

    const validationPromises = allDesignsWithUrl.map((design) =>
      aspectRatioValidation(
        design.url,
        design.position.width,
        design.position.height,
        0.5 // Very strict tolerance for Printful order compliance
      )
        .then(({ isValid, percentDifference, correctedDimensions }) => {
          console.log(`🎯 Validation result for ${design.filename}:`, { isValid, percentDifference });

          // Show validation results even for valid designs if there's any difference
          if (percentDifference > 0.1) { // Show if difference is more than 0.1%
            if (!isValid && correctedDimensions) {
              return {
                designId: design.id,
                placement: design.placement,
                message: `🚫 CRITICAL: ${design.placement} - Aspect ratio off by ${percentDifference.toFixed(
                  2
                )}%. Must fix to: ${correctedDimensions.width.toFixed(
                  0
                )}x${correctedDimensions.height.toFixed(0)}px for Printful compliance`,
              };
            } else if (isValid) {
              return {
                designId: design.id,
                placement: design.placement,
                message: `✅ GOOD: ${design.placement} - Aspect ratio variance ${percentDifference.toFixed(
                  2
                )}% (within tolerance). Printful compatible!`,
              };
            }
          }
          return null;
        })
        .catch((err) => {
          console.error(
            "Aspect ratio validation error for",
            design.url,
            ":",
            err
          );
          return {
            designId: design.id,
            placement: design.placement,
            message: `Error validating aspect ratio for ${design.filename} on ${design.placement}.`,
          };
        })
    );

    Promise.all(validationPromises).then((results) => {
      const allResults = results.filter((r) => r !== null) as AspectRatioIssue[];
      const criticalIssues = allResults.filter(issue => issue.message.includes('🚫 CRITICAL'));
      const goodResults = allResults.filter(issue => issue.message.includes('✅ GOOD'));

      console.log("🎯 Final validation results:", {
        total: allResults.length,
        critical: criticalIssues.length,
        good: goodResults.length
      });

      // Only pass critical issues to block workflow, but show all results in display
      onAspectRatioIssues(criticalIssues);

      // Store all results for display purposes
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
    <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-6">
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
          <div className="flex flex-col w-full h-96 justify-center items-center gap-6 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Rotate Your Phone</h3>
              <p className="text-gray-300 mb-2">This design is wider and looks better in landscape mode</p>
              <p className="text-sm text-gray-400">Canvas Size: {canvasDims.width} × {canvasDims.height}px</p>
            </div>
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto animate-bounce text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center items-center sm:items-start gap-2 sm:gap-4 w-full">
            {/* Canvas Container */}
            <div
              className="gradient-border-white-bottom rounded-lg relative shadow-[0_10px_30px_rgba(255,133,27,0.2)] overflow-hidden flex-shrink-0"
              style={{
                width: `${canvasDims.width}px`,
                height: `${canvasDims.height}px`,
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
                    onDragStop={(_e, data) => {
                      updateDesignPosition(design.id, {
                        left: data.x / scale,
                        top: data.y / scale,
                      });
                    }}
                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                      updateDesignPosition(design.id, {
                        width: parseInt(ref.style.width) / scale,
                        height: parseInt(ref.style.height) / scale,
                        left: position.x / scale,
                        top: position.y / scale,
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
                        src={design.url}
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
                    // Force re-validation
                    const validationPromises = designsForPlacement.map((design) =>
                      aspectRatioValidation(
                        design.url,
                        design.position.width,
                        design.position.height,
                        0.5
                      )
                    );
                    Promise.all(validationPromises).then((results) => {
                      const allResults = results
                        .map((result, index) => {
                          if (result.percentDifference > 0.1) {
                            if (!result.isValid) {
                              return {
                                designId: designsForPlacement[index].id,
                                message: `🚫 CRITICAL: Aspect ratio off by ${result.percentDifference.toFixed(
                                  2
                                )}%. Must fix to: ${result.correctedDimensions?.width.toFixed(
                                  0
                                )}x${result.correctedDimensions?.height.toFixed(0)}px for Printful compliance`,
                              };
                            } else {
                              return {
                                designId: designsForPlacement[index].id,
                                message: `✅ GOOD: Aspect ratio variance ${result.percentDifference.toFixed(
                                  2
                                )}% (within tolerance). Printful compatible!`,
                              };
                            }
                          }
                          return null;
                        })
                        .filter((r) => r !== null);
                      const criticalIssues = allResults.filter(
                        (issue) => issue.message.includes("🚫 CRITICAL")
                      );
                      onAspectRatioIssues(criticalIssues);
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
            {/* Critical Issues */}
            {aspectRatioIssues.length > 0 && (
              <div className="p-2 sm:p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
                  <div className="text-xs sm:text-sm font-bold text-orange-400">
                    {aspectRatioIssues.length} Issue{aspectRatioIssues.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  {aspectRatioIssues.map((issue) => {
                    // Extract percentage from message
                    const percentMatch = issue.message.match(/off by ([\d.]+)%/);
                    const percent = percentMatch ? percentMatch[1] : '0';
                    const isExpanded = expandedIssueId === issue.designId;
                    // Extract placement name from message (e.g., "🚫 CRITICAL: front - Aspect ratio...")
                    const placementMatch = issue.message.match(/CRITICAL: ([^-]+) -/);
                    const placement = placementMatch ? placementMatch[1].trim() : 'Design';

                    return (
                      <div key={issue.designId}>
                        <button
                          onClick={() => setExpandedIssueId(isExpanded ? null : issue.designId)}
                          className="w-full group relative flex items-center gap-2 px-2 py-1 hover:bg-orange-500/20 rounded transition-colors text-left"
                        >
                          <div className="text-orange-400">•</div>
                          <div className="text-xs text-orange-300 truncate flex-1">{placement}</div>
                          <div className="text-xs font-mono text-orange-500 bg-orange-500/20 px-2 py-0.5 rounded whitespace-nowrap">
                            {percent}%
                          </div>
                          {/* Desktop Tooltip */}
                          <div className="absolute left-0 right-0 top-full mt-1 hidden sm:group-hover:block pointer-events-none z-50">
                            <div className="bg-gray-900 text-orange-200 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-orange-500/30 text-center">
                              {issue.message}
                            </div>
                          </div>
                        </button>

                        {/* Mobile Expandable Tooltip */}
                        {isExpanded && (
                          <div className="sm:hidden mt-1 bg-gray-900 border border-orange-500/30 rounded px-2 py-1 text-orange-200 text-xs">
                            {issue.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                        <div key={result.designId}>
                          <button
                            onClick={() => setExpandedIssueId(isExpanded ? null : result.designId)}
                            className="w-full group relative flex items-center gap-2 px-2 py-1 hover:bg-emerald-500/20 rounded transition-colors text-left"
                          >
                            <div className="text-emerald-400">✓</div>
                            <div className="text-xs text-emerald-300 truncate flex-1">{placement}</div>
                            <div className="text-xs font-mono text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded whitespace-nowrap">
                              {percent}%
                            </div>
                            {/* Desktop Tooltip */}
                            <div className="absolute left-0 right-0 top-full mt-1 hidden sm:group-hover:block pointer-events-none z-50">
                              <div className="bg-gray-900 text-emerald-200 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-emerald-500/30 text-center">
                                {result.message}
                              </div>
                            </div>
                          </button>

                          {/* Mobile Expandable Tooltip */}
                          {isExpanded && (
                            <div className="sm:hidden mt-1 bg-gray-900 border border-emerald-500/30 rounded px-2 py-1 text-emerald-200 text-xs">
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
