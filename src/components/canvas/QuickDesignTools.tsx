"use client";

import React, { useState } from "react";
import {
  Upload as UploadIcon,
  Type,
  Image as ImageIcon,
  Smile,
  X,
  FileImage,
  Sparkles,
  Trash2,
} from "lucide-react";
import { UploadedFile } from "./types";

interface QuickDesignToolsProps {
  onUploadImage: (file: File) => Promise<void>;
  onCreateText: () => void;
  onBrowseClipart: () => void;
  onAddEmoji: () => void;
  onSelectExistingFile: (file: UploadedFile) => void;
  onDeleteFile?: (fileId: number | string) => Promise<void>;
  uploadedFiles: UploadedFile[];
  isUploading?: boolean;
}

const QuickDesignTools: React.FC<QuickDesignToolsProps> = ({
  onUploadImage,
  onCreateText,
  onBrowseClipart,
  onAddEmoji,
  onSelectExistingFile,
  onDeleteFile,
  uploadedFiles,
  isUploading = false,
}) => {
  const [showExistingFiles, setShowExistingFiles] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadImage(file);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: number | string) => {
    e.stopPropagation(); // Prevent triggering file selection
    if (!onDeleteFile) return;

    const confirmed = window.confirm("Are you sure you want to delete this file? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingFileId(fileId);
      await onDeleteFile(fileId);
    } catch (error) {
      console.error("Failed to delete file:", error);
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Upload New Image */}
        <label className="relative cursor-pointer group">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all h-full">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-yellow-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
                <UploadIcon className="w-8 h-8 text-black" />
              </div>
              <div>
                <h4 className="font-extrabold text-black text-lg mb-1">Upload Image</h4>
                <p className="text-sm text-gray-600 font-bold">
                  PNG, JPG, or SVG
                </p>
              </div>
              {isUploading && (
                <div className="text-xs font-bold text-orange-600">
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Create Text */}
        <button
          onClick={onCreateText}
          className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all group"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-pink-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
              <Type className="w-8 h-8 text-black" />
            </div>
            <div>
              <h4 className="font-extrabold text-black text-lg mb-1">Add Text</h4>
              <p className="text-sm text-gray-600 font-bold">
                Custom fonts & styles
              </p>
            </div>
          </div>
        </button>

        {/* Browse Clipart */}
        <button
          onClick={onBrowseClipart}
          className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all group"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-purple-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h4 className="font-extrabold text-black text-lg mb-1">Clipart Library</h4>
              <p className="text-sm text-gray-600 font-bold">
                1000s of graphics
              </p>
            </div>
          </div>
        </button>

        {/* Add Emoji */}
        <button
          onClick={onAddEmoji}
          className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all group"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-green-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
              <Smile className="w-8 h-8 text-black" />
            </div>
            <div>
              <h4 className="font-extrabold text-black text-lg mb-1">Add Emoji</h4>
              <p className="text-sm text-gray-600 font-bold">
                Fun & expressive
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Previously Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border-4 border-black rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-black text-lg flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Your Uploaded Files ({uploadedFiles.length})
            </h4>
            <button
              onClick={() => setShowExistingFiles(!showExistingFiles)}
              className="text-sm font-extrabold text-black underline hover:text-orange-600"
            >
              {showExistingFiles ? "Hide" : "Show"}
            </button>
          </div>

          {showExistingFiles && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(showAllFiles ? uploadedFiles : uploadedFiles.slice(0, 12)).map((file) => (
                  <div key={file.id} className="relative">
                    <button
                      onClick={() => onSelectExistingFile(file)}
                      disabled={deletingFileId === file.id}
                      className="group relative bg-gray-100 border-2 border-gray-300 rounded-xl p-2 hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="aspect-square bg-white border-2 border-black rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-black truncate">
                        {file.filename}
                      </p>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <Sparkles className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs font-bold">Use This</p>
                        </div>
                      </div>
                    </button>

                    {/* Delete button */}
                    {onDeleteFile && (
                      <button
                        onClick={(e) => handleDeleteFile(e, file.id)}
                        disabled={deletingFileId === file.id}
                        className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete file"
                      >
                        {deletingFileId === file.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {uploadedFiles.length > 12 && (
                <button
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="text-sm font-bold text-black mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-blue-200 to-purple-200 border-2 border-black rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  {showAllFiles
                    ? "Show Less"
                    : `+ ${uploadedFiles.length - 12} more files available`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-yellow-100 to-pink-100 border-2 border-black rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-extrabold text-black mb-1">Design Tips</h5>
            <ul className="text-sm text-black font-bold space-y-1">
              <li>• Use high-resolution images (at least 300 DPI)</li>
              <li>• PNG files with transparent backgrounds work best</li>
              <li>• Keep text readable - not too small!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickDesignTools;
