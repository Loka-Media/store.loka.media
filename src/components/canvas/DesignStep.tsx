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
  onAddDesignFile: (file: UploadedFile, placement: "front" | "back") => void;
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
}

const DesignFileManager: React.FC<DesignFileManagerProps> = ({
  file,
  onAddDesignFile,
}) => {
  return (
    <div className="group relative">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500">
        {file.thumbnail_url ? (
          <Image
            src={file.thumbnail_url}
            alt={file.filename}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-600 truncate">{file.filename}</p>
      <div className="mt-2 flex space-x-1">
        <button
          onClick={() => onAddDesignFile(file, "front")}
          className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
        >
          + Front
        </button>
        <button
          onClick={() => onAddDesignFile(file, "back")}
          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
        >
          + Back
        </button>
      </div>
    </div>
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
    <div className="bg-gray-50 rounded-lg p-3">
      <h5 className="text-xs font-medium text-gray-700 mb-2">
        Position Controls
      </h5>

      {/* Preset Positions */}
      <div className="mb-3">
        <p className="text-xs text-black mb-1">Quick Position:</p>
        <div className="grid grid-cols-3 gap-1">
          {presetPositions.map(([preset, label]) => (
            <button
              key={preset}
              onClick={() => onSetPresetPosition(file.id, preset)}
              className="text-black text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Controls */}
      <div className="grid grid-cols-2 gap-2 mb-2">
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
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
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
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
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
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
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
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
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
        <p className="text-xs text-gray-600 mb-1">Position Preview:</p>
        <div
          className="relative bg-gray-200 border border-gray-300 rounded"
          style={{
            width: "120px",
            height: "160px", // Roughly 3:4 aspect ratio like print area
          }}
        >
          <div
            className="absolute bg-indigo-500 opacity-70 border border-indigo-600 rounded-sm"
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
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">DESIGN</span>
            </div>
          </div>
          <div className="absolute bottom-1 left-1 text-xs text-gray-500 bg-white px-1 rounded">
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
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
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
            <p className="text-xs text-gray-600 capitalize">
              {file.placement} placement
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemoveDesignFile(file.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" />
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
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Arrange Your Designs
      </h3>

      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Available Files
        </h4>
        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Palette className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No files uploaded yet</p>
            <button
              onClick={onPrevStep}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              Go back to upload files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {uploadedFiles.map((file: UploadedFile) => (
              <DesignFileManager
                key={file.id}
                file={file}
                onAddDesignFile={onAddDesignFile}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Design Layout
        </h4>
        {designFiles.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              No designs added to layout yet
            </p>
            <p className="text-xs text-gray-500">
              Click the &quot;+ Front&quot; or &quot;+ Back&quot; buttons above
              to add designs
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

      <div className="flex justify-between items-center">
        <button
          onClick={onPreviewOrder}
          disabled={designFiles.length === 0}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Preview Order Structure
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onPrevStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={onNextStep}
            disabled={designFiles.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {designFiles.length === 0 ? "Add Designs First" : "Select Variants"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignStep;
