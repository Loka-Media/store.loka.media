interface ProductsPaginationProps {
  hasNext: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function ProductsPagination({
  hasNext,
  loading,
  onLoadMore,
}: ProductsPaginationProps) {
  if (!hasNext) return null;

  return (
    <div className="mt-16 text-center">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className={`py-4 px-8 rounded-xl font-bold transition-all duration-300 ${
          loading
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        ) : (
          "Load More Products"
        )}
      </button>
    </div>
  );
}
