import { Button } from "@/components/ui/button";

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
    <div className="mt-16 text-center px-4 sm:px-0">
      <Button
        onClick={onLoadMore}
        disabled={loading}
        variant="primary"
        className={`w-full ${loading ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        ) : (
          "Load More Products"
        )}
      </Button>
    </div>
  );
}
