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
    return { width: 400, height: 400 }; // Default square
  }

  const { width, height } = activePrintFile;
  const aspectRatio = width / height;
  
  // Set smaller canvas size to match product shape better
  const maxWidth = 400;
  const maxHeight = 400;
  
  let canvasWidth, canvasHeight;
  
  if (aspectRatio > 1) {
    // Landscape (wider than tall)
    canvasWidth = Math.min(maxWidth, 400);
    canvasHeight = canvasWidth / aspectRatio;
  } else {
    // Portrait or square (taller than wide or equal)
    canvasHeight = Math.min(maxHeight, 400);
    canvasWidth = canvasHeight * aspectRatio;
  }
  
  // Ensure minimum size but smaller than before
  canvasWidth = Math.max(canvasWidth, 250);
  canvasHeight = Math.max(canvasHeight, 250);
  
  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    aspectRatio,
    printWidth: width,
    printHeight: height
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
  if (!printFiles || selectedVariants.length === 0) return null;

  const variantPrintFile = printFiles.variant_printfiles.find((vp) =>
    selectedVariants.includes(vp.variant_id)
  );

  if (!variantPrintFile?.placements[activePlacement]) return null;

  const printFileId = variantPrintFile.placements[activePlacement];
  return printFiles.printfiles.find((pf) => pf.printfile_id === printFileId) || null;
};

export const isEmbroideryProduct = (product: Product, selectedTechnique: string): boolean => {
  return product?.type === "EMBROIDERY" || selectedTechnique?.toLowerCase().includes("embroidery");
};