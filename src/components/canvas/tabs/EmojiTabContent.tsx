import React, { useState, useEffect } from 'react';
import { Search, Download, Grid3X3, List, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

// @ts-ignore - OpenMoji doesn't have TypeScript definitions
import openmojiData from 'openmoji/data/openmoji.json';

interface OpenMojiData {
  emoji: string;
  hexcode: string;
  group: string;
  subgroups: string;
  annotation: string;
  tags: string;
  openmoji_tags: string;
  openmoji_author: string;
  openmoji_date: string;
  skintone?: string;
  skintone_combination?: string;
  skintone_base_emoji?: string;
  skintone_base_hexcode?: string;
  unicode?: string;
  order?: number;
}

interface EmojiTabContentProps {
  onEmojiImageCreated?: (imageUrl: string, filename: string) => Promise<void>;
  onSwitchToDesignTab?: () => void;
}

const EmojiTabContent: React.FC<EmojiTabContentProps> = ({
  onEmojiImageCreated,
  onSwitchToDesignTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('smileys-emotion');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [emojiSize, setEmojiSize] = useState(128);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [isConverting, setIsConverting] = useState(false);
  const [isLoadingEmojis, setIsLoadingEmojis] = useState(true);
  const [availableEmojis, setAvailableEmojis] = useState<OpenMojiData[]>([]);

  // OpenMoji emoji groups (matching OpenMoji's actual group structure)
  const emojiGroups = {
    'smileys-emotion': { label: 'Smileys & Emotion', icon: '😀' },
    'people-body': { label: 'People & Body', icon: '👤' },
    'animals-nature': { label: 'Animals & Nature', icon: '🐻' },
    'food-drink': { label: 'Food & Drink', icon: '🍕' },
    'travel-places': { label: 'Travel & Places', icon: '🏠' },
    'activities': { label: 'Activities', icon: '⚽' },
    'objects': { label: 'Objects', icon: '💡' },
    'symbols': { label: 'Symbols', icon: '❤️' },
    'flags': { label: 'Flags', icon: '🏳️' }
  };

  // Load actual OpenMoji data
  useEffect(() => {
    const loadOpenMojiEmojis = async () => {
      setIsLoadingEmojis(true);
      
      try {
        // Filter and process OpenMoji data
        const processedEmojis: OpenMojiData[] = (openmojiData as OpenMojiData[])
          .filter((emoji: OpenMojiData) => {
            // Filter out skin tone variations and incomplete emojis
            return emoji.emoji && 
                   emoji.hexcode && 
                   !emoji.skintone &&
                   !emoji.skintone_combination &&
                   emoji.group &&
                   Object.keys(emojiGroups).includes(emoji.group);
          })
          .map((emoji: OpenMojiData) => ({
            ...emoji,
            tags: emoji.tags || '',
            openmoji_tags: emoji.openmoji_tags || ''
          }))
          .sort((a, b) => {
            // Sort by group first, then by order if available, then by hexcode
            if (a.group !== b.group) {
              return a.group.localeCompare(b.group);
            }
            if (a.order && b.order) {
              return a.order - b.order;
            }
            return a.hexcode.localeCompare(b.hexcode);
          });

        console.log(`Loaded ${processedEmojis.length} OpenMoji emojis`);
        setAvailableEmojis(processedEmojis);
        
      } catch (error) {
        console.error('Error loading OpenMoji data:', error);
        toast.error('Failed to load emoji data');
      } finally {
        setIsLoadingEmojis(false);
      }
    };

    loadOpenMojiEmojis();
  }, []);

  // Filter emojis based on search term and selected group
  const filteredEmojis = availableEmojis.filter(emoji => {
    const matchesSearch = searchTerm === '' || 
      emoji.annotation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emoji.tags.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emoji.openmoji_tags.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === 'all' || emoji.group === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  const handleEmojiClick = (emojiData: OpenMojiData) => {
    const emojiId = emojiData.hexcode;
    
    if (selectedEmojis.includes(emojiId)) {
      // Remove from selection
      setSelectedEmojis(selectedEmojis.filter(id => id !== emojiId));
    } else {
      // Add to selection (limit to 10 for performance)
      if (selectedEmojis.length < 10) {
        setSelectedEmojis([...selectedEmojis, emojiId]);
      } else {
        toast.error('Maximum 10 emojis can be selected at once');
      }
    }
  };

  const clearSelection = () => {
    setSelectedEmojis([]);
  };

  // Function to get OpenMoji SVG URL
  const getOpenMojiSvgUrl = (hexcode: string): string => {
    return `https://openmoji.org/data/color/svg/${hexcode}.svg`;
  };

  // Function to convert emoji to image using OpenMoji SVG
  const convertEmojiToImage = async (emojiData: OpenMojiData): Promise<{ imageUrl: string; filename: string }> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the SVG from OpenMoji CDN
        const svgUrl = getOpenMojiSvgUrl(emojiData.hexcode);
        const response = await fetch(svgUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG for ${emojiData.hexcode}`);
        }
        
        const svgText = await response.text();
        
        // Create a modified SVG with background if needed
        let modifiedSvg = svgText;
        if (backgroundColor !== 'transparent') {
          modifiedSvg = svgText.replace(
            '<svg',
            `<svg style="background-color: ${backgroundColor}"`
          );
        }
        
        // Create blob and convert to image
        const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Set canvas size
          canvas.width = emojiSize;
          canvas.height = emojiSize;
          
          // Set background if not transparent
          if (backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, emojiSize, emojiSize);
          }
          
          // Draw the SVG
          ctx.drawImage(img, 0, 0, emojiSize, emojiSize);
          
          // Convert to blob and upload
          canvas.toBlob(async (blob) => {
            URL.revokeObjectURL(url);
            
            if (!blob) {
              reject(new Error('Failed to convert canvas to blob'));
              return;
            }
            
            try {
              // Import the printfulAPI to use existing upload infrastructure
              const { printfulAPI } = await import('../../../lib/api');
              
              // Create a File object from the blob
              const filename = `openmoji-${emojiData.hexcode}-${Date.now()}.png`;
              const file = new File([blob], filename, { type: 'image/png' });
              
              // Upload the file
              const result = await printfulAPI.uploadFileDirectly(file);
              
              resolve({
                imageUrl: result.result.file_url,
                filename: filename
              });
              
            } catch (uploadError) {
              reject(uploadError);
            }
          }, 'image/png');
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load SVG image for ${emojiData.hexcode}`));
        };
        
        img.src = url;
        
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleCreateEmojiImages = async () => {
    if (selectedEmojis.length === 0) {
      toast.error('Please select at least one emoji');
      return;
    }

    try {
      setIsConverting(true);
      let successCount = 0;
      let errorCount = 0;

      for (const emojiId of selectedEmojis) {
        try {
          const emojiData = availableEmojis.find(e => e.hexcode === emojiId);
          if (!emojiData) {
            console.warn(`Emoji data not found for ${emojiId}`);
            errorCount++;
            continue;
          }

          // Convert emoji to image using OpenMoji SVG
          const { imageUrl, filename } = await convertEmojiToImage(emojiData);

          // Call the callback to add the emoji image to designs
          await onEmojiImageCreated?.(imageUrl, filename);
          successCount++;
          
        } catch (error) {
          console.error(`Error processing emoji ${emojiId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} OpenMoji emoji${successCount > 1 ? 's' : ''} to design!`);
        setSelectedEmojis([]); // Clear selection after successful conversion
        
        // Automatically switch to design tab
        setTimeout(() => {
          onSwitchToDesignTab?.();
        }, 1000);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} emoji${errorCount > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Error converting emojis to images:', error);
      toast.error('Failed to convert emojis to images');
    } finally {
      setIsConverting(false);
    }
  };

  const selectedEmojiData = selectedEmojis.map(id => 
    availableEmojis.find(e => e.hexcode === id)
  ).filter(Boolean) as OpenMojiData[];

  // Get unique groups from available emojis
  const availableGroups = [...new Set(availableEmojis.map(e => e.group))].sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">OpenMoji Library</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Toggle view mode"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search OpenMoji emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Group Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Category</label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
        >
          <option value="all">All Categories ({availableEmojis.length})</option>
          {availableGroups.map((groupKey) => {
            const count = availableEmojis.filter(e => e.group === groupKey).length;
            const groupInfo = emojiGroups[groupKey as keyof typeof emojiGroups];
            return (
              <option key={groupKey} value={groupKey}>
                {groupInfo ? `${groupInfo.icon} ${groupInfo.label}` : groupKey} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Selected Emojis Display */}
      {selectedEmojis.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-700">
              Selected ({selectedEmojis.length}/10)
            </label>
            <button
              onClick={clearSelection}
              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-md border max-h-20 overflow-y-auto">
            {selectedEmojiData.map((emoji) => (
              <div
                key={emoji.hexcode}
                className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs"
              >
                <span title={emoji.annotation}>{emoji.emoji}</span>
                <button
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Grid/List */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Choose OpenMoji Emojis {filteredEmojis.length > 0 && `(${filteredEmojis.length} available)`}
        </label>
        
        {isLoadingEmojis ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading OpenMoji emojis...</span>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-6 gap-1' 
              : 'space-y-1'
          } max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2`}>
            {filteredEmojis.map((emojiData) => {
              const isSelected = selectedEmojis.includes(emojiData.hexcode);
              
              if (viewMode === 'list') {
                return (
                  <button
                    key={emojiData.hexcode}
                    onClick={() => handleEmojiClick(emojiData)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md border transition-all hover:bg-gray-50 text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{emojiData.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {emojiData.annotation}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {emojiData.tags?.split(' ').slice(0, 3).join(', ') || emojiData.group}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                        <Plus className="w-2 h-2 text-white rotate-45" />
                      </div>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={emojiData.hexcode}
                  onClick={() => handleEmojiClick(emojiData)}
                  className={`aspect-square p-1 rounded-md border transition-all hover:bg-gray-50 relative ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                  title={`${emojiData.annotation} (${emojiData.hexcode})`}
                >
                  <span className="text-lg">{emojiData.emoji}</span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
                      <Plus className="w-2 h-2 text-white rotate-45" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization Options */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
          <select
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="transparent">Transparent</option>
            <option value="#ffffff">White</option>
            <option value="#000000">Black</option>
            <option value="#f3f4f6">Light Gray</option>
            <option value="#ddd6fe">Light Purple</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Size: {emojiSize}px</label>
          <input
            type="range"
            min="64"
            max="512"
            step="32"
            value={emojiSize}
            onChange={(e) => setEmojiSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Preview */}
      {selectedEmojiData.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Preview</label>
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border">
            {selectedEmojiData.slice(0, 5).map((emoji) => (
              <div
                key={emoji.hexcode}
                className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center text-lg"
                style={{ backgroundColor: backgroundColor === 'transparent' ? '#f9fafb' : backgroundColor }}
                title={emoji.annotation}
              >
                {emoji.emoji}
              </div>
            ))}
            {selectedEmojiData.length > 5 && (
              <div className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center text-xs text-gray-500 bg-gray-100">
                +{selectedEmojiData.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleCreateEmojiImages}
        disabled={selectedEmojis.length === 0 || isConverting}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isConverting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Converting OpenMoji Emojis...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Add {selectedEmojis.length > 0 ? `${selectedEmojis.length} ` : ''}OpenMoji{selectedEmojis.length !== 1 ? 's' : ''} to Design
          </>
        )}
      </button>

      {!isLoadingEmojis && availableEmojis.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No OpenMoji emojis found. Please check your connection.</p>
        </div>
      )}
    </div>
  );
};

export default EmojiTabContent;