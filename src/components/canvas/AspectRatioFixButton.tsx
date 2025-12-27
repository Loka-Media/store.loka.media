import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { DesignFile, PrintFile } from './types';
import { aspectRatioValidation } from '@/utils/aspectRatioValidation';
import toast from 'react-hot-toast';

interface AspectRatioFixButtonProps {
  designFiles: DesignFile[];
  activePlacement: string;
  activePrintFile: PrintFile | null;
  updateDesignPosition: (designId: number, updates: any) => void;
  onFixComplete?: () => void;
}

const AspectRatioFixButton: React.FC<AspectRatioFixButtonProps> = ({
  designFiles,
  activePlacement,
  activePrintFile,
  updateDesignPosition,
  onFixComplete,
}) => {
  const [isFixing, setIsFixing] = useState(false);

  const handleAutoFixAspectRatio = async () => {
    if (!activePlacement || !activePrintFile) {
      toast.error('No active placement or print file selected');
      return;
    }

    const designsForPlacement = designFiles.filter(
      (design) => design.placement === activePlacement && design.url
    );

    if (designsForPlacement.length === 0) {
      toast.error('No designs on active placement to fix');
      return;
    }

    setIsFixing(true);
    let fixedCount = 0;
    let skippedCount = 0;

    try {
      for (const design of designsForPlacement) {
        try {
          const { isValid, correctedDimensions, percentDifference } =
            await aspectRatioValidation(
              design.url,
              design.position.width,
              design.position.height,
              0.5 // Strict tolerance
            );

          if (!isValid && correctedDimensions) {
            // Apply the corrected dimensions
            updateDesignPosition(design.id, {
              width: correctedDimensions.width,
              height: correctedDimensions.height,
            });

            console.log(
              `✅ Fixed ${design.filename}: ${correctedDimensions.width}x${correctedDimensions.height}px (was off by ${percentDifference.toFixed(2)}%)`
            );
            fixedCount++;
          } else if (isValid) {
            console.log(
              `⏭️ Skipped ${design.filename}: Already within tolerance (${percentDifference.toFixed(2)}%)`
            );
            skippedCount++;
          }
        } catch (error) {
          console.error(`Failed to validate ${design.filename}:`, error);
          toast.error(`Failed to validate ${design.filename}`);
        }
      }

      // Show summary toast
      if (fixedCount > 0) {
        toast.success(
          `Fixed ${fixedCount} design${fixedCount !== 1 ? 's' : ''} for Printful compatibility!`
        );
      } else if (skippedCount > 0) {
        toast.success('All designs already have correct aspect ratios! 🎉');
      }

      onFixComplete?.();
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <button
      onClick={handleAutoFixAspectRatio}
      disabled={isFixing || !activePlacement}
      className="group relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed"
      title="Auto-fix aspect ratio"
    >
      <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${isFixing ? 'animate-spin' : ''}`} />

      {/* Tooltip */}
      <div className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 hidden group-hover:block pointer-events-none z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap shadow-lg border border-gray-700">
          <div className="font-semibold text-xs">Auto-fix</div>
          <div className="text-gray-300 mt-0.5 hidden sm:block text-xs">
            Automatically adjusts design dimensions to match Printful&apos;s
            compliance requirements
          </div>
          <div className="text-blue-300 text-xs mt-0.5 font-mono">
            {isFixing ? 'Fixing...' : 'Click to fix'}
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900" />
      </div>
    </button>
  );
};

export default AspectRatioFixButton;
