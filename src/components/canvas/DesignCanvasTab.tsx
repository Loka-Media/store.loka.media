import React, { useEffect } from "react";
import { Rnd } from "react-rnd";
import { Zap, X } from "lucide-react";
import toast from "react-hot-toast";
import { DesignFile, PrintFile } from "./types";
import { getCanvasDimensions } from "./utils";
import { aspectRatioValidation } from "@/utils/aspectRatioValidation";

interface AspectRatioIssue {
  designId: number;
  message: string;
}

interface DesignCanvasTabProps {
  designFiles: DesignFile[];
  setDesignFiles: (files: DesignFile[]) => void;
  activePlacement: string;
  selectedPlacements: string[];
  setSelectedPlacements: (placements: string[]) => void;
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
  const canvasDims = getCanvasDimensions(activePrintFile);

  useEffect(() => {
    console.log("🎯 Starting aspect ratio validation for active placement");
    const validationPromises = designFiles
      .filter((design) => design.placement === activePlacement && design.url)
      .map((design) =>
        aspectRatioValidation(
          design.url,
          design.position.width,
          design.position.height
        )
          .then(({ isValid, percentDifference, correctedDimensions }) => {
            if (!isValid) {
              return {
                designId: design.id,
                message: `Warning: Aspect ratio of image is off by ${percentDifference.toFixed(
                  2
                )}%. Recommended dimensions: ${correctedDimensions.width.toFixed(
                  0
                )}x${correctedDimensions.height.toFixed(0)}`,
              };
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
      onAspectRatioIssues(
        results.filter((r) => r !== null) as AspectRatioIssue[]
      );
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
        {/* Design Canvas Area */}
        <div
          className="bg-white rounded-xl border-2 border-gray-300 relative shadow-2xl overflow-hidden"
          style={{
            width: `${canvasDims.width}px`,
            height: `${canvasDims.height}px`,
            margin: "0 auto",
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

                // console.log("DesignCanvasTab props:", {
                //   area_width: canvasWidth,
                //   area_height: canvasHeight,
                //   width: design.position.width,
                //   height: design.position.height,
                //   top: design.position.top,
                //   left: design.position.left,
                //   url: design.url,
                // });

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

        {/* Aspect Ratio Issues */}
        <div className="mt-4 text-center">
          {aspectRatioIssues.map((issue) => (
            <div key={issue.designId} className="text-yellow-500 text-sm">
              {issue.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignCanvasTab;
