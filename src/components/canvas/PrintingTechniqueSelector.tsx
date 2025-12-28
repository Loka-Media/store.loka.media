/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Zap, CheckCircle } from "lucide-react";

// Printing techniques available from Printful
export const PRINTING_TECHNIQUES = [
  { id: "DTG", label: "DTG Printing", description: "Direct-to-garment digital printing" },
  { id: "DTFILM", label: "DT Film", description: "Direct-to-film transfer" },
  { id: "DIGITAL", label: "Digital Printing", description: "Digital printing" },
  { id: "CUT-SEW", label: "Cut & Sew", description: "Cut & sew sublimation" },
  { id: "UV", label: "UV Printing", description: "UV printing" },
  { id: "EMBROIDERY", label: "Embroidery", description: "Embroidery" },
  { id: "SUBLIMATION", label: "Sublimation", description: "Sublimation" },
  { id: "ENGRAVING", label: "Engraving", description: "Engraving" },
  { id: "SCREEN", label: "Screen Printing", description: "Screen printing" },
  { id: "VINYL", label: "Vinyl", description: "Vinyl cutting and application" },
];

interface PrintingTechniqueSelectorProps {
  selectedTechnique?: string;
  onTechniqueChange?: (technique: string) => void;
  title?: string;
  subtitle?: string;
  availableTechniques?: string[];
  loading?: boolean;
}

const PrintingTechniqueSelector: React.FC<PrintingTechniqueSelectorProps> = ({
  selectedTechnique,
  onTechniqueChange,
  title = "Printing Technique",
  subtitle = "Select your preferred printing method",
  availableTechniques,
  loading = false,
}) => {
  // Filter techniques to only show available ones
  const techniquesToShow = availableTechniques
    ? PRINTING_TECHNIQUES.filter((tech) => availableTechniques.includes(tech.id))
    : PRINTING_TECHNIQUES;

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-white">{title}</h4>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading available techniques...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h4 className="text-lg sm:text-xl font-bold text-white">{title}</h4>
      </div>
      <p className="text-gray-400 text-sm mb-4">{subtitle}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {techniquesToShow.map((technique) => (
          <button
            key={technique.id}
            onClick={() => onTechniqueChange?.(technique.id)}
            className={`group relative p-3 rounded-lg border-2 transition-all duration-300 ${
              selectedTechnique === technique.id
                ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                : "border-gray-700 bg-black/40 hover:border-gray-600 hover:bg-black/60"
            }`}
            title={technique.description}
          >
            <div className="text-center">
              <p className="font-semibold text-sm text-white mb-1">{technique.label}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{technique.description}</p>
            </div>
            {selectedTechnique === technique.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PrintingTechniqueSelector;
