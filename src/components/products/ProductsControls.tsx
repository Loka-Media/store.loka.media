/* eslint-disable @typescript-eslint/no-explicit-any */

interface ProductsControlsProps {
  loading: boolean;
  pagination: {
    total: number;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
}

export function ProductsControls({
  loading,
  pagination,
  filters,
  setFilters,
}: ProductsControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
      {/* Results Count */}
      <div className="text-foreground-muted text-base font-medium">
        {loading ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading products...
          </div>
        ) : (
          <span>
            <span className="text-black font-bold">
              {pagination.total}
            </span>{" "}
            products
          </span>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split("-");
            setFilters((prev: any) => ({ ...prev, sortBy, sortOrder }));
          }}
          className="w-full sm:w-auto px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-black text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-gray-300 appearance-none pr-10"
        >
          <option value="created_at-DESC">Newest First</option>
          <option value="created_at-ASC">Oldest First</option>
          <option value="base_price-ASC">Price: Low to High</option>
          <option value="base_price-DESC">Price: High to Low</option>
          <option value="name-ASC">Name: A to Z</option>
          <option value="name-DESC">Name: Z to A</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
