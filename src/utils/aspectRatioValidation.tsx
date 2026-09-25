interface CorrectedDimensions {
  width: number;
  height: number;
}

interface AspectRatioResult {
  isValid: boolean;
  percentDifference: number;
  correctedDimensions: CorrectedDimensions | null;
}

export function aspectRatioValidation(
  imageUrl: string,
  positionWidth: number,
  positionHeight: number,
  tolerancePercent: number = 5.0 // Sensible tolerance for print compliance and pixel rounding
): Promise<AspectRatioResult> {
  return new Promise((resolve, reject) => {
    if (!imageUrl || !positionWidth || !positionHeight) {
      return reject(new Error("Missing required parameters"));
    }

    const img = new Image();

    img.onload = () => {
      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      if (!imageWidth || !imageHeight) {
        return resolve({
          isValid: true,
          percentDifference: 0,
          correctedDimensions: null,
        });
      }

      const targetRatio = positionWidth / positionHeight;
      const fileRatio = imageWidth / imageHeight;
      const relativeDiff = Math.abs(fileRatio - targetRatio) / fileRatio;
      const diffPercent = relativeDiff * 100;

      const valid = diffPercent <= tolerancePercent;
      let correctedDimensions: CorrectedDimensions | null = null;

      if (!valid) {
        let correctedWidth = positionWidth;
        let correctedHeight = positionHeight;

        if (targetRatio > fileRatio) {
          // Current box is wider than the natural ratio: constrain width to height * fileRatio
          correctedWidth = Math.round(positionHeight * fileRatio);
          correctedHeight = Math.round(positionHeight);
        } else {
          // Current box is taller than the natural ratio: constrain height to width / fileRatio
          correctedWidth = Math.round(positionWidth);
          correctedHeight = Math.round(positionWidth / fileRatio);
        }

        correctedDimensions = {
          width: Math.max(1, correctedWidth),
          height: Math.max(1, correctedHeight),
        };
      }

      resolve({
        isValid: valid,
        percentDifference: diffPercent,
        correctedDimensions,
      });
    };

    img.onerror = () => reject(new Error("Image failed to load"));

    // Clean double-encoded URL (e.g. %2520 -> %20)
    let cleanedUrl = imageUrl;
    if (cleanedUrl && cleanedUrl.includes('%25')) {
      try {
        cleanedUrl = cleanedUrl.replace(/%25/g, '%');
      } catch (e) {
        console.error("Failed to clean imageUrl:", e);
      }
    }

    img.src = cleanedUrl;
  });
}
