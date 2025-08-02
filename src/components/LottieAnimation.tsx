// components/LottieAnimation.tsx (make sure it's .tsx for TypeScript)
import React, { useRef, useEffect, memo } from "react";
import lottie, { AnimationItem } from "lottie-web"; // Import AnimationItem

interface LottieAnimationProps {
  animationPath: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const LottieAnimation = memo(
  ({
    animationPath,
    loop = true,
    autoplay = true,
    style = {},
    className = "",
  }: LottieAnimationProps) => {
    const animationContainer = useRef<HTMLDivElement>(null);

    // --- FIX IS HERE: Type lottieInstance as AnimationItem or null ---
    const lottieInstance = useRef<AnimationItem | null>(null);
    // --- END FIX ---

    useEffect(() => {
      if (animationContainer.current) {
        // Check if there's an existing animation instance and destroy it
        if (lottieInstance.current) {
          lottieInstance.current.destroy();
        }

        // Load the new animation and assign it to the ref
        lottieInstance.current = lottie.loadAnimation({
          container: animationContainer.current,
          renderer: "svg",
          loop: loop,
          autoplay: autoplay,
          path: animationPath,
        });
      }

      // Cleanup function: destroy the animation when the component unmounts
      return () => {
        if (lottieInstance.current) {
          // Now TypeScript knows .current could be AnimationItem and has 'destroy'
          lottieInstance.current.destroy();
          lottieInstance.current = null; // Important to reset to null for cleanup
        }
      };
    }, [animationPath, loop, autoplay]); // Dependencies for useEffect

    return (
      <div ref={animationContainer} className={className} style={{ ...style }}>
        {/* Lottie will render inside this div */}
      </div>
    );
  }
);

LottieAnimation.displayName = "LottieAnimation";

export default LottieAnimation;
