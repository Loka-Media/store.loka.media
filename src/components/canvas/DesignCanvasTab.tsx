import React, { useEffect } from "react";
import { Rnd } from "react-rnd";
import { Zap, X } from "lucide-react";
import toast from "react-hot-toast";
import { DesignFile, PrintFile, AspectRatioIssue } from "./types";
import { getCanvasDimensions } from "./utils";
import { aspectRatioValidation } from "@/utils/aspectRatioValidation";
import AspectRatioFixButton from "./AspectRatioFixButton";

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
  const canvasDims = getCanvasDimensions(activePrintFile);

  useEffect(() => {
    const designsForPlacement = designFiles.filter((design) => design.placement === activePlacement && design.url);
    console.log("🎯 Starting aspect ratio validation for active placement:", activePlacement);
    console.log("🎯 Found designs for validation:", designsForPlacement.length, designsForPlacement.map(d => d.filename));
    
    if (designsForPlacement.length === 0) {
      console.log("🎯 No designs found for validation, clearing issues");
      onAspectRatioIssues([]);
      return;
    }
    
    const validationPromises = designsForPlacement.map((design) =>
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
                message: `🚫 CRITICAL: Aspect ratio off by ${percentDifference.toFixed(
                  2
                )}%. Must fix to: ${correctedDimensions.width.toFixed(
                  0
                )}x${correctedDimensions.height.toFixed(0)}px for Printful compliance`,
              };
            } else if (isValid) {
              return {
                designId: design.id,
                message: `✅ GOOD: Aspect ratio variance ${percentDifference.toFixed(
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
            message: `Error validating aspect ratio for ${design.filename}.`,
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
  }, [designFiles, activePlacement, onAspectRatioIssues]);

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
    <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Design Canvas Area - Centered with Button on Right */}
        <div className="flex justify-center items-start gap-4">
          {/* Canvas Container */}
          <div
            className="bg-white rounded-xl border-2 border-gray-300 relative shadow-2xl overflow-hidden flex-shrink-0"
            style={{
              width: `${canvasDims.width}px`,
              height: `${canvasDims.height}px`,
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              boxShadow:
                "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
          {designFiles.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2 text-gray-700">
                  Product Canvas
                </p>
                <p className="text-sm text-gray-500">
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
                    className={`border rounded ${
                      selectedDesignFile?.id === design.id
                        ? "border-orange-500 border-2"
                        : "border-orange-500/50"
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
                    <div className="absolute -top-6 left-0 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {design.placement} {design.id === -1 && "(Preview)"}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemoveDesign(design, e)}
                      className="absolute -top-6 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg"
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

        {/* Canvas Controls */}
        <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-400">
          <div>
            Canvas Size: {canvasDims.width} x {canvasDims.height}
          </div>
          <div>•</div>
          <div>Active Placement: {activePlacement || "None"}</div>
          <div>•</div>
          <div>Designs: {designFiles.length}</div>
        </div>

        {/* Aspect Ratio Validation Results */}
        {allValidationResults.length > 0 && (
          <div className="mt-4 space-y-3">
            {/* Critical Issues */}
            {aspectRatioIssues.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-sm font-bold text-red-400">
                    ⚠️ PRINTFUL COMPLIANCE REQUIRED ({aspectRatioIssues.length} critical issues)
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {aspectRatioIssues.map((issue) => (
                    <div key={issue.designId} className="text-red-300 text-xs text-center">
                      {issue.message}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-xs text-red-200 mb-2">
                    ❌ Mockup generation and order creation will be blocked until these issues are resolved.
                  </div>
                  <div className="text-xs text-red-100">
                    💡 Tip: Resize your designs to match the exact dimensions shown above.
                  </div>
                </div>
              </div>
            )}
            
            {/* Good Results */}
            {allValidationResults.filter(r => r.message.includes('✅ GOOD')).length > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="text-sm font-bold text-green-400 mb-2 text-center">
                  ✅ Aspect Ratio Status
                </div>
                <div className="space-y-1">
                  {allValidationResults
                    .filter(r => r.message.includes('✅ GOOD'))
                    .map((result) => (
                      <div key={result.designId} className="text-green-300 text-xs text-center">
                        {result.message}
                      </div>
                    ))}
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
