import React from 'react';

export interface PrintFile {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
}

export interface PrintFilesData {
  product_id: number;
  available_placements: Record<string, string>;
  printfiles: PrintFile[];
  variant_printfiles: Array<{
    variant_id: number;
    placements: Record<string, number>;
  }>;
  option_groups?: string[];
  options?: string[];
}

export interface DesignFile {
  id: number;
  filename: string;
  url: any;
  type: "design";
  placement: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
    limit_to_print_area: boolean;
  };
}

export interface Product {
  id: number;
  title: string;
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

export interface UploadedFile {
  id: number;
  filename: string;
  thumbnail_url?: any;
  file_url?: any;
  [key: string]: unknown;
}

export interface UnifiedDesignEditorProps {
  selectedProduct: Product;
  selectedVariants: number[];
  setSelectedVariants: (variants: number[]) => void;
  designFiles: DesignFile[];
  setDesignFiles: React.Dispatch<React.SetStateAction<DesignFile[]>>;
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
  mockupUrls?: Array<{
    url: string;
    placement: string;
    variant_ids: number[];
    title?: string;
    option?: string;
    option_group?: string;
  }>;
  mockupStatus?: string;
  onNext?: () => void;
  onPrev?: () => void;
  onPrintFilesLoaded?: (printFiles: PrintFilesData) => void;
  onRefreshFiles?: () => void;
}

export type TabType = "product" | "upload" | "text" | "clipart" | "emoji" | "placement" | "embroidery" | "advanced" | "preview";

export interface AdvancedMockupOptions {
  width: number;
  lifelike: boolean;
  optionGroups: string[];
  options: string[];
}

export interface EmbroideryOptions {
  thread_colors_chest_left: string[];
  thread_colors_wrist_left: string[];
  thread_colors_wrist_right: string[];
  notes: string;
}

export interface ColorInfo {
  name: string;
  code: string;
  image: string;
}

export interface AspectRatioIssue {
  designId: number;
  message: string;
}