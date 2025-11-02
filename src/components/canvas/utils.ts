import { PrintFilesData, PrintFile, DesignFile, Product, ColorInfo } from './types';

export const getThreadColorOptions = (embroideryProductOptions: any[], placementKey: string) => {
  const option = embroideryProductOptions.find((opt: any) => 
    opt.id === `thread_colors_${placementKey}`
  );
  return option?.values || {};
};

export const getUniqueColors = (product: Product): ColorInfo[] => {
  const colorMap = new Map();
  product?.variants?.forEach((v) => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        name: v.color,
        code: v.color_code,
        image: v.image,
      });
    }
  });
  return Array.from(colorMap.values());
};

export const getUniqueSizes = (product: Product): string[] => {
  return [...new Set(product?.variants?.map((v) => v.size) || [])];
};

export const getCanvasDimensions = (activePrintFile: PrintFile | null) => {
  if (!activePrintFile) {
    return { 
      width: 400, 
      height: 400, 
      aspectRatio: 1,
      printWidth: 400,
      printHeight: 400,
      printAreaInfo: "No print area selected"
    }; // Default square
  }

  const { width, height } = activePrintFile;
  const aspectRatio = width / height;
  
  // IMPROVED: Dynamic canvas sizing based on actual print area from Printful API
  const maxCanvasSize = 450; // Slightly larger for better visibility
  
  let canvasWidth, canvasHeight;
  
  if (aspectRatio > 1) {
    // Landscape print area (wider than tall)
    canvasWidth = maxCanvasSize;
    canvasHeight = canvasWidth / aspectRatio;
  } else {
    // Portrait or square print area (taller than wide or equal)
    canvasHeight = maxCanvasSize;
    canvasWidth = canvasHeight * aspectRatio;
  }
  
  // Ensure reasonable minimum size for usability
  const minSize = 300;
  if (canvasWidth < minSize) {
    canvasWidth = minSize;
    canvasHeight = canvasWidth / aspectRatio;
  }
  if (canvasHeight < minSize) {
    canvasHeight = minSize;
    canvasWidth = canvasHeight * aspectRatio;
  }
  
  const printAreaInfo = `Print Area: ${width}×${height}px (${aspectRatio > 1 ? 'Landscape' : aspectRatio < 1 ? 'Portrait' : 'Square'})`;
  
  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    aspectRatio,
    printWidth: width,
    printHeight: height,
    printAreaInfo
  };
};

export const applyQuickPosition = (
  position: string,
  designFile: DesignFile | null,
  activePrintFile: PrintFile | null,
  onUpdateDesign: (updatedDesign: DesignFile) => void
) => {
  if (!designFile || !activePrintFile) return;

  const { width, height } = designFile.position;
  const { width: areaWidth, height: areaHeight } = activePrintFile;

  let newPosition = { ...designFile.position };

  switch (position) {
    case 'center':
      newPosition.left = (areaWidth - width) / 2;
      newPosition.top = (areaHeight - height) / 2;
      break;
    case 'top-left':
      newPosition.left = 0;
      newPosition.top = 0;
      break;
    case 'top-center':
      newPosition.left = (areaWidth - width) / 2;
      newPosition.top = 0;
      break;
    case 'top-right':
      newPosition.left = areaWidth - width;
      newPosition.top = 0;
      break;
    case 'center-left':
      newPosition.left = 0;
      newPosition.top = (areaHeight - height) / 2;
      break;
    case 'center-right':
      newPosition.left = areaWidth - width;
      newPosition.top = (areaHeight - height) / 2;
      break;
    case 'bottom-left':
      newPosition.left = 0;
      newPosition.top = areaHeight - height;
      break;
    case 'bottom-center':
      newPosition.left = (areaWidth - width) / 2;
      newPosition.top = areaHeight - height;
      break;
    case 'bottom-right':
      newPosition.left = areaWidth - width;
      newPosition.top = areaHeight - height;
      break;
  }

  // CRITICAL FIX: Clamp position values to prevent negative coordinates and overflow
  newPosition.left = Math.max(0, Math.min(newPosition.left, areaWidth - width));
  newPosition.top = Math.max(0, Math.min(newPosition.top, areaHeight - height));

  const updatedDesign = {
    ...designFile,
    position: newPosition
  };

  onUpdateDesign(updatedDesign);
};

