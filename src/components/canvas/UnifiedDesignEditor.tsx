'use client';

import { useState, useEffect } from 'react';
import { printfulAPI } from '@/lib/api';
import Image from 'next/image';
import { Rnd } from 'react-rnd';
import { 
  Palette, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Trash2,
  Plus,
  Settings,
  Layers,
  ChevronRight,
  ChevronDown,
  Upload,
  Save,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdvancedMockupOptions from './AdvancedMockupOptions';
import ImageModal from '../ui/ImageModal';

interface PrintFile {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
}

interface PrintFilesData {
  product_id: number;
  available_placements: Record<string, string>;
  printfiles: PrintFile[];
  variant_printfiles: Array<{
    variant_id: number;
    placements: Record<string, number>;
  }>;
}

interface DesignFile {
  id: number;
  filename: string;
  url: string;
  placement: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface Product {
  id: number;
  name: string;
  variants?: Array<{
    id: number;
    size: string;
    color: string;
    color_code: string;
    image: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface UploadedFile {
  id: number;
  filename: string;
  thumbnail_url?: string;
  file_url?: string;
  [key: string]: unknown;
}

interface UnifiedDesignEditorProps {
  selectedProduct: Product;
  selectedVariants: number[];
  setSelectedVariants: (variants: number[]) => void;
  designFiles: DesignFile[];
  setDesignFiles: (files: DesignFile[]) => void;
  uploadedFiles: UploadedFile[];
  printFiles: PrintFilesData | null;
  onGeneratePreview: (advancedOptions?: {
    technique?: string;
    optionGroups?: string[];
    options?: string[];
    lifelike?: boolean;
    width?: number;
  }) => void;
  isGeneratingPreview: boolean;
  mockupUrls?: Array<{url: string; placement: string; variant_ids: number[]; title?: string; option?: string; option_group?: string}>;
  mockupStatus?: string;
  onNext: () => void;
  onPrev: () => void;
  onPrintFilesLoaded?: (printFiles: PrintFilesData) => void;
  onRefreshFiles?: () => void; // Add callback to refresh files
}

const UnifiedDesignEditor: React.FC<UnifiedDesignEditorProps> = ({
  selectedProduct,
  selectedVariants,
  setSelectedVariants,
  designFiles,
  setDesignFiles,
  uploadedFiles,
  printFiles,
  onGeneratePreview,
  isGeneratingPreview,
  mockupUrls,
  mockupStatus,
  onNext,
  onPrev,
  onPrintFilesLoaded,
  onRefreshFiles
}) => {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activePlacement, setActivePlacement] = useState<string>('front');
  const [selectedDesignFile, setSelectedDesignFile] = useState<DesignFile | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [loadingPrintFiles, setLoadingPrintFiles] = useState(false);
  const [printFilesLoaded, setPrintFilesLoaded] = useState(false);
  
  // Advanced mockup options state
  const [selectedTechnique, setSelectedTechnique] = useState<string>('');
  const [selectedOptionGroups, setSelectedOptionGroups] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [lifelikeEnabled, setLifelikeEnabled] = useState<boolean>(false);
  const [mockupWidth, setMockupWidth] = useState<number>(1000);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  
  // Modal state for image viewing
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  
  // File upload and storage state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isStoringMockups, setIsStoringMockups] = useState<boolean>(false);

  // Get unique sizes and colors
  const uniqueSizes = [...new Set(selectedProduct?.variants?.map((v) => v.size) || [])];
  const colorMap = new Map();
  selectedProduct?.variants?.forEach((v) => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        name: v.color,
        code: v.color_code,
        image: v.image
      });
    }
  });
  const uniqueColors = Array.from(colorMap.values());

  // Update selected variants when size/color changes
  useEffect(() => {
    if (!selectedProduct?.variants) return;
    
    const filteredVariants = selectedProduct.variants.filter((variant) => 
      selectedSizes.includes(variant.size) && selectedColors.includes(variant.color)
    );
    
    setSelectedVariants(filteredVariants.map((v) => v.id));
  }, [selectedSizes, selectedColors, selectedProduct, setSelectedVariants]);

  // Auto-load print files when variants are selected
  useEffect(() => {
    const loadPrintFiles = async () => {
      if (selectedVariants.length === 0 || !selectedProduct?.id || printFilesLoaded || loadingPrintFiles) {
        return;
      }
      
      try {
        setLoadingPrintFiles(true);
        
        // Get print files using the API
        const printFilesResponse = await printfulAPI.getPrintFiles(selectedProduct.id);
        
        if (printFilesResponse?.result) {
          onPrintFilesLoaded?.(printFilesResponse.result);
          setPrintFilesLoaded(true);
          toast.success('Print files loaded successfully!');
        } else {
          console.warn('No print files data received');
        }
      } catch (error) {
        console.error('Failed to load print files:', error);
        toast.error('Failed to load print files');
      } finally {
        setLoadingPrintFiles(false);
      }
    };

    if (selectedVariants.length > 0 && !printFilesLoaded && !loadingPrintFiles) {
      loadPrintFiles();
    }
  }, [selectedVariants.length, selectedProduct?.id, printFilesLoaded, loadingPrintFiles, onPrintFilesLoaded]);

  // Get print file dimensions for active placement
  const getActivePrintFile = () => {
    if (!printFiles || selectedVariants.length === 0) return null;
    
    const variantPrintFile = printFiles.variant_printfiles.find(
      vp => selectedVariants.includes(vp.variant_id)
    );
    
    if (!variantPrintFile) return null;
    
    const printFileId = variantPrintFile.placements[activePlacement];
    return printFiles.printfiles.find(pf => pf.printfile_id === printFileId);
  };

  const activePrintFile = getActivePrintFile();

  // Handle adding design to placement
  const handleAddDesign = (file: UploadedFile, placement: string): void => {
    const printFile = printFiles?.printfiles.find(pf => {
      const variantPrintFile = printFiles.variant_printfiles.find(
        vp => selectedVariants.includes(vp.variant_id)
      );
      return variantPrintFile && pf.printfile_id === variantPrintFile.placements[placement];
    });

    if (!printFile) {
      toast.error('No print file found for this placement');
      return;
    }

    const existingDesign = designFiles.find(df => df.placement === placement);
    if (existingDesign) {
      toast.error(`${placement} already has a design`);
      return;
    }

    const defaultWidth = Math.min(printFile.width * 0.6, printFile.width);
    const defaultHeight = Math.min(printFile.height * 0.6, printFile.height);

    const newDesign: DesignFile = {
      id: Date.now(),
      filename: file.filename,
      url: file.thumbnail_url || file.file_url,
      placement,
      position: {
        area_width: printFile.width,
        area_height: printFile.height,
        width: defaultWidth,
        height: defaultHeight,
        top: (printFile.height - defaultHeight) / 2,
        left: (printFile.width - defaultWidth) / 2,
      },
    };

    setDesignFiles([...designFiles, newDesign]);
    setActivePlacement(placement);
    setSelectedDesignFile(newDesign);
    toast.success(`Design added to ${placement}`);
  };

  // Handle removing design
  const handleRemoveDesign = (designId: number) => {
    setDesignFiles(designFiles.filter(df => df.id !== designId));
    if (selectedDesignFile?.id === designId) {
      setSelectedDesignFile(null);
    }
    toast.success('Design removed');
  };

  // Handle position updates
  const updateDesignPosition = (designId: number, updates: Partial<DesignFile['position']>): void => {
    console.log('Updating design position:', designId, updates);
    
    setDesignFiles(designFiles.map(df => 
      df.id === designId 
        ? { ...df, position: { ...df.position, ...updates } }
        : df
    ));
    
    if (selectedDesignFile?.id === designId) {
      setSelectedDesignFile({
        ...selectedDesignFile,
        position: { ...selectedDesignFile.position, ...updates }
      });
    }
  };

  // Get active design for current placement
  const activeDesign = designFiles.find(df => df.placement === activePlacement);

  // Handle modal opening
  const openImageModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const result = await printfulAPI.uploadFileDirectly(file);
      
      if (result.code === 200) {
        // Refresh uploaded files list
        if (onRefreshFiles) {
          onRefreshFiles();
        }
        toast.success(`✅ File "${file.name}" uploaded successfully!`);
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle finalize mockups (go to product details step)
  const handleFinalizeMockups = () => {
    if (!mockupUrls || mockupUrls.length === 0) {
      toast.error('No mockups to finalize. Generate mockups first.');
      return;
    }

    toast.success('Mockups ready! Now add your product details.');
    onNext(); // Go to product details step
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Professional Design Editor</h2>
        <p className="text-indigo-100 text-sm">Create your custom product design</p>
      </div>

      {/* Workflow Progress */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center ${uploadedFiles.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs font-bold ${uploadedFiles.length > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>1</div>
            Upload & Design {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${mockupUrls && mockupUrls.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs font-bold ${mockupUrls && mockupUrls.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>2</div>
            Generate Mockups {mockupUrls && mockupUrls.length > 0 && `(${mockupUrls.length})`}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center text-gray-400`}>
            <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-400">3</div>
            Finalize & Go Live
          </div>
        </div>
      </div>

      <div className="flex h-[800px]">
        {/* Left Sidebar - Variants & Files */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          {/* Variant Selection */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Product Variants
            </h3>
            
            {/* Size Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSizes(prev => 
                      prev.includes(size) 
                        ? prev.filter(s => s !== size)
                        : [...prev, size]
                    )}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                      selectedSizes.includes(size)
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Colors</label>
              <div className="grid grid-cols-2 gap-2">
                {uniqueColors.map((color: { name: string; code: string; image: string }) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColors(prev => 
                      prev.includes(color.name) 
                        ? prev.filter(c => c !== color.name)
                        : [...prev, color.name]
                    )}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedColors.includes(color.name)
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-300 hover:border-indigo-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-gray-400 shadow-sm"
                        style={{ backgroundColor: color.code }}
                      />
                      <span className="text-xs font-semibold text-gray-900">{color.name}</span>
                    </div>
                    <div className="w-full h-10 bg-gray-100 rounded overflow-hidden border border-gray-200">
                      <Image
                        src={color.image}
                        alt={color.name}
                        width={80}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Variants Summary */}
            {selectedVariants.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-800 font-bold">
                    {selectedVariants.length} variants selected
                  </span>
                  <span className="text-green-700 font-medium">
                    {selectedSizes.length} × {selectedColors.length}
                  </span>
                </div>
                {loadingPrintFiles && (
                  <div className="flex items-center space-x-2 text-indigo-600 mt-3 bg-white rounded-lg p-2 border border-indigo-200">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-sm font-medium">Loading print files...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placement Selection */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Placements
            </h3>
            <div className="space-y-2">
              {printFiles && Object.entries(printFiles.available_placements).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActivePlacement(key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between ${
                    activePlacement === key
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{label}</span>
                  {designFiles.some(df => df.placement === key) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Design Files */}
          {/* File Upload */}
          <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-blue-600" />
              Upload New Design
            </h3>
            
            <div className="mb-2">
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
                className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isUploading
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 bg-white'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm font-medium text-gray-600">Uploading to your library...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-semibold text-blue-600">Choose Image File</span>
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB • Stored permanently in your account</p>
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Your Design Files ({uploadedFiles.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={file.thumbnail_url || file.file_url}
                      alt={file.filename}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleAddDesign(file, activePlacement)}
                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.filename}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Design Canvas */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <button
              onClick={() => setCanvasZoom(Math.min(200, canvasZoom + 10))}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCanvasZoom(Math.max(50, canvasZoom - 10))}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium">
              {canvasZoom}%
            </span>
          </div>

          {/* Canvas Area */}
          <div className="flex items-center justify-center h-full p-8">
            {activePrintFile ? (
              <div 
                className="relative bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300"
                style={{
                  width: (activePrintFile.width / 4) * (canvasZoom / 100),
                  height: (activePrintFile.height / 4) * (canvasZoom / 100),
                }}
              >
                {/* Print Area Label */}
                <div className="absolute -top-6 left-0 text-xs text-gray-500">
                  {activePlacement.toUpperCase()} - {activePrintFile.width}×{activePrintFile.height}px
                </div>
                
                {/* Design on Canvas with Drag & Resize */}
                {activeDesign && activePrintFile && (
                  <Rnd
                    size={{
                      width: (activeDesign.position.width / 4) * (canvasZoom / 100),
                      height: (activeDesign.position.height / 4) * (canvasZoom / 100),
                    }}
                    position={{
                      x: (activeDesign.position.left / 4) * (canvasZoom / 100),
                      y: (activeDesign.position.top / 4) * (canvasZoom / 100),
                    }}
                    bounds="parent"
                    onDragStop={(e, d) => {
                      const newLeft = (d.x * 4) / (canvasZoom / 100);
                      const newTop = (d.y * 4) / (canvasZoom / 100);
                      updateDesignPosition(activeDesign.id, { 
                        left: Math.max(0, Math.min(newLeft, activePrintFile.width - activeDesign.position.width)),
                        top: Math.max(0, Math.min(newTop, activePrintFile.height - activeDesign.position.height))
                      });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const newWidth = (parseFloat(ref.style.width) * 4) / (canvasZoom / 100);
                      const newHeight = (parseFloat(ref.style.height) * 4) / (canvasZoom / 100);
                      const newLeft = (position.x * 4) / (canvasZoom / 100);
                      const newTop = (position.y * 4) / (canvasZoom / 100);
                      
                      updateDesignPosition(activeDesign.id, {
                        width: Math.max(50, Math.min(newWidth, activePrintFile.width)),
                        height: Math.max(50, Math.min(newHeight, activePrintFile.height)),
                        left: Math.max(0, Math.min(newLeft, activePrintFile.width - newWidth)),
                        top: Math.max(0, Math.min(newTop, activePrintFile.height - newHeight))
                      });
                    }}
                    onClick={() => setSelectedDesignFile(activeDesign)}
                    className={`border-2 ${selectedDesignFile?.id === activeDesign.id ? 'border-indigo-500' : 'border-gray-300'} bg-indigo-500 bg-opacity-10 cursor-move relative`}
                    enableResizing={{
                      top: true,
                      right: true,
                      bottom: true,
                      left: true,
                      topRight: true,
                      bottomRight: true,
                      bottomLeft: true,
                      topLeft: true,
                    }}
                    resizeHandleStyles={{
                      topRight: { background: '#4f46e5', width: '8px', height: '8px' },
                      topLeft: { background: '#4f46e5', width: '8px', height: '8px' },
                      bottomRight: { background: '#4f46e5', width: '8px', height: '8px' },
                      bottomLeft: { background: '#4f46e5', width: '8px', height: '8px' },
                      top: { background: '#4f46e5', height: '8px' },
                      right: { background: '#4f46e5', width: '8px' },
                      bottom: { background: '#4f46e5', height: '8px' },
                      left: { background: '#4f46e5', width: '8px' },
                    }}
                  >
                    <div className="w-full h-full relative">
                      <Image
                        src={activeDesign.url}
                        alt={activeDesign.filename}
                        fill
                        className="object-contain pointer-events-none"
                      />
                      {selectedDesignFile?.id === activeDesign.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDesign(activeDesign.id);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg z-10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </Rnd>
                )}

                {/* Drop Zone */}
                {!activeDesign && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Drop design here</p>
                      <p className="text-xs">or select from files</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select variants to see design canvas</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Position Controls & Preview */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
          {/* Position Controls */}
          {selectedDesignFile && activePrintFile && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Move className="w-4 h-4 mr-2" />
                Position Controls
              </h3>
              
              <div className="space-y-4">
                {/* Size Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.width)}
                      onChange={(e) => updateDesignPosition(selectedDesignFile.id, {
                        width: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                      min="50"
                      max={activePrintFile.width}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.height)}
                      onChange={(e) => updateDesignPosition(selectedDesignFile.id, {
                        height: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                      min="50"
                      max={activePrintFile.height}
                    />
                  </div>
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Top</label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.top)}
                      onChange={(e) => updateDesignPosition(selectedDesignFile.id, {
                        top: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                      min="0"
                      max={activePrintFile.height - selectedDesignFile.position.height}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Left</label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.left)}
                      onChange={(e) => updateDesignPosition(selectedDesignFile.id, {
                        left: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                      min="0"
                      max={activePrintFile.width - selectedDesignFile.position.width}
                    />
                  </div>
                </div>

                {/* Quick Position Presets */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Quick Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['top-left', 'TL'], ['top-center', 'TC'], ['top-right', 'TR'],
                      ['center-left', 'CL'], ['center', 'C'], ['center-right', 'CR'],
                      ['bottom-left', 'BL'], ['bottom-center', 'BC'], ['bottom-right', 'BR']
                    ].map(([position, label]) => (
                      <button
                        key={position}
                        onClick={() => {
                          const { width, height, area_width, area_height } = selectedDesignFile.position;
                          
                          let top = 0, left = 0;
                          
                          // Calculate vertical position
                          if (position.includes('center') && !position.includes('top') && !position.includes('bottom')) {
                            top = (area_height - height) / 2;
                          } else if (position.includes('bottom')) {
                            top = area_height - height;
                          }
                          // top-* positions stay at top = 0
                          
                          // Calculate horizontal position
                          if (position.includes('center') && !position.includes('left') && !position.includes('right')) {
                            left = (area_width - width) / 2;
                          } else if (position.includes('right')) {
                            left = area_width - width;
                          }
                          // *-left positions stay at left = 0
                          
                          updateDesignPosition(selectedDesignFile.id, { top, left });
                        }}
                        className="px-3 py-2 text-sm font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mockup Options */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all"
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-semibold text-purple-900">Advanced Mockup Options</span>
              </div>
              {showAdvancedOptions ? (
                <ChevronDown className="w-5 h-5 text-purple-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-purple-600" />
              )}
            </button>
            
            {showAdvancedOptions && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                <AdvancedMockupOptions
                  selectedProduct={selectedProduct}
                  selectedTechnique={selectedTechnique}
                  onTechniqueChange={setSelectedTechnique}
                  selectedOptionGroups={selectedOptionGroups}
                  onOptionGroupsChange={setSelectedOptionGroups}
                  selectedOptions={selectedOptions}
                  onOptionsChange={setSelectedOptions}
                  lifelikeEnabled={lifelikeEnabled}
                  onLifelikeChange={setLifelikeEnabled}
                  mockupWidth={mockupWidth}
                  onWidthChange={setMockupWidth}
                />
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </h3>
            
            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              {isGeneratingPreview ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Generating preview...</p>
                    {mockupStatus && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                          {mockupStatus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : mockupUrls && mockupUrls.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600 mb-3">✅ {mockupUrls.length} Mockup{mockupUrls.length > 1 ? 's' : ''} Generated</p>
                  </div>
                  
                  {/* Organize mockups by placement and option group */}
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {(() => {
                      // Group mockups by placement
                      const groupedByPlacement = mockupUrls.reduce((acc, mockup) => {
                        if (!acc[mockup.placement]) {
                          acc[mockup.placement] = [];
                        }
                        acc[mockup.placement].push(mockup);
                        return acc;
                      }, {} as Record<string, typeof mockupUrls>);

                      return Object.entries(groupedByPlacement).map(([placement, placementMockups]) => (
                        <div key={placement} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 text-center capitalize">
                            {placement} Placement ({placementMockups.length} variation{placementMockups.length > 1 ? 's' : ''})
                          </h4>
                          
                          {/* Grid of mockups for this placement */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {placementMockups.map((mockup, index) => {
                              const globalIndex = mockupUrls.findIndex(m => m.url === mockup.url);
                              return (
                                <div key={`${placement}-${index}`} className="text-center group">
                                  <div 
                                    className="relative cursor-pointer"
                                    onClick={() => openImageModal(globalIndex)}
                                  >
                                    <Image
                                      src={mockup.url}
                                      alt={mockup.title || `${mockup.placement} ${mockup.option || 'preview'}`}
                                      width={280}
                                      height={280}
                                      className="mx-auto rounded-lg shadow-lg border-2 border-gray-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-indigo-400"
                                    />
                                    
                                    {/* Click to view overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                                      <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                        <p className="text-sm font-semibold text-gray-900">Click to view full size</p>
                                      </div>
                                    </div>
                                  
                                    {/* Option group badge */}
                                    {mockup.option_group && (
                                      <div className="absolute top-3 left-3 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                        {mockup.option_group}
                                      </div>
                                    )}
                                    
                                    {/* Placement badge */}
                                    <div className="absolute top-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                      {mockup.placement.toUpperCase()}
                                    </div>
                                    
                                    {/* Variant count badge */}
                                    {mockup.variant_ids && mockup.variant_ids.length > 0 && (
                                      <div className="absolute bottom-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                        {mockup.variant_ids.length} variant{mockup.variant_ids.length > 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                
                                {/* Mockup title and details */}
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {mockup.title || `${mockup.placement.charAt(0).toUpperCase() + mockup.placement.slice(1)} View`}
                                  </p>
                                  {mockup.option && mockup.option !== 'Main' && (
                                    <p className="text-xs text-gray-600">
                                      {mockup.option} Style
                                    </p>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  {mockupStatus && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{mockupStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Eye className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-gray-600">Generate preview to see result</p>
                  <p className="text-xs text-gray-500 mt-1">Add designs and select variants first</p>
                </div>
              )}
            </div>

            <button
              onClick={() => onGeneratePreview({
                technique: selectedTechnique,
                optionGroups: selectedOptionGroups,
                options: selectedOptions,
                lifelike: lifelikeEnabled,
                width: mockupWidth
              })}
              disabled={designFiles.length === 0 || selectedVariants.length === 0 || isGeneratingPreview}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-green-600 hover:shadow-xl"
            >
              {isGeneratingPreview ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Preview...
                </span>
              ) : (
                <>
                  Generate Preview
                  {(selectedTechnique !== 'DTG' || selectedOptionGroups.length > 0 || selectedOptions.length > 0 || lifelikeEnabled) && (
                    <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      Advanced
                    </span>
                  )}
                </>
              )}
            </button>
            
            {/* Finalize Button */}
            {mockupUrls && mockupUrls.length > 0 && (
              <button
                onClick={handleFinalizeMockups}
                className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg border-2 border-emerald-600 hover:shadow-xl"
              >
                <span className="flex items-center justify-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Finalize Product
                  <ChevronRight className="w-4 h-4 ml-2" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <button
            onClick={onPrev}
            className="px-6 py-3 border-2 border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            ← Back
          </button>
          
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">
              {designFiles.length} designs • {selectedVariants.length} variants
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Ready to continue when both are selected
            </p>
          </div>
          
          <button
            onClick={onNext}
            disabled={designFiles.length === 0 || selectedVariants.length === 0}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-indigo-600 shadow-lg"
          >
            Continue to Finalize →
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {mockupUrls && mockupUrls.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={mockupUrls}
          initialIndex={modalImageIndex}
        />
      )}
    </div>
  );
};

export default UnifiedDesignEditor;