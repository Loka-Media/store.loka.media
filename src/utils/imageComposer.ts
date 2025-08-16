// Utility to merge multiple design images into a single composite image
import { DesignFile } from '../lib/types';

interface PrintFile {
  width: number;
  height: number;
  [key: string]: unknown;
}

interface PrintFiles {
  available_placements?: Record<string, PrintFile>;
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
            // Draw image at its specified position and size
            const { position } = design;
            ctx.drawImage(
              img,
              position.left,
              position.top,
              position.width,
              position.height
            );
            
            loadedImages++;
            
            // When all images are loaded and drawn, convert to blob
            if (loadedImages === totalImages) {
              canvas.toBlob((blob) => {
                if (blob) {
                  // Create URL for the composite image
                  const url = URL.createObjectURL(blob);
                  const filename = `composite-${placement}-${Date.now()}.png`;
                  
                  resolve({ url, filename });
                } else {
                  reject(new Error('Failed to create composite image blob'));
                }
              }, 'image/png');
            }
          } catch (error) {
            reject(new Error(`Failed to draw image ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };
        
        img.onerror = () => {
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
  // Import the printfulAPI to use existing upload infrastructure
  const { printfulAPI } = await import('../lib/api');
  
  // Create a File object from the blob
  const file = new File([blob], filename, { type: 'image/png' });
  
  // Use the existing upload method
  const result = await printfulAPI.uploadFileDirectly(file);
  
  return {
    url: result.result.file_url,
    filename: filename,
  };
};

// Main function to merge designs per placement and upload composite images
export const createCompositeImagesForPlacements = async (
  designs: DesignFile[],
  printFiles: PrintFiles
): Promise<DesignFile[]> => {
  // Group designs by placement
  const designsByPlacement = designs.reduce<Record<string, DesignFile[]>>((acc, design) => {
    if (!acc[design.placement]) {
      acc[design.placement] = [];
    }
    acc[design.placement].push(design);
    return acc;
  }, {});
  
  const compositeDesigns: DesignFile[] = [];
  
  // Process each placement
  for (const [placement, placementDesigns] of Object.entries(designsByPlacement)) {
    if (placementDesigns.length === 1) {
      // If only one design, use it as-is
      compositeDesigns.push(placementDesigns[0]);
    } else if (placementDesigns.length > 1) {
      // Multiple designs - merge into composite
      try {
        // Find the print file for this placement
        const printFile = printFiles?.available_placements?.[placement];
        if (!printFile) {
          console.warn(`No print file found for placement: ${placement}`);
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
        
        // Create composite design file
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
        console.log(`Created composite design for ${placement}: ${uploadResult.url}`);
        
      } catch (error) {
        console.error(`Failed to create composite for ${placement}:`, error);
        // Fallback: use the most recent design
        const mostRecent = placementDesigns.reduce((latest, current) => 
          current.id > latest.id ? current : latest
        );
        compositeDesigns.push(mostRecent);
      }
    }
  }
  
  return compositeDesigns;
};