export const getActivePrintFile = (
  printFiles: PrintFilesData | null,
  selectedVariants: number[],
  activePlacement: string
): PrintFile | null => {
  if (!printFiles || selectedVariants.length === 0 || !activePlacement) return null;

  // CRITICAL FIX: Add null safety checks for arrays
  if (!Array.isArray(printFiles.variant_printfiles) || !Array.isArray(printFiles.printfiles)) {
    console.warn("Invalid printFiles structure - missing variant_printfiles or printfiles arrays");
    return null;
  }

  const variantPrintFile = printFiles.variant_printfiles.find((vp) =>
    selectedVariants.includes(vp.variant_id)
  );

  if (!variantPrintFile || !variantPrintFile.placements || !variantPrintFile.placements[activePlacement]) {
    return null;
  }

  const printFileId = variantPrintFile.placements[activePlacement];

  // CRITICAL FIX: Ensure printFileId is valid before searching
  if (!printFileId) return null;

  return printFiles.printfiles.find((pf) => pf && pf.printfile_id === printFileId) || null;
};

export const isEmbroideryProduct = (product: Product, selectedTechnique: string): boolean => {
  return product?.type === "EMBROIDERY" || selectedTechnique?.toLowerCase().includes("embroidery");
};

/**
 * SMART IMAGE ADAPTATION: Calculate dimensions that work perfectly with any aspect ratio
 * Automatically adapts ANY image to fit beautifully in the print area
 */
