'use client';

import { Upload, Plus, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface UploadedFile {
  id: number;
  filename: string;
  thumbnail_url?: string;
  file_url?: string;
  [key: string]: unknown;
}

interface UploadTabContentProps {
  uploadedFiles: UploadedFile[];
  activePlacement: string;
  handleAddDesign: (file: UploadedFile, placement: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

const UploadTabContent: React.FC<UploadTabContentProps> = ({
  uploadedFiles,
  activePlacement,
  handleAddDesign,
  handleFileUpload,
  isUploading,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Upload Design</h3>
        <p className="text-gray-400 text-sm font-medium">Add your design files to the library</p>
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-200">
          Upload New File
        </div>
        
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`block w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 text-center ${
              isUploading
                ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                : 'border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-black/60'
            }`}
          >
            {isUploading ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <div className="text-sm font-bold text-gray-300">
                  Uploading to your library...
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-bold text-orange-400">
                  Click to choose image file
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  PNG, JPG up to 10MB
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Current Placement Info */}
      <div className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
        <div className="text-center">
          <div className="text-sm font-bold text-blue-300 mb-1">
            Current Placement
          </div>
          <div className="text-lg font-bold text-white capitalize">
            {activePlacement}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Select a design below to add to this placement
          </div>
        </div>
      </div>

      {/* Design Files Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-200">
            Your Design Library
          </div>
          <div className="text-xs text-gray-400 font-medium">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
          </div>
        </div>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8 bg-black/40 rounded-2xl border border-gray-800">
            <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl inline-flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-gray-300 mb-2">No designs yet</div>
            <div className="text-sm text-gray-500">Upload your first design file above</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="group relative">
                <div className="bg-black/60 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center p-4 space-x-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex-shrink-0">
                      <Image
                        src={file.thumbnail_url || file.file_url || ''}
                        alt={file.filename}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate mb-1">
                        {file.filename}
                      </div>
                      <div className="text-xs text-gray-400">
                        Ready to add to placement
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddDesign(file, activePlacement)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to {activePlacement}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadTabContent;