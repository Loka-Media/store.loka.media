import { Search } from "lucide-react";

interface NoProductsFoundProps {
  clearFilters: () => void;
}

export function NoProductsFound({ clearFilters }: NoProductsFoundProps) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        No products found
      </h3>
      <p className="text-gray-400 mb-6">
        Try adjusting your filters or search terms
      </p>
      <button
        onClick={clearFilters}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
      >
        Clear All Filters
      </button>
    </div>
  );
}
