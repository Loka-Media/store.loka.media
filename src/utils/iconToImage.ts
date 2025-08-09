// Convert icon/clipart to image and upload to get a public URL
export const convertSvgToImage = async (
  svgString: string,
  options: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    iconColor?: string;
  } = {}
): Promise<Blob> => {
  const {
    width = 512,
    height = 512,
    backgroundColor = 'transparent',
    iconColor = '#000000'
  } = options;

  return new Promise((resolve, reject) => {
    // Create SVG with proper styling
    const styledSvg = svgString
      .replace(/fill="[^"]*"/g, `fill="${iconColor}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${iconColor}"`);
    
    const svgBlob = new Blob([styledSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = width;
      canvas.height = height;
      
      // Set background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Draw the SVG
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert SVG to blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    
    img.src = url;
  });
};

// Icon name to SVG path mapping for common Lucide icons
const ICON_PATHS: Record<string, string> = {
  Heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  Star: 'm12 2 3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 9l6.91-1.74L12 2Z',
  Smile: 'M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z',
  Sun: 'M12 2v2M12 20v2m8-10h2M2 12h2m15.364-6.364L18.95 7.05M5.636 18.364L7.05 16.95m12.728 0L18.364 18.364M5.636 5.636L7.05 7.05M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  Moon: 'M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z',
  Coffee: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
  Camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  Music: 'M9 18V5l12-2v13M9 9l12-2',
  Car: 'M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17H3v-6l2-5h9l4 5v6h-2',
  Home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  Gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'
};

const getIconName = (IconComponent: React.ComponentType): string => {
  return IconComponent.displayName || IconComponent.name || 'Star';
};

export const convertIconToImage = async (
  IconComponent: React.ComponentType,
  options: {
    size?: number;
    color?: string;
    backgroundColor?: string;
  } = {}
): Promise<Blob> => {
  const {
    size = 512,
    color = '#000000',
    backgroundColor = 'transparent'
  } = options;

  return new Promise((resolve, reject) => {
    const iconName = getIconName(IconComponent);
    const iconPath = ICON_PATHS[iconName] || ICON_PATHS.Star;
    
    // Create SVG string
    const svgString = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${iconPath}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    
    // Convert SVG to image using the existing function
    convertSvgToImage(svgString, {
      width: size,
      height: size,
      backgroundColor,
      iconColor: color
    }).then(resolve).catch(reject);
  });
};

export const uploadIconAsImage = async (
  iconData: Blob,
  iconName: string
): Promise<{ url: string; filename: string }> => {
  // Import the printfulAPI to use existing upload infrastructure
  const { printfulAPI } = await import('../lib/api');
  
  // Create a File object from the blob
  const filename = `clipart-${iconName}-${Date.now()}.png`;
  const file = new File([iconData], filename, { type: 'image/png' });
  
  // Use the existing upload method
  const result = await printfulAPI.uploadFileDirectly(file);
  
  return {
    url: result.result.file_url,
    filename: filename,
  };
};

// Helper function to get icon SVG data
export const getIconSvgData = (IconComponent: React.ComponentType, color: string = '#000000'): string => {
  const iconName = getIconName(IconComponent);
  const iconPath = ICON_PATHS[iconName] || ICON_PATHS.Star;
  
  return `<svg width="512" height="512" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${iconPath}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
};