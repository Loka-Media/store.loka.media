import React from "react";
import { Check } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon: React.ElementType;
  completed: boolean;
}

interface EnhancedStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

const EnhancedStepper: React.FC<EnhancedStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  // Calculate progress line width to end at the center of current step circle
  const progressPercentage = steps.length > 1
    ? ((currentStep - 1) / (steps.length - 1)) * 100
    : 100;

  return (
    <div className="gradient-border-white-bottom rounded-2xl bg-black px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 border border-gray-800">
      {/* Steps Container - Horizontal Layout with center alignment */}
      <div className="relative w-full" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Background Progress Line - positioned absolutely at vertical center */}
        <div
          className="absolute h-1 sm:h-1.5 bg-white"
          style={{
            top: "30%",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />

        {/* Active Progress Line - Fills to current step center */}
        <div
          className="absolute h-1 sm:h-1.5 bg-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          style={{
            top: "30%",
            left: 0,
            width: `${progressPercentage}%`,
            transform: "translateY(-50%)",
            zIndex: 1,
            pointerEvents: "none"
          }}
        />

        {/* Steps Flex Container */}
        <div className="flex items-center justify-between w-full relative z-10" style={{ gap: "1rem" }}>
          {/* Steps */}
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = step.completed;
            const isPast = currentStep > stepNumber;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3 flex-1 min-w-0"
              >
                {/* Step Circle - Orange for current, Green for completed/past, White for upcoming */}
                <button
                  onClick={() => onStepClick?.(stepNumber)}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full border-2 sm:border-3 flex items-center justify-center transition-all duration-300 transform hover:scale-110 flex-shrink-0 ${
                    isCompleted || isPast
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                      : stepNumber === (currentStep || 1)
                      ? "bg-orange-500 border-orange-500 shadow-[0_0_30px_rgba(255,133,27,0.5)]"
                      : "bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white font-bold" />
                  ) : stepNumber === (currentStep || 1) ? (
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
                  ) : (
                    <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-gray-800" />
                  )}
                </button>

                {/* Step Label - Below Circle */}
                <div className="text-center min-w-0 px-1">
                  <p className="text-xs sm:text-sm md:text-sm text-white font-medium line-clamp-2 break-words leading-tight">
                    {step.title}
                  </p>
                  <p className="hidden md:block text-xs text-gray-400 line-clamp-1 break-words leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedStepper;
