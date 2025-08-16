import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const ProductPageNavigation = () => {
  return (
    <Link
      href="/products"
      className="inline-flex items-center mb-8 text-gray-400 hover:text-white group transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
      <span>Back to Products</span>
    </Link>
  );
};