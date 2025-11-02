import React, { useState } from 'react';
import { Upload, Image as ImageIcon, CloudUpload, Type, Smile, Heart } from 'lucide-react';
import Image from 'next/image';
import { UploadedFile } from '../types';
import TextTabContent from './TextTabContent';
import ClipartTabContent from './ClipartTabContent';
import EmojiTabContent from './EmojiTabContent';

interface UploadTabContentProps {
  uploadedFiles: UploadedFile[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  onRefreshFiles?: () => void;
  textContent?: string;
  setTextContent?: (content: string) => void;
  handleAddTextToDesign?: () => void;
  activePlacement?: string;
  onTextImageCreated?: (url: string, filename: string) => Promise<void>;
  onClipartImageCreated?: (url: string, filename: string) => Promise<void>;
  onEmojiImageCreated?: (url: string, filename: string) => Promise<void>;
  userId?: number;
}

const UploadTabContent: React.FC<UploadTabContentProps> = ({
  uploadedFiles,
  handleFileUpload,
  isUploading,
  onRefreshFiles,
  textContent = '',
  setTextContent = () => {},
  handleAddTextToDesign = () => {},
  activePlacement = '',
  onTextImageCreated = async () => {},
  onClipartImageCreated = async () => {},
  onEmojiImageCreated = async () => {},
  userId = 1,
}) => {
  const [activeUploadSubTab, setActiveUploadSubTab] = useState<'files' | 'text' | 'clipart' | 'emoji'>('files');

  const uploadSubTabs = [
    { id: 'files' as const, label: 'Files', icon: Upload },
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'clipart' as const, label: 'Clipart', icon: Smile },
    { id: 'emoji' as const, label: 'Emoji', icon: Heart },
  ];

  const renderSubTabContent = () => {
    switch (activeUploadSubTab) {
      case 'files':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl inline-flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upload Files</h3>
              <p className="text-gray-400 text-sm font-medium">Add your design files to your library</p>
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
                  className={`block w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 text-center ${
                    isUploading
                      ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                      : 'border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-black/60'
                  }`}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                      <div className="text-lg font-bold text-gray-300">
                        Uploading to your library...
                      </div>
                      <div className="text-sm text-gray-500">
                        Please wait while we process your file
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center">
                        <CloudUpload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-400 mb-2">
                          Click to choose image file
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                          PNG, JPG, SVG up to 10MB
                        </div>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* File Library */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-200">
                  Your Design Library
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 font-medium">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
                  </div>
                  {onRefreshFiles && (
                    <button
                      onClick={onRefreshFiles}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                    >
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12 bg-black/40 rounded-2xl border border-gray-800">
                  <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl inline-flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-lg font-bold text-gray-300 mb-2">No designs yet</div>
                  <div className="text-sm text-gray-500 mb-4">Upload your first design file above</div>
                  <div className="text-xs text-gray-600">
                    Go to the Design tab to start creating your product
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="group relative">
                      <div className="bg-black/60 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
                        <div className="aspect-square bg-gray-800 flex items-center justify-center">
                          <Image
                            src={file.thumbnail_url || file.file_url || ''}
                            alt={file.filename}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-white truncate mb-1">
                            {file.filename}
                          </div>
                          <div className="text-xs text-gray-400">
                            Ready to use in designs
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
              <div className="text-sm font-bold text-blue-300 mb-2">
                💡 Next Steps
              </div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>1. Upload your design files here</div>
                <div>2. Or create text, clipart, or emoji in the tabs above</div>
                <div>3. Go to Design tab to place on products</div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <TextTabContent
            textContent={textContent}
            setTextContent={setTextContent}
            handleAddTextToDesign={handleAddTextToDesign}
            activePlacement={activePlacement}
            onTextImageCreated={onTextImageCreated}
            userId={userId}
          />
        );

      case 'clipart':
        return (
          <ClipartTabContent
            onClipartImageCreated={onClipartImageCreated}
          />
        );

      case 'emoji':
        return (
          <EmojiTabContent
            onEmojiImageCreated={onEmojiImageCreated}
            onSwitchToDesignTab={() => {}}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="border-b border-gray-800 flex-shrink-0">
        <div className="flex gap-2 px-0 py-2">
          {uploadSubTabs.map((subTab) => {
            const IconComponent = subTab.icon;
            return (
              <button
                key={subTab.id}
                onClick={() => setActiveUploadSubTab(subTab.id)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeUploadSubTab === subTab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {subTab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default UploadTabContent;