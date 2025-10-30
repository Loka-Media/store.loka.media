import { ExtendedProduct } from "@/lib/api";
import { ProductCard } from "./ProductCard";

interface ProductsGridProps {
  products: ExtendedProduct[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
