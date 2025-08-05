/* eslint-disable @typescript-eslint/no-explicit-any */
// components/canvas/steps/DesignStep.jsx
"use client";

import { Palette, Trash2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// Interfaces for better type safety
interface DesignPosition {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
}

interface UploadedFile {
  id: string | number;
  filename: string;
  file_url: string;
  thumbnail_url: string;
  printful_file_id: number;
  upload_status: "pending" | "completed" | "failed";
  created_at: string;
}

interface DesignFile extends UploadedFile {
  placement: "front" | "back";
  url: string;
  position: DesignPosition;
}

interface DesignFileManagerProps {
  file: UploadedFile;
  onAddDesignFile: (file: UploadedFile, placement: string) => void;
  availablePlacements?: string[];
}

interface PositionControlsProps {
  file: DesignFile;
  onUpdatePosition: (
    fileId: string | number,
    newPosition: Partial<DesignPosition>
  ) => void;
  onSetPresetPosition: (fileId: string | number, preset: string) => void;
}

interface DesignLayoutItemProps {
  file: DesignFile;
  onRemoveDesignFile: (fileId: string | number) => void;
  onUpdatePosition: (
    fileId: string | number,
    newPosition: Partial<DesignPosition>
  ) => void;
  onSetPresetPosition: (fileId: string | number, preset: string) => void;
}

interface DesignStepProps {
  uploadedFiles: any;
  designFiles: any[];
  onAddDesignFile: any;
  onRemoveDesignFile: any;
  onUpdateDesignPosition: any;
  onSetPresetPosition: any;
  onPreviewOrder?: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  printFiles?: any;
  onGeneratePreview?: () => void;
  isGeneratingPreview?: boolean;
}

const DesignFileManager: React.FC<DesignFileManagerProps> = ({
  file,
  onAddDesignFile,
  availablePlacements = ["front", "back"],
}) => {
  const placementColors = {
    front: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    back: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    sleeve_left: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    sleeve_right: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    default: "bg-green-100 text-green-700 hover:bg-green-200"
  };

  return (
    <>
      <div className="relative flex h-full flex-col">
        <div className="aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 hover:ring-2 hover:ring-indigo-500">
          {file.thumbnail_url ? (
            <Image
              src={file.thumbnail_url}
              alt={file.filename}
              fill
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Palette className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        <p className="mt-1 flex-grow truncate text-xs text-gray-600">
          {file.filename}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {availablePlacements.map((placement) => (
          <button
            key={placement}
            onClick={() => onAddDesignFile(file, placement)}
            className={`w-full rounded px-2 py-1 text-center text-xs transition-colors ${
              placementColors[placement as keyof typeof placementColors] || placementColors.default
            }`}
          >
            + {placement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
    </>
  );
};

const PositionControls: React.FC<PositionControlsProps> = ({
  file,
  onUpdatePosition,
  onSetPresetPosition,
}) => {
  if (!file.position) return null;

  const presetPositions = [
    ["top-left", "TL"],
    ["top-center", "TC"],
    ["top-right", "TR"],
    ["center", "Center"],
    ["bottom-left", "BL"],
    ["bottom-center", "BC"],
    ["bottom-right", "BR"],
  ];

  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <h5 className="mb-2 text-xs font-medium text-gray-700">
        Position Controls
      </h5>

      {/* Preset Positions */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-black">Quick Position:</p>
        <div className="grid grid-cols-3 gap-1">
          {presetPositions.map(([preset, label]) => (
            <button
              key={preset}
              onClick={() => onSetPresetPosition(file.id, preset)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-black hover:bg-gray-100"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Controls */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-black">Width (px)</label>
          <input
            type="number"
            value={Math.round(file.position.width)}
            onChange={(e) =>
              onUpdatePosition(file.id, {
                width: parseInt(e.target.value) || 0,
              })
            }
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-black"
            min="50"
            max={file.position.area_width}
          />
        </div>
        <div>
          <label className="text-xs text-black">Height (px)</label>
          <input
            type="number"
            value={Math.round(file.position.height)}
            onChange={(e) =>
              onUpdatePosition(file.id, {
                height: parseInt(e.target.value) || 0,
              })
            }
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-black"
            min="50"
            max={file.position.area_height}
          />
        </div>
      </div>

      {/* Position Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-black">Top (px)</label>
          <input
            type="number"
            value={Math.round(file.position.top)}
            onChange={(e) =>
              onUpdatePosition(file.id, { top: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-black"
            min="0"
            max={file.position.area_height - file.position.height}
          />
        </div>
        <div>
          <label className="text-xs text-black">Left (px)</label>
          <input
            type="number"
            value={Math.round(file.position.left)}
            onChange={(e) =>
              onUpdatePosition(file.id, { left: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-black"
            min="0"
            max={file.position.area_width - file.position.width}
          />
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Print area: {file.position.area_width}×{file.position.area_height}px
      </div>

      {/* Visual Position Preview */}
      <div className="mt-3">
        <p className="mb-1 text-xs text-gray-600">Position Preview:</p>
        <div
          className="relative rounded border border-gray-300 bg-gray-200"
          style={{
            width: "120px",
            height: "160px", // Roughly 3:4 aspect ratio like print area
          }}
        >
          <div
            className="absolute rounded-sm border border-indigo-600 bg-indigo-500 opacity-70"
            style={{
              width: `${
                (file.position.width / file.position.area_width) * 120
              }px`,
              height: `${
                (file.position.height / file.position.area_height) * 160
              }px`,
              top: `${(file.position.top / file.position.area_height) * 160}px`,
              left: `${
                (file.position.left / file.position.area_width) * 120
              }px`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xs font-bold text-white">DESIGN</span>
            </div>
          </div>
          <div className="absolute bottom-1 left-1 rounded bg-white px-1 text-xs text-gray-500">
            {file.placement.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

const DesignLayoutItem: React.FC<DesignLayoutItemProps> = ({
  file,
  onRemoveDesignFile,
  onUpdatePosition,
  onSetPresetPosition,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
            <Image
              src={file.url}
              alt={file.filename}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{file.filename}</p>
            <p className="capitalize text-xs text-gray-600">
              {file.placement} placement
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemoveDesignFile(file.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <PositionControls
        file={file}
        onUpdatePosition={onUpdatePosition}
        onSetPresetPosition={onSetPresetPosition}
      />
    </div>
  );
};

const DesignStep: React.FC<DesignStepProps> = ({
  uploadedFiles,
  designFiles,
  onAddDesignFile,
  onRemoveDesignFile,
  onUpdateDesignPosition,
  onSetPresetPosition,
  onPreviewOrder,
  onPrevStep,
  onNextStep,
  printFiles,
  onGeneratePreview,
  isGeneratingPreview,
}) => {
  const availablePlacements = printFiles?.available_placements 
    ? Object.keys(printFiles.available_placements) 
    : ["front", "back"];
  return (
    <div className="flex h-full max-h-[calc(100vh-12rem)] flex-col rounded-lg bg-white shadow">
      <div className="flex-grow overflow-y-auto p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Arrange Your Designs
        </h3>

        <div className="mb-6">
          <h4 className="mb-3 text-md font-medium text-gray-900">
            Available Files
          </h4>
          {uploadedFiles.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center">
              <Palette className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">No files uploaded yet</p>
              <button
                onClick={onPrevStep}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Go back to upload files
              </button>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 sm:grid-cols-3">
              {uploadedFiles.map((file: UploadedFile) => (
                <DesignFileManager
                  key={file.id}
                  file={file}
                  onAddDesignFile={onAddDesignFile}
                  availablePlacements={availablePlacements}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="mb-3 text-md font-medium text-gray-900">
            Design Layout
          </h4>
          {designFiles.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 py-6 text-center">
              <p className="mb-2 text-sm text-gray-600">
                No designs added to layout yet
              </p>
              <p className="text-xs text-gray-500">
                Click the &quot;+ Front&quot; or &quot;+ Back&quot; buttons
                above to add designs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {designFiles.map((file) => (
                <DesignLayoutItem
                  key={`${file.id}-${file.placement}`}
                  file={file}
                  onRemoveDesignFile={onRemoveDesignFile}
                  onUpdatePosition={onUpdateDesignPosition}
                  onSetPresetPosition={onSetPresetPosition}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={onPreviewOrder}
              disabled={designFiles.length === 0}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Preview Order Structure
            </button>
            
            {onGeneratePreview && (
              <button
                onClick={onGeneratePreview}
                disabled={designFiles.length === 0 || isGeneratingPreview}
                className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingPreview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Preview...
                  </>
                ) : (
                  'Generate Preview'
                )}
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onPrevStep}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={onNextStep}
              disabled={designFiles.length === 0}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {designFiles.length === 0
                ? "Add Designs First"
                : "Select Variants"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignStep;
