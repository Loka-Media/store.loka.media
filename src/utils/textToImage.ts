/**
 * Text to High-Resolution Image Converter with Curved Text and Google Fonts support
 * Used to convert creator typography into transparent PNGs for direct Printify printing.
 */

export const GOOGLE_FONTS_CATALOG = [
  { name: 'Bebas Neue', category: 'Display', sample: 'BOLD IMPACT' },
  { name: 'Montserrat', category: 'Sans-Serif', sample: 'Modern Minimal' },
  { name: 'Oswald', category: 'Display', sample: 'Athletic Strong' },
  { name: 'ABeeZee', category: 'Sans-Serif', sample: 'Friendly Clean' },
  { name: 'Abel', category: 'Display', sample: 'Modern Slim' },
  { name: 'Permanent Marker', category: 'Handwriting', sample: 'Urban Street' },
  { name: 'Pacifico', category: 'Handwriting', sample: 'Smooth Script' },
  { name: 'Playfair Display', category: 'Serif', sample: 'Luxury Elegant' },
  { name: 'Cinzel', category: 'Serif', sample: 'Classic Roman' },
  { name: 'Lobster', category: 'Display', sample: 'Vintage Retro' },
  { name: 'Caveat', category: 'Handwriting', sample: 'Casual Marker' },
  { name: 'Courier Prime', category: 'Monospace', sample: 'Typewriter Code' },
  { name: 'Anton', category: 'Display', sample: 'HEAVY POSTER' },
  { name: 'Righteous', category: 'Display', sample: 'Futuristic Wave' },
];

/**
 * Dynamically injects Google Font link tag and waits for font to load in browser
 */
export const loadGoogleFont = async (fontFamily: string): Promise<void> => {
  if (typeof window === 'undefined') return;

  const cleanFamily = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const fontId = `google-font-${cleanFamily.toLowerCase().replace(/\s+/g, '-')}`;

  if (!document.getElementById(fontId)) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanFamily)}:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
  }

  try {
    await document.fonts.load(`48px "${cleanFamily}"`);
  } catch (err) {
    console.warn(`Font load warning for ${cleanFamily}:`, err);
  }
};

export interface TextToImageOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  curveAngle?: number; // -120 to +120 degrees (0 = flat, negative = arch up, positive = smile down)
  letterSpacing?: number;
  uppercase?: boolean;
}

/**
 * Convert text into a crisp, print-ready transparent PNG Blob
 */
