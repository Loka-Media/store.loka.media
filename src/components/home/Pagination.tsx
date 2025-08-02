"use client";

interface PaginationProps {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  onPageChange: (newOffset: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (pagination.total === 0) return null;

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const handlePrevious = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    onPageChange(newOffset);
  };

  const handleNext = () => {
    const newOffset = pagination.offset + pagination.limit;
    onPageChange(newOffset);
  };

  return (
    <div className="flex justify-center items-center mt-12 space-x-4">
      <button
        onClick={handlePrevious}
        disabled={pagination.offset === 0}
        className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        Previous
      </button>
      <span className="text-lg text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={!pagination.hasNext}
        className="px-6 py-3 bg-gray-800 text-gray-300 rounded-full hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        Next
      </button>
    </div>
  );
}