export const calculateAspectRatioAwareDimensions = async (
  imageUrl: string,
  printFile: PrintFile,
  maxScale: number = 0.7,
  adaptToArea: boolean = true
): Promise<{ width: number; height: number; adapted: boolean; originalRatio: number; finalRatio: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let resolved = false;

    // CRITICAL FIX: Add timeout to prevent hanging promises (images that never load)
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`⚠️ Image load timeout (5s) - using fallback dimensions for ${imageUrl}`);
        const defaultWidth = printFile.width * maxScale;
        const defaultHeight = printFile.height * maxScale;
        resolve({
          width: Math.round(defaultWidth),
          height: Math.round(defaultHeight),
          adapted: true,
          originalRatio: printFile.width / printFile.height,
          finalRatio: printFile.width / printFile.height
        });
      }
    }, 5000);

    img.onload = () => {
      if (resolved) return; // Prevent double resolution
      resolved = true;
      clearTimeout(timeout);

      const imageAspectRatio = img.naturalWidth / img.naturalHeight;
      const printAreaAspectRatio = printFile.width / printFile.height;

      console.log(`🖼️  Image Analysis:`, {
        imageSize: `${img.naturalWidth}x${img.naturalHeight}`,
        imageAspectRatio: imageAspectRatio.toFixed(2),
        printArea: `${printFile.width}x${printFile.height}`,
        printAreaAspectRatio: printAreaAspectRatio.toFixed(2)
      });

      let designWidth: number;
      let designHeight: number;
      let adapted = false;

      const maxWidth = printFile.width * maxScale;
      const maxHeight = printFile.height * maxScale;

      // SMART ADAPTATION: Choose best fitting strategy
      if (adaptToArea && Math.abs(imageAspectRatio - printAreaAspectRatio) > 0.15) {
        // Image aspect ratio is significantly different from print area
        // AUTO-ADAPT to print area for better visual harmony

        console.log(`🎯 Auto-adapting aspect ratio: ${imageAspectRatio.toFixed(2)} → ${printAreaAspectRatio.toFixed(2)}`);

        designWidth = maxWidth;
        designHeight = maxHeight;
        adapted = true;

        console.log(`✨ Smart adaptation applied! Image will fill the print area beautifully.`);
      } else {
        // Maintain original image aspect ratio
        if (maxWidth / maxHeight > imageAspectRatio) {
          designHeight = maxHeight;
          designWidth = designHeight * imageAspectRatio;
        } else {
          designWidth = maxWidth;
          designHeight = designWidth / imageAspectRatio;
        }
      }

      // Ensure minimum size constraints
      const minSize = Math.min(printFile.width, printFile.height) * 0.2;
      if (designWidth < minSize || designHeight < minSize) {
        const ratio = adapted ? printAreaAspectRatio : imageAspectRatio;
        if (designWidth < minSize) {
          designWidth = minSize;
          designHeight = designWidth / ratio;
        }
        if (designHeight < minSize) {
          designHeight = minSize;
          designWidth = designHeight * ratio;
        }
      }

      const finalDimensions = {
        width: Math.round(designWidth),
        height: Math.round(designHeight)
      };

      const finalRatio = finalDimensions.width / finalDimensions.height;
      console.log(`✅ Final dimensions: ${finalDimensions.width}x${finalDimensions.height} (ratio: ${finalRatio.toFixed(2)})`);

      resolve({
        ...finalDimensions,
        adapted,
        originalRatio: imageAspectRatio,
        finalRatio
      });
    };

    img.onerror = () => {
      if (resolved) return; // Prevent double resolution
      resolved = true;
      clearTimeout(timeout);

      console.warn("Failed to load image, using print area dimensions");
      const defaultWidth = printFile.width * maxScale;
      const defaultHeight = printFile.height * maxScale;
      resolve({
        width: Math.round(defaultWidth),
        height: Math.round(defaultHeight),
        adapted: true,
        originalRatio: printFile.width / printFile.height,
        finalRatio: printFile.width / printFile.height
      });
    };

    img.src = imageUrl;
  });
};

/**
 * Validate if the design dimensions are compatible with Printful's aspect ratio requirements
 */
export const validateAspectRatioCompatibility = (
  designWidth: number,
  designHeight: number,
  areaWidth: number,
  areaHeight: number,
  tolerance: number = 0.05
): { isValid: boolean; designRatio: number; areaRatio: number; difference: number } => {
  const designRatio = designWidth / designHeight;
  const areaRatio = areaWidth / areaHeight;
  const difference = Math.abs(designRatio - areaRatio) / areaRatio;
  
  return {
    isValid: difference <= tolerance,
    designRatio,
    areaRatio,
    difference
  };
};

