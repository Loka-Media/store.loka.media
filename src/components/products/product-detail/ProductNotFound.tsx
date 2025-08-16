import Link from 'next/link';

export const ProductNotFound = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
        <Link href="/products" className="bg-orange-500 text-white font-bold py-3 px-6 rounded-md hover:bg-orange-600 transition-colors">
          Browse Products
        </Link>
      </div>
    </div>
  );
};