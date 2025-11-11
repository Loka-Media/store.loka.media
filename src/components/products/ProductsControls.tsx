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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b-4 border-black">
      {/* Results Count */}
      <div className="text-black text-base font-extrabold">
        {loading ? (
          <div className="flex items-center bg-yellow-200 px-4 py-2 rounded-full border-2 border-black">
            <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading products...
          </div>
        ) : (
          <span className="bg-pink-200 px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
            <span className="text-black font-extrabold">
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
          className="w-full sm:w-auto px-4 py-3 bg-white border-3 border-black rounded-lg text-black text-sm font-extrabold transition-all duration-200 focus:outline-none hover:bg-yellow-50 appearance-none pr-10 shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
        >
          <option value="created_at-DESC">Newest First</option>
          <option value="created_at-ASC">Oldest First</option>
          <option value="base_price-ASC">Price: Low to High</option>
          <option value="base_price-DESC">Price: High to Low</option>
          <option value="name-ASC">Name: A to Z</option>
          <option value="name-DESC">Name: Z to A</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
