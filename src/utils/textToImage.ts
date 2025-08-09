// Convert text to image and upload to get a public URL
export const convertTextToImage = async (
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    width?: number;
    height?: number;
    textAlign?: 'left' | 'center' | 'right';
    autoSize?: boolean;
  } = {}
): Promise<Blob> => {
  const {
    fontSize = 48,
    fontFamily = 'Arial, sans-serif',
    color = '#000000',
    backgroundColor = 'transparent',
    textAlign = 'center',
    autoSize = true
  } = options;

  return new Promise((resolve) => {
    // Create temporary canvas to measure text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Set font for measurement
    tempCtx.font = `${fontSize}px ${fontFamily}`;
    
    // Handle multi-line text
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    let maxWidth = 0;
    let totalHeight = 0;
    
    if (autoSize) {
      // Calculate exact text dimensions
      lines.forEach(line => {
        const metrics = tempCtx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      totalHeight = lines.length * lineHeight;
      
      // Add some padding
      const padding = fontSize * 0.2;
      maxWidth += padding * 2;
      totalHeight += padding * 2;
    } else {
      // Use provided dimensions or defaults
      maxWidth = options.width || Math.max(800, text.length * fontSize * 0.6);
      totalHeight = options.height || Math.max(200, fontSize * 2);
    }
    
    // Create actual canvas with calculated dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = Math.ceil(maxWidth);
    canvas.height = Math.ceil(totalHeight);
    
    // Set background
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Set font
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    // Calculate text position
    const padding = autoSize ? fontSize * 0.2 : 20;
    let x: number;
    
    switch (textAlign) {
      case 'left':
        ctx.textAlign = 'left';
        x = padding;
        break;
      case 'right':
        ctx.textAlign = 'right';
        x = canvas.width - padding;
        break;
      default:
        ctx.textAlign = 'center';
        x = canvas.width / 2;
    }
    
    // Draw text lines
    lines.forEach((line, index) => {
      const y = padding + (index * lineHeight);
      ctx.fillText(line, x, y);
    });
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'image/png');
  });
};

export const uploadTextAsImage = async (
  text: string,
  userId: number,
  options?: Parameters<typeof convertTextToImage>[1]
): Promise<{ url: string; filename: string }> => {
  // Import the printfulAPI to use existing upload infrastructure
  const { printfulAPI } = await import('../lib/api');
  
  // Convert text to image blob
  const blob = await convertTextToImage(text, options);
  
  // Create a File object from the blob
  const filename = `text-${Date.now()}.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  
  // Use the existing upload method
  const result = await printfulAPI.uploadFileDirectly(file);
  
  return {
    url: result.result.file_url,
    filename: filename,
  };
};