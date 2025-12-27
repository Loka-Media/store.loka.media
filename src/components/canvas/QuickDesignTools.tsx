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
  AlertTriangle,
  Check,
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
  selectedFileId?: number | string;
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
  selectedFileId,
}) => {
  const [showExistingFiles, setShowExistingFiles] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: number | string; filename: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadImage(file);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, file: UploadedFile) => {
    e.stopPropagation(); // Prevent triggering file selection
    if (!onDeleteFile) return;

    setFileToDelete({ id: file.id, filename: file.filename });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete || !onDeleteFile) return;

    try {
      setDeletingFileId(fileToDelete.id);
      await onDeleteFile(fileToDelete.id);
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Failed to delete file:", error);
    } finally {
      setDeletingFileId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Main Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Upload New Image */}
        <label className="relative cursor-pointer group">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all h-full bg-gray-800">
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg group-hover:scale-110 transition-transform">
                <UploadIcon className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-lg mb-1">Upload Image</div>
                <p className="text-xs sm:text-sm text-gray-400">
                  PNG, JPG, or SVG
                </p>
              </div>
              {isUploading && (
                <div className="text-xs text-orange-400">
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Create Text */}
        <button
          onClick={onCreateText}
          className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all group bg-gray-800"
        >
          <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg group-hover:scale-110 transition-transform">
              <Type className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-lg mb-1">Add Text</div>
              <p className="text-xs sm:text-sm text-gray-400">
                Custom fonts & styles
              </p>
            </div>
          </div>
        </button>

        {/* Browse Clipart */}
        <button
          onClick={onBrowseClipart}
          className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all group bg-gray-800"
        >
          <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg group-hover:scale-110 transition-transform">
              <ImageIcon className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-lg mb-1">Clipart Library</div>
              <p className="text-xs sm:text-sm text-gray-400">
                1000s of graphics
              </p>
            </div>
          </div>
        </button>

        {/* Add Emoji */}
        <button
          onClick={onAddEmoji}
          className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all group bg-gray-800"
        >
          <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg group-hover:scale-110 transition-transform">
              <Smile className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-lg mb-1">Add Emoji</div>
              <p className="text-xs sm:text-sm text-gray-400">
                Fun & expressive
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Previously Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-white text-xs sm:text-lg flex items-center gap-2">
              <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />
              Your Uploaded Files ({uploadedFiles.length})
            </div>
            <button
              onClick={() => setShowExistingFiles(!showExistingFiles)}
              className="text-xs sm:text-sm text-orange-400 underline hover:text-orange-300"
            >
              {showExistingFiles ? "Hide" : "Show"}
            </button>
          </div>

          {showExistingFiles && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
                {(showAllFiles ? uploadedFiles : uploadedFiles.slice(0, 12)).map((file) => {
                  const isSelected = selectedFileId === file.id;
                  return (
                  <div key={file.id} className="relative">
                    <button
                      onClick={() => onSelectExistingFile(file)}
                      className={`group relative rounded-lg p-1 sm:p-2 transition-all w-full ${
                        isSelected
                          ? "bg-black border-2 border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                          : "bg-black border-2 border-gray-600 hover:border-white hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                      }`}
                    >
                      <div className="aspect-square bg-gray-600 border border-gray-500 rounded-lg mb-1 sm:mb-2 overflow-hidden flex items-center justify-center">
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 sm:w-8 sm:h-8 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-200 truncate line-clamp-1">
                        {file.filename}
                      </p>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1" />
                          <p className="text-xs">Use This</p>
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-white border border-white rounded-full p-1 sm:p-2 shadow-[0_4px_12px_rgba(255,255,255,0.3)]">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                        </div>
                      )}
                    </button>
                  </div>
                );
                })}
              </div>

              {uploadedFiles.length > 12 && (
                <button
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="text-xs sm:text-sm text-orange-400 mt-4 mx-auto block px-3 sm:px-6 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all"
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
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white mb-1">Design Tips</div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Use high-resolution images (at least 300 DPI)</li>
              <li>• PNG files with transparent backgrounds work best</li>
              <li>• Keep text readable - not too small!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="gradient-border-white-bottom rounded-lg bg-gray-900 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-[0_10px_30px_rgba(255,133,27,0.2)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-lg p-6 border-b border-orange-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">Delete File?</div>
                  <p className="text-sm text-orange-200">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 border-b border-gray-700">
              <p className="text-white mb-2">
                Are you sure you want to delete this file?
              </p>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-200 truncate">
                  📄 {fileToDelete.filename}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                This file will be permanently removed from your library and cannot be recovered.
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 flex gap-3 rounded-b-lg">
              <button
                onClick={cancelDelete}
                disabled={deletingFileId === fileToDelete.id}
                className="flex-1 px-6 py-3 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-gray-600 hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingFileId === fileToDelete.id}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingFileId === fileToDelete.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickDesignTools;
