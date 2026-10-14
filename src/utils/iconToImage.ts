/**
 * Graphics & Shapes converter for direct Printify printing
 * Renders SVG shapes and customizable typography badges to high-res transparent PNGs.
 */

export interface GraphicShape {
  id: string;
  name: string;
  category: 'Shapes' | 'Badges' | 'Symbols';
  path: string;
  defaultColor?: string;
  viewBox?: string;
}

export const SHAPES_CATALOG: GraphicShape[] = [
  {
    id: 'star',
    name: 'Star',
    category: 'Shapes',
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'Shapes',
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'crown',
    name: 'Crown',
    category: 'Symbols',
    path: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'lightning',
    name: 'Lightning',
    category: 'Symbols',
    path: 'M7 2v11h3v9l7-12h-4l4-8z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'flame',
    name: 'Flame',
    category: 'Symbols',
    path: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM12 20c-3.31 0-6-2.69-6-6 0-1.53.58-2.92 1.53-3.98.05.82.35 1.58.84 2.21 1.09 1.41 2.91 1.95 4.54 1.25.96-.41 1.7-1.19 2.09-2.14.01.12.02.24.02.36 0 1.93-1.57 3.5-3.5 3.5-.96 0-1.84-.39-2.47-1.03-.39.63-.61 1.37-.61 2.16 0 2.07 1.68 3.75 3.75 3.75 1.83 0 3.34-1.31 3.67-3.04.53.86.83 1.88.83 2.97 0 3.31-2.69 6-6 6z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'shield',
    name: 'Shield',
    category: 'Shapes',
    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'circle',
    name: 'Circle Badge',
    category: 'Shapes',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'Shapes',
    path: 'M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm3.08-2l-1.5-3h1.84l1.5 3h-1.84zm-9.08 0H5.16l1.5-3H8.5l-1.42 3z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'divider-line',
    name: 'Divider Line',
    category: 'Shapes',
    path: 'M2 11h20v2H2z',
    viewBox: '0 0 24 24',
  },
];

export interface TypographyBadge {
  id: string;
  title: string;
  subtext?: string;
  year?: string;
  style: 'vintage' | 'bold' | 'arch' | 'badge';
  defaultText: string;
}

export const TYPOGRAPHY_BADGES: TypographyBadge[] = [
  {
    id: 'rip-twenties',
    title: 'R.I.P TWENTIES',
    subtext: 'Death to My 20s',
    style: 'bold',
    defaultText: 'R.I.P\nTWENTIES',
  },
  {
    id: 'mama-dude',
    title: 'MAMA OF THE BIRTHDAY DUDE',
    style: 'badge',
    defaultText: 'MAMA\nOF THE\nBIRTHDAY DUDE',
  },
  {
    id: 'finally-legal',
    title: 'FINALLY LEGAL',
    subtext: "21st Birthday",
    style: 'vintage',
    defaultText: "Hailey's 21st Birthday\nFINALLY\nLEGAL",
  },
  {
    id: 'birthday-crew',
    title: "MARTIN'S 50TH BIRTHDAY CREW",
    style: 'badge',
    defaultText: "Martin's 50th\nBIRTHDAY\nCrew",
  },
  {
    id: 'cruisin-60',
    title: "CRUISIN' MY WAY INTO 60",
    style: 'vintage',
    defaultText: "CRUISIN'\nMY WAY\ninto 60",
  },
  {
    id: 'certified-classic',
    title: '60 YEARS CERTIFIED CLASSIC',
    style: 'bold',
    defaultText: '60 YEARS\nCERTIFIED\nCLASSIC',
  },
  {
    id: 'vintage-legend',
    title: 'VINTAGE 1994 LEGEND',
    style: 'badge',
    defaultText: 'VINTAGE 1994\nLIMITED EDITION\nALL ORIGINAL PARTS',
  },
  {
    id: 'lifetime-member',
    title: 'LIFETIME MEMBER',
    style: 'arch',
    defaultText: 'COFFEE LOVERS CLUB\nEST. 2024\nLIFETIME MEMBER',
  },
];

/**
 * Converts an SVG string into a transparent PNG Blob
 */
export const convertSvgToImage = async (
  svgString: string,
  options: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    iconColor?: string;
  } = {}
): Promise<Blob> => {
  const { width = 1000, height = 1000, backgroundColor = 'transparent', iconColor = '#FFFFFF' } = options;

  return new Promise((resolve, reject) => {
    // Replace any fill/stroke color with target color
    let styledSvg = svgString;
    if (!styledSvg.includes('xmlns')) {
      styledSvg = styledSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([styledSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert SVG to blob'));
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image element'));
    };

    img.src = url;
  });
};

/**
 * Converts a shape from the catalog and uploads directly to Printify
 */
export const uploadShapeAsImage = async (
  shape: GraphicShape,
  color: string = '#FFFFFF'
): Promise<{ id: string; url: string; filename: string }> => {
  const { printifyAPI } = await import('../lib/api');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox || '0 0 24 24'}" width="1000" height="1000">
      <path d="${shape.path}" fill="${color}" stroke="${color}" stroke-width="0.5" stroke-linejoin="round"/>
    </svg>
  `;

  const blob = await convertSvgToImage(svg, { width: 1000, height: 1000, iconColor: color });

  const filename = `shape_${shape.id}_${Date.now()}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  const result = await printifyAPI.uploadFileDirectly(file);
  const uploaded = result?.result || result;

  return {
    id: uploaded.id || String(Date.now()),
    url: (uploaded.file_url || uploaded.url || '').replace(/%25/g, '%'),
    filename,
  };
};

export const getIconSvgData = (IconComponent: any, color: string = '#000000'): string => {
  const iconName = IconComponent?.displayName || IconComponent?.name || 'Star';
  const shape = SHAPES_CATALOG.find(s => s.name.toLowerCase() === iconName.toLowerCase()) || SHAPES_CATALOG[0];
  return `<svg width="512" height="512" viewBox="${shape.viewBox || '0 0 24 24'}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${shape.path}" fill="${color}" stroke="${color}" stroke-width="1"/>
  </svg>`;
};

export const convertIconToImage = async (
  IconComponent: any,
  options: {
    size?: number;
    color?: string;
    backgroundColor?: string;
  } = {}
): Promise<Blob> => {
  const { size = 512, color = '#000000', backgroundColor = 'transparent' } = options;
  const svg = getIconSvgData(IconComponent, color);
  return convertSvgToImage(svg, { width: size, height: size, backgroundColor, iconColor: color });
};

export const uploadIconAsImage = async (
  iconData: Blob,
  iconName: string
): Promise<{ url: string; filename: string }> => {
  const { printifyAPI } = await import('../lib/api');
  const filename = `clipart-${iconName}-${Date.now()}.png`;
  const file = new File([iconData], filename, { type: 'image/png' });
  const result = await printifyAPI.uploadFileDirectly(file);
  const uploaded = result?.result || result;
  return {
    url: (uploaded.file_url || uploaded.url || '').replace(/%25/g, '%'),
    filename,
  };
};