/**
 * Comprehensive design file validation for Printful compatibility
 * This is the CRITICAL validation that prevents all backend failures
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  fixedDesign?: DesignFile;
}

export const validateDesignForPrintful = (
  designFile: DesignFile,
  printFile: PrintFile,
  strictMode: boolean = true
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  const { position } = designFile;
  const { width: areaWidth, height: areaHeight } = printFile;

  // CRITICAL: Check for required position properties
  if (!position) {
    result.errors.push("Design file missing position data");
    result.isValid = false;
    return result;
  }

  // CRITICAL: Enforce limit_to_print_area requirement
  if (position.limit_to_print_area !== true) {
    result.errors.push("Design must have limit_to_print_area set to true");
    result.isValid = false;
  }

  // CRITICAL: Validate area dimensions match print file
  if (position.area_width !== areaWidth || position.area_height !== areaHeight) {
    result.errors.push(`Area dimensions mismatch: expected ${areaWidth}x${areaHeight}, got ${position.area_width}x${position.area_height}`);
    result.isValid = false;
  }

  // CRITICAL: Validate design dimensions are positive and reasonable
  if (position.width <= 0 || position.height <= 0) {
    result.errors.push("Design dimensions must be positive");
    result.isValid = false;
  }

  if (position.width > areaWidth || position.height > areaHeight) {
    result.errors.push(`Design size ${position.width}x${position.height} exceeds print area ${areaWidth}x${areaHeight}`);
    result.isValid = false;
  }

  // CRITICAL: Validate position bounds
  if (position.left < 0 || position.top < 0) {
    result.errors.push("Design position cannot be negative");
    result.isValid = false;
  }

  if (position.left + position.width > areaWidth || position.top + position.height > areaHeight) {
    result.errors.push("Design extends outside print area bounds");
    result.isValid = false;
  }

  // Aspect ratio validation (only warn, don't fail)
  // Different aspect ratios are perfectly valid - designs just need to fit within bounds
  const aspectValidation = validateAspectRatioCompatibility(
    position.width,
    position.height,
    areaWidth,
    areaHeight,
    0.15 // More tolerant - 15% difference is fine
  );

  if (!aspectValidation.isValid) {
    result.warnings.push(
      `Design aspect ratio (${aspectValidation.designRatio.toFixed(2)}) differs from print area (${aspectValidation.areaRatio.toFixed(2)}) - this is normal and fine!`
    );
  }

  // Size recommendations
  const designArea = position.width * position.height;
  const printArea = areaWidth * areaHeight;
  const sizeRatio = designArea / printArea;

  if (sizeRatio < 0.1) {
    result.warnings.push("Design is very small relative to print area - consider making it larger");
    result.suggestions.push("Increase design size to at least 30% of print area for better visibility");
  } else if (sizeRatio > 0.8) {
    result.warnings.push("Design is very large - ensure adequate margins");
    result.suggestions.push("Consider reducing size to 60-70% of print area for better aesthetics");
  }

  return result;
};

/**
 * Auto-fix common design validation issues
 * IMPROVED: More intelligent fixing that preserves design aspect ratios
 */
export const autoFixDesignForPrintful = (
  designFile: DesignFile,
  printFile: PrintFile
): DesignFile => {
  const fixedDesign = { ...designFile };
  
  // Ensure limit_to_print_area is always true
  fixedDesign.position = {
    ...fixedDesign.position,
    area_width: printFile.width,
    area_height: printFile.height,
    limit_to_print_area: true
  };

  // Fix position bounds
  if (fixedDesign.position.left < 0) fixedDesign.position.left = 0;
  if (fixedDesign.position.top < 0) fixedDesign.position.top = 0;

  // SMART SIZE FIXING: Preserve original aspect ratio while fitting in print area
  const originalRatio = fixedDesign.position.width / fixedDesign.position.height;
  const maxWidth = printFile.width * 0.9; // Leave 10% margin
  const maxHeight = printFile.height * 0.9; // Leave 10% margin
  
  let newWidth = fixedDesign.position.width;
  let newHeight = fixedDesign.position.height;

  // Scale down if too large, maintaining aspect ratio
  if (newWidth > maxWidth || newHeight > maxHeight) {
    if (maxWidth / maxHeight > originalRatio) {
      // Constrain by height
      newHeight = maxHeight;
      newWidth = newHeight * originalRatio;
    } else {
      // Constrain by width  
      newWidth = maxWidth;
      newHeight = newWidth / originalRatio;
    }
    
    console.log(`🔧 Auto-fix: Resized design from ${fixedDesign.position.width}×${fixedDesign.position.height} to ${Math.round(newWidth)}×${Math.round(newHeight)} (maintaining ${originalRatio.toFixed(2)} ratio)`);
  }

  fixedDesign.position.width = Math.round(newWidth);
  fixedDesign.position.height = Math.round(newHeight);

  // Fix position if extends outside bounds (after resizing)
  if (fixedDesign.position.left + fixedDesign.position.width > printFile.width) {
    fixedDesign.position.left = printFile.width - fixedDesign.position.width;
  }
  
  if (fixedDesign.position.top + fixedDesign.position.height > printFile.height) {
    fixedDesign.position.top = printFile.height - fixedDesign.position.height;
  }

  // Center the design if it was repositioned
  if (fixedDesign.position.left < 0 || fixedDesign.position.top < 0) {
    fixedDesign.position.left = Math.max(0, (printFile.width - fixedDesign.position.width) / 2);
    fixedDesign.position.top = Math.max(0, (printFile.height - fixedDesign.position.height) / 2);
    console.log(`🔧 Auto-fix: Centered design at ${fixedDesign.position.left}, ${fixedDesign.position.top}`);
  }

  return fixedDesign;
};

