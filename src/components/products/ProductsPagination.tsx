interface ProductsPaginationProps {
  hasNext: boolean;
  setPagination: React.Dispatch<React.SetStateAction<any>>;
  fetchProducts: () => void;
}

export function ProductsPagination({
  hasNext,
  setPagination,
  fetchProducts,
}: ProductsPaginationProps) {
  if (!hasNext) return null;

  return (
    <div className="mt-16 text-center">
      <button
        onClick={() => {
          setPagination((prev: any) => ({
            ...prev,
            offset: prev.offset + prev.limit,
          }));
          fetchProducts();
        }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
      >
        Load More Products
      </button>
    </div>
  );
}
