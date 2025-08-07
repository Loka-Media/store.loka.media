import { ExtendedProduct } from "@/lib/api";
import { ProductListItem } from "./ProductListItem";

interface ProductsListProps {
  products: ExtendedProduct[];
}

export function ProductsList({ products }: ProductsListProps) {
  return (
    <div className="space-y-6">
      {products.map((product) => (
        <ProductListItem key={product.id} product={product} />
      ))}
    </div>
  );
}