/**
 * Validate all design files for an order before submission
 * CRITICAL: Validates every design, prevents empty designs array from being published
 */
export const validateOrderDesigns = (
  designFiles: DesignFile[],
  printFiles: PrintFilesData | null,
  selectedVariants: number[]
): { isValid: boolean; errors: string[]; warnings: string[]; validatedDesigns: DesignFile[] } => {
  // CRITICAL FIX: Check all required inputs
  if (!printFiles) {
    return {
      isValid: false,
      errors: ["Print files data not available"],
      warnings: [],
      validatedDesigns: []
    };
  }

  if (!designFiles || designFiles.length === 0) {
    return {
      isValid: false,
      errors: ["At least one design must be added to the product"],
      warnings: [],
      validatedDesigns: []
    };
  }

  if (!selectedVariants || selectedVariants.length === 0) {
    return {
      isValid: false,
      errors: ["No variants selected for the product"],
      warnings: [],
      validatedDesigns: []
    };
  }

  // CRITICAL FIX: Validate array structure
  if (!Array.isArray(printFiles.variant_printfiles) || !Array.isArray(printFiles.printfiles)) {
    return {
      isValid: false,
      errors: ["Invalid print files structure"],
      warnings: [],
      validatedDesigns: []
    };
  }

  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const validatedDesigns: DesignFile[] = [];

  for (const design of designFiles) {
    // CRITICAL FIX: Validate design object structure
    if (!design || !design.placement || !design.filename) {
      allErrors.push(`Invalid design object - missing required fields`);
      continue;
    }

    // Find the print file for this design's placement
    const variantPrintFile = printFiles.variant_printfiles.find(vp =>
      selectedVariants.includes(vp.variant_id)
    );

    if (!variantPrintFile) {
      allErrors.push(`No variant print file found for selected variants: ${selectedVariants.join(', ')}`);
      continue;
    }

    if (!variantPrintFile.placements || !variantPrintFile.placements[design.placement]) {
      allErrors.push(`No print file found for placement "${design.placement}" in design: ${design.filename}`);
      continue;
    }

    const printFileId = variantPrintFile.placements[design.placement];

    // CRITICAL FIX: Validate printFileId exists
    if (!printFileId) {
      allErrors.push(`Invalid print file ID for placement "${design.placement}" in design: ${design.filename}`);
      continue;
    }

    const printFile = printFiles.printfiles.find(pf => pf && pf.printfile_id === printFileId);

    if (!printFile) {
      allErrors.push(`Print file #${printFileId} not found for design: ${design.filename}`);
      continue;
    }

    // Validate this design
    const validation = validateDesignForPrintful(design, printFile, true);

    if (!validation.isValid) {
      allErrors.push(`${design.filename}: ${validation.errors.join(', ')}`);
    } else {
      validatedDesigns.push(design);
    }

    allWarnings.push(...validation.warnings.map(w => `${design.filename}: ${w}`));
  }

  // CRITICAL FIX: Ensure at least one valid design exists
  if (validatedDesigns.length === 0) {
    return {
      isValid: false,
      errors: allErrors.length > 0 ? allErrors : ["No valid designs after validation"],
      warnings: allWarnings,
      validatedDesigns: []
    };
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    validatedDesigns
  };
};