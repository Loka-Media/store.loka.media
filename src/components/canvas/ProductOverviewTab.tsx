import React from 'react';
import Image from 'next/image';
import { Home } from 'lucide-react';
import { Product } from './types';

interface ProductOverviewTabProps {
  selectedProduct: Product;
  selectedColors: string[];
}

const ProductOverviewTab: React.FC<ProductOverviewTabProps> = ({
  selectedProduct,
  selectedColors
}) => {
  return (
    <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
      {selectedColors.length > 0 ? (
        <div className="max-w-2xl">
          <Image
            src={
              selectedProduct?.variants?.find((v) =>
                selectedColors.includes(v.color)
              )?.image || "/placeholder-product.jpg"
            }
            alt="Product"
            width={600}
            height={600}
            className="w-auto h-auto max-h-[70vh] object-contain mx-auto"
          />
        </div>
      ) : (
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8" />
          </div>
          <p>Select product variants to see preview</p>
        </div>
      )}
    </div>
  );
};

export default ProductOverviewTab;