import { ExtendedProduct } from "@/lib/api";
import { ProductCard } from "./ProductCard";

interface ProductsGridProps {
  products: ExtendedProduct[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .product-card-animate {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="product-card-animate"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </>
  );
}
