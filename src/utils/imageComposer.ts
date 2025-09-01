// Utility to merge multiple design images into a single composite image
import { DesignFile } from '../lib/types';

interface PrintFile {
  width: number;
  height: number;
  [key: string]: unknown;
}

interface PrintFiles {
  available_placements?: Record<string, string>;
  printfiles?: Array<{
    printfile_id: number;
    width: number;
    height: number;
    [key: string]: unknown;
  }>;
  variant_printfiles?: Array<{
    variant_id: number;
    placements: Record<string, number>;
  }>;
  [key: string]: unknown;
}

export interface CompositeImageResult {
  url: string;
  filename: string;
}

export const mergeDesignsIntoComposite = async (
  designs: DesignFile[],
  printFile: PrintFile,
  placement: string
): Promise<CompositeImageResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas with print file dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = printFile.width;
      canvas.height = printFile.height;
      
      // Clear canvas (transparent background)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let loadedImages = 0;
      const totalImages = designs.length;
      
      if (totalImages === 0) {
        reject(new Error('No designs to merge'));
        return;
      }
      
      // Load and draw all images
      designs.forEach((design, index) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS for external URLs
        
        img.onload = () => {
          try {
            console.log(`🖼️ Loaded image ${index + 1}/${totalImages} for ${placement}: ${design.filename}`);
            // Draw image at its specified position and size
            const { position } = design;
            console.log(`📐 Drawing at position:`, position);
            
            ctx.drawImage(
              img,
              position.left,
              position.top,
              position.width,
              position.height
            );
            
            loadedImages++;
            console.log(`✅ Loaded and drawn ${loadedImages}/${totalImages} images for ${placement}`);
            
            // When all images are loaded and drawn, convert to blob
            if (loadedImages === totalImages) {
              console.log(`🎯 All ${totalImages} images loaded for ${placement}, creating composite...`);
              canvas.toBlob((blob) => {
                if (blob) {
                  // Create URL for the composite image
                  const url = URL.createObjectURL(blob);
                  const filename = `composite-${placement}-${Date.now()}.png`;
                  
                  console.log(`✅ Composite blob created for ${placement}: ${filename}`);
                  resolve({ url, filename });
                } else {
                  console.error(`❌ Failed to create composite blob for ${placement}`);
                  reject(new Error('Failed to create composite image blob'));
                }
              }, 'image/png');
            }
          } catch (error) {
            console.error(`❌ Failed to draw image ${index} for ${placement}:`, error);
            reject(new Error(`Failed to draw image ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };
        
        img.onerror = (error) => {
          console.error(`❌ Failed to load image ${index} for ${placement}: ${design.filename}`, error);
          console.error(`   Image URL: ${design.url}`);
          reject(new Error(`Failed to load image ${index}: ${design.filename}`));
        };
        
        // Handle different image types
        if (design.filename.endsWith('.txt') && design.url.startsWith('data:text/plain')) {
          // Handle text content by creating a text image
          createTextImage(design, (textImageUrl) => {
            img.src = textImageUrl;
          });
        } else {
          // Regular image
          img.src = design.url;
        }
      });
      
    } catch (error) {
      reject(new Error(`Failed to create composite image: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

// Helper function to create text image from text data URL
const createTextImage = (design: DesignFile, callback: (url: string) => void) => {
  try {
    // Extract text from data URL
    const textContent = decodeURIComponent(design.url.split(',')[1] || '');
    
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = design.position.width;
    canvas.height = design.position.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set font style
    const fontSize = Math.min(design.position.height * 0.6, 48);
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Handle multi-line text
    const lines = textContent.split('\n');
    const lineHeight = fontSize * 1.2;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + (index * lineHeight));
    });
    
    // Convert to data URL and call callback
    const dataURL = canvas.toDataURL('image/png');
    callback(dataURL);
    
  } catch (error) {
    console.error('Error creating text image:', error);
    callback(design.url); // Fallback to original URL
  }
};

// Upload composite image to server
export const uploadCompositeImage = async (
  blob: Blob,
  filename: string
): Promise<{ url: string; filename: string }> => {
  try {
    console.log(`📤 Uploading composite image: ${filename} (size: ${blob.size} bytes)`);
    
    // Import the printfulAPI to use existing upload infrastructure
    const { printfulAPI } = await import('../lib/api');
    
    // Create a File object from the blob
    const file = new File([blob], filename, { type: 'image/png' });
    
    console.log(`📤 Created file object: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Use the existing upload method
    const result = await printfulAPI.uploadFileDirectly(file);
    
    console.log(`📤 Upload result:`, result);
    
    if (!result || !result.result || !result.result.file_url) {
      console.error('❌ Upload result missing file_url:', result);
      throw new Error(`Upload failed - no file URL returned. Result: ${JSON.stringify(result)}`);
    }
    
    const uploadedUrl = result.result.file_url;
    console.log(`✅ Successfully uploaded composite image: ${uploadedUrl}`);
    
    return {
      url: uploadedUrl,
      filename: filename,
    };
  } catch (error) {
    console.error(`❌ Failed to upload composite image ${filename}:`, error);
    console.error(`❌ Blob details: size=${blob.size}, type=${blob.type}`);
    throw error;
  }
};

// Helper function to find print file for a placement
const findPrintFileForPlacement = (printFiles: PrintFiles, placement: string): PrintFile | null => {
  console.log(`🔍 Finding print file for placement: ${placement}`);
  console.log('printFiles structure:', {
    hasVariantPrintfiles: !!printFiles.variant_printfiles,
    variantCount: printFiles.variant_printfiles?.length || 0,
    hasPrintfiles: !!printFiles.printfiles,
    printfilesCount: printFiles.printfiles?.length || 0,
  });
  
  if (!printFiles.variant_printfiles?.[0] || !printFiles.printfiles) {
    console.warn('❌ No variant print files or print files available');
    return null;
  }
  
  // Get the first variant's placements (assuming all variants have same print file structure)
  const firstVariant = printFiles.variant_printfiles[0];
  console.log(`First variant placements:`, firstVariant.placements);
  
  const printFileId = firstVariant.placements[placement];
  
  if (!printFileId) {
    console.warn(`❌ No print file ID found for placement: ${placement}`);
    console.warn(`Available placements:`, Object.keys(firstVariant.placements));
    return null;
  }
  
  console.log(`📋 Looking for print file with ID: ${printFileId}`);
  
  // Find the print file with matching ID
  const printFile = printFiles.printfiles.find(pf => pf.printfile_id === printFileId);
  
  if (!printFile) {
    console.warn(`❌ No print file found with ID: ${printFileId} for placement: ${placement}`);
    console.warn(`Available print file IDs:`, printFiles.printfiles.map(pf => pf.printfile_id));
    return null;
  }
  
  console.log(`✅ Found print file: ${printFile.width}x${printFile.height}`);
  
  return {
    width: printFile.width,
    height: printFile.height,
  } as PrintFile;
};

// Main function to merge designs per placement and upload composite images
export const createCompositeImagesForPlacements = async (
  designs: DesignFile[],
  printFiles: PrintFiles
): Promise<DesignFile[]> => {
  console.log('🎨 Creating composite images for multiple designs per placement...');
  console.log(`Input designs: ${designs.length}`);
  console.log('Print files structure:', printFiles);
  
  // Group designs by placement
  const designsByPlacement = designs.reduce<Record<string, DesignFile[]>>((acc, design) => {
    if (!acc[design.placement]) {
      acc[design.placement] = [];
    }
    acc[design.placement].push(design);
    return acc;
  }, {});
  
  console.log('Designs grouped by placement:', designsByPlacement);
  
  const compositeDesigns: DesignFile[] = [];
  
  // Process each placement
  for (const [placement, placementDesigns] of Object.entries(designsByPlacement)) {
    console.log(`Processing placement: ${placement} with ${placementDesigns.length} designs`);
    
    if (placementDesigns.length === 1) {
      // If only one design, use it as-is
      console.log(`Single design for ${placement}, using as-is`);
      compositeDesigns.push(placementDesigns[0]);
    } else if (placementDesigns.length > 1) {
      // Multiple designs - merge into composite
      try {
        // Find the print file for this placement
        const printFile = findPrintFileForPlacement(printFiles, placement);
        if (!printFile) {
          console.warn(`No print file found for placement: ${placement}, using fallback`);
          // Fallback: use the most recent design
          const mostRecent = placementDesigns.reduce((latest, current) => 
            current.id > latest.id ? current : latest
          );
          compositeDesigns.push(mostRecent);
          continue;
        }
        
        console.log(`Merging ${placementDesigns.length} designs for placement: ${placement}`);
        
        // Create composite image
        const compositeResult = await mergeDesignsIntoComposite(
          placementDesigns,
          printFile,
          placement
        );
        
        // Convert blob URL to actual blob for upload
        const response = await fetch(compositeResult.url);
        const blob = await response.blob();
        
        // Upload composite image
        const uploadResult = await uploadCompositeImage(blob, compositeResult.filename);
        
        // Clean up blob URL
        URL.revokeObjectURL(compositeResult.url);
        
        // Create composite design file with proper positioning
        const compositeDesign: DesignFile = {
          id: Date.now(), // New ID for composite
          filename: uploadResult.filename,
          url: uploadResult.url,
          type: 'design',
          placement: placement,
          position: {
            area_width: printFile.width,
            area_height: printFile.height,
            width: printFile.width,
            height: printFile.height,
            top: 0,
            left: 0,
            limit_to_print_area: true,
          },
        };
        
        compositeDesigns.push(compositeDesign);
        console.log(`✅ Created composite design for ${placement}: ${uploadResult.url}`);
        console.log(`📐 Composite dimensions: ${printFile.width}x${printFile.height}`);
        
      } catch (error) {
        console.error(`❌ Failed to create composite for ${placement}:`, error);
        // Fallback: use the most recent design
        const mostRecent = placementDesigns.reduce((latest, current) => 
          current.id > latest.id ? current : latest
        );
        console.log(`📤 Using fallback (most recent) for ${placement}: ${mostRecent.filename}`);
        compositeDesigns.push(mostRecent);
      }
    }
  }
  
  console.log(`🎯 Final result: ${compositeDesigns.length} designs for mockup generation`);
  compositeDesigns.forEach((design, index) => {
    const urlPreview = design.url ? design.url.substring(0, 50) + '...' : 'NO URL';
    console.log(`  ${index + 1}. ${design.placement}: ${design.filename} (${urlPreview})`);
  });
  
  return compositeDesigns;
};