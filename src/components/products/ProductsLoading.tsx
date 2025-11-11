interface ProductsLoadingProps {
  message?: string;
}

export function ProductsLoading({ message }: ProductsLoadingProps) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-xl text-gray-400">
        {message || "Discovering amazing products..."}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        This won&apos;t take long
      </p>
    </div>
  );
}
