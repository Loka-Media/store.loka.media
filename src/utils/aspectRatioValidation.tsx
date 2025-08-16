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
  tolerancePercent: number = 2
): Promise<AspectRatioResult> {
  return new Promise((resolve, reject) => {
    if (!imageUrl || !positionWidth || !positionHeight) {
      return reject(new Error("Missing required parameters"));
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      const targetRatio = positionWidth / positionHeight;
      const fileRatio = imageWidth / imageHeight;
      const relativeDiff = Math.abs(fileRatio - targetRatio) / targetRatio;
      const diffPercent = relativeDiff * 100;

      const valid = diffPercent <= tolerancePercent;
      let correctedDimensions: CorrectedDimensions | null = null;

      if (!valid) {
        if (fileRatio < targetRatio) {
          correctedDimensions = {
            width: Math.round(imageHeight * targetRatio),
            height: imageHeight,
          };
        } else {
          correctedDimensions = {
            width: imageWidth,
            height: Math.round(imageWidth / targetRatio),
          };
        }
      }

      resolve({
        isValid: valid,
        percentDifference: diffPercent,
        correctedDimensions,
      });
    };

    img.onerror = () => reject(new Error("Image failed to load"));

    img.src = imageUrl;
  });
}