export const convertTextToImage = async (
  text: string,
  options: TextToImageOptions = {}
): Promise<Blob> => {
  const {
    fontSize = 72,
    fontFamily = 'Bebas Neue',
    fontWeight = 'bold',
    color = '#FFFFFF',
    strokeColor = '',
    strokeWidth = 0,
    backgroundColor = 'transparent',
    textAlign = 'center',
    curveAngle = 0,
    letterSpacing = 0,
    uppercase = false,
  } = options;

  await loadGoogleFont(fontFamily);

  const processedText = uppercase ? text.toUpperCase() : text;

  return new Promise((resolve, reject) => {
    try {
      // 2x scale for ultra-crisp print quality
      const dpi = 2;
      const effectiveFontSize = fontSize * dpi;
      const effectiveStrokeWidth = strokeWidth * dpi;
      const fontSpec = `${fontWeight} ${effectiveFontSize}px "${fontFamily}", sans-serif`;

      const measureCanvas = document.createElement('canvas');
      const mctx = measureCanvas.getContext('2d')!;
      mctx.font = fontSpec;

      // Handle Curved Text vs Straight Text
      if (Math.abs(curveAngle) >= 10 && !processedText.includes('\n')) {
        // CURVED TEXT RENDER
        const chars = processedText.split('');
        const charWidths = chars.map((ch) => mctx.measureText(ch).width + letterSpacing * dpi);
        const totalTextWidth = charWidths.reduce((a, b) => a + b, 0);

        const arcAngleRad = (Math.abs(curveAngle) * Math.PI) / 180;
        const radius = Math.max(120 * dpi, totalTextWidth / arcAngleRad);

        const canvasWidth = Math.ceil(totalTextWidth + 80 * dpi);
        const arcHeight = radius - radius * Math.cos(arcAngleRad / 2);
        const canvasHeight = Math.ceil(arcHeight + effectiveFontSize * 2 + 60 * dpi);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(300 * dpi, canvasWidth);
        canvas.height = Math.max(200 * dpi, canvasHeight);
        const ctx = canvas.getContext('2d')!;

        if (backgroundColor !== 'transparent') {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.font = fontSpec;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const isArchUp = curveAngle < 0;
        const centerX = canvas.width / 2;
        const centerY = isArchUp ? canvas.height / 2 + radius * 0.45 : canvas.height / 2 - radius * 0.45;

        let currentAngle = isArchUp
          ? -Math.PI / 2 - arcAngleRad / 2
          : Math.PI / 2 + arcAngleRad / 2;

        const dir = isArchUp ? 1 : -1;

        ctx.save();
        ctx.translate(centerX, centerY);

        chars.forEach((char, i) => {
          const charAngle = (charWidths[i] / totalTextWidth) * arcAngleRad;
          const charMidAngle = currentAngle + (dir * charAngle) / 2;

          ctx.save();
          ctx.rotate(charMidAngle + (isArchUp ? Math.PI / 2 : -Math.PI / 2));
          ctx.translate(0, isArchUp ? -radius : radius);

          if (strokeColor && effectiveStrokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = effectiveStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(char, 0, 0);
          }

          ctx.fillText(char, 0, 0);
          ctx.restore();

          currentAngle += dir * charAngle;
        });

        ctx.restore();

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate curved text blob'));
        }, 'image/png');
      } else {
        // STRAIGHT MULTI-LINE TEXT RENDER
        const lines = processedText.split('\n');
        const lineHeight = effectiveFontSize * 1.25;

        let maxWidth = 0;
        lines.forEach((line) => {
          const w = mctx.measureText(line).width + (line.length - 1) * (letterSpacing * dpi);
          maxWidth = Math.max(maxWidth, w);
        });

        const padding = effectiveFontSize * 0.35;
        const canvasWidth = Math.ceil(maxWidth + padding * 2);
        const canvasHeight = Math.ceil(lines.length * lineHeight + padding * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d')!;

        if (backgroundColor !== 'transparent') {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.font = fontSpec;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        let startX = padding;
        if (textAlign === 'center') {
          ctx.textAlign = 'center';
          startX = canvas.width / 2;
        } else if (textAlign === 'right') {
          ctx.textAlign = 'right';
          startX = canvas.width - padding;
        } else {
          ctx.textAlign = 'left';
        }

        lines.forEach((line, index) => {
          const y = padding + index * lineHeight;

          if (strokeColor && effectiveStrokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = effectiveStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, startX, y);
          }

          ctx.fillText(line, startX, y);
        });

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate straight text blob'));
        }, 'image/png');
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Converts text into high-res PNG and uploads directly to Printify
 */
export const uploadTextAsImage = async (
  text: string,
  optionsOrUserId?: any,
  maybeOptions?: any
): Promise<{ id: string; url: string; filename: string }> => {
  const options: TextToImageOptions =
    typeof optionsOrUserId === 'object' && optionsOrUserId !== null
      ? optionsOrUserId
      : maybeOptions || {};

  const { printifyAPI } = await import('../lib/api');
  const blob = await convertTextToImage(text, options);

  const cleanName = text.trim().slice(0, 15).replace(/[^a-zA-Z0-9]/g, '_') || 'custom_text';
  const filename = `text_${cleanName}_${Date.now()}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  const result = await printifyAPI.uploadFileDirectly(file);
  const uploaded = result?.result || result;

  return {
    id: uploaded.id || String(Date.now()),
    url: (uploaded.file_url || uploaded.url || '').replace(/%25/g, '%'),
    filename,
  };
};