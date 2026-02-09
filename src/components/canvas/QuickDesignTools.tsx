"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileImage,
  Trash2,
  AlertTriangle,
  Check,
  Sparkles,
  ImageIcon,
  Upload,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { UploadedFile } from "./types";

interface QuickDesignToolsProps {
  onSelectExistingFile: (file: UploadedFile) => void;
  onDeleteFile?: (fileId: number | string) => Promise<void>;
  uploadedFiles: UploadedFile[];
  selectedFileId?: number | string;
  productId?: number | string;
}

const QuickDesignTools: React.FC<QuickDesignToolsProps> = ({
  onSelectExistingFile,
  onDeleteFile,
  uploadedFiles,
  selectedFileId,
  productId,
}) => {
  const router = useRouter();
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: number | string; filename: string } | null>(null);

  const handleUploadClick = () => {
    const returnUrl = productId
      ? `/dashboard/creator/canvas?productId=${productId}`
      : '/dashboard/creator/canvas';
    router.push(`/dashboard/creator/files?returnTo=${encodeURIComponent(returnUrl)}`);
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
      {/* Upload New Files Button */}
      <div className="gradient-border-white-top rounded-lg p-4 sm:p-6 bg-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-sm sm:text-lg flex items-center gap-2">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Need more designs?
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Upload new files to use in your product
            </p>
          </div>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Upload New Files</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 ? (
        <div className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 bg-gray-800">
          <div className="mb-4">
            <div className="font-bold text-white text-xs sm:text-lg flex items-center gap-2">
              <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />
              Your Uploaded Files ({uploadedFiles.length})
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Click on a file to add it to the selected placement
            </p>
          </div>

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
                            <Image
                              src={file.thumbnail_url}
                              alt={file.filename}
                              className="w-full h-full object-cover"
                              fill
                              sizes="100%"
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
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
            </div>
            <p className="text-white font-bold text-sm sm:text-base mb-2">
              No Design Files Yet
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mb-6">
              Upload your design files to get started
            </p>
            <Link
              href="/dashboard/creator/files"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Files
            </Link>
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
