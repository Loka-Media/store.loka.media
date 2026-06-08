/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-black">
      {/* Results Count */}
      <div className="text-black text-base font-extrabold">
        {loading ? (
          <div className="flex items-center bg-yellow-200 px-4 py-2 rounded-full border border-black">
            <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading products...
          </div>
        ) : (
          <span className="bg-pink-200 px-4 py-2 rounded-full border border-black">
            <span className="text-black font-extrabold">
              {pagination.total}
            </span>{" "}
            products
          </span>
        )}
      </div>

      {/* Sort Dropdown */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={(val) => {
          const [sortBy, sortOrder] = val.split("-");
          setFilters((prev: any) => ({ ...prev, sortBy, sortOrder }));
        }}
      >
        <SelectTrigger className="w-[200px] h-12 bg-gray-800 border-gray-700">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at-DESC">Newest First</SelectItem>
          <SelectItem value="created_at-ASC">Oldest First</SelectItem>
          <SelectItem value="base_price-ASC">Price: Low to High</SelectItem>
          <SelectItem value="base_price-DESC">Price: High to Low</SelectItem>
          <SelectItem value="name-ASC">Name: A to Z</SelectItem>
          <SelectItem value="name-DESC">Name: Z to A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
