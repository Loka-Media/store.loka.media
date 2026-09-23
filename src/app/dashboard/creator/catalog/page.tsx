/* eslint-disable @typescript-eslint/no-explicit-any */
/* disable-eslint */
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { printifyAPI } from "@/lib/api";
import { useGlobalMarkup } from "@/contexts/GlobalMarkupContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Search, Package, Plus, ArrowLeft, X, Loader2, Folder, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { SUBCATEGORIES_CONFIG } from "@/config/categories";

import { ImageWithFallback } from "@/components/ImageWithFallback";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";
import GradientTitle from "@/components/ui/GradientTitle";
import { GradientText } from "@/components/ui/GradientText";
import { Button } from "@/components/ui/button";
import CreativeLoader from "@/components/CreativeLoader";

interface Category {
  id: number;
  title: string;
  parent_id: number;
  image_url?: string;
  catalog_position?: number;
  size?: string;
}

interface PrintfulProduct {
  id: number;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  title: string;
  description?: string;
  main_category_id: number;
  is_discontinued: boolean;
  avg_fulfillment_time?: number;
  techniques?: Array<{
    key: string;
    display_name: string;
    is_default: boolean;
  }>;
  files?: Array<{
    id: string;
    type: string;
    title: string;
    additional_price: string | null;
    options: unknown[];
  }>;
  options?: unknown[];
  dimensions?: unknown;
  origin_country?: string;
  variants?: Array<{
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code: string;
    color_code2?: string;
    image: string;
    price: string;
    in_stock: boolean;
    availability_regions: Record<string, string>;
    availability_status: Array<{
      region: string;
      status: string;
    }>;
  }>;
  price?: string;
  premiumPrice?: string;
  colorsCount?: number;
  sizesCount?: number;
  providersCount?: number;
  /**
   * Category IDs this blueprint belongs to, from blueprint_categories.json.
   * Used by subcategory match() functions for gender-aware filtering.
   * e.g. [1] = Men only, [2] = Women only, [1,2] = Unisex, [3] = Kids, etc.
   */
  categoryIds?: number[];
}



export default function CreatorCatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<PrintfulProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<PrintfulProduct | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    sortBy: "name",
    sortOrder: "ASC",
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; title: string; match: (bp: any) => boolean } | null>(
    null
  );

  const hasFetchedCategoriesRef = useRef(false);

  const fetchCatalog = useCallback(
    async (categoryId: number) => {
      try {
        setLoading(true);
        console.log(
          `🔄 Fetching catalog for category ${categoryId} with filters:`,
          filters
        );

        // Use basic filtering - show all products but filter out deprecated ones
        const response = await printifyAPI.getCatalog({
          ...filters,
          category: categoryId.toString(),
        });

        console.log(`📦 API Response:`, response);
        console.log(
          `📦 Fetched ${response.result?.length || 0
          } products from category ${categoryId}`
        );

        if (response.filtered_count !== undefined) {
          console.log(
            `📊 Showing ${response.filtered_count} available out of ${response.original_count} total products`
          );
        }

        if (!response.result || response.result.length === 0) {
          console.warn(`⚠️ No products returned for category ${categoryId}`);
          toast("No products found in this category", { duration: 4000 });
        }

        setProducts(response.result || []);
      } catch (error: any) {
        console.error("Failed to fetch catalog:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        if (error.response?.status === 401) {
          toast.error("Please log in again to view catalog");
        } else {
          toast.error(
            `Failed to load catalog: ${error.message || "Unknown error"}`
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasFetchedCategoriesRef.current) {
      return;
    }
    hasFetchedCategoriesRef.current = true;

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await printifyAPI.getCategories();
      setCategories(response.result?.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSelectCategory = (category: Category) => {
    window.scrollTo(0, 0);
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setFilters((prev) => ({ ...prev, search: "" }));
    fetchCatalog(category.id);
  };

  const handleSelectSubcategory = (subcat: any) => {
    window.scrollTo(0, 0);
    setSelectedSubcategory(subcat);
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  const handleBackToSubcategories = () => {
    window.scrollTo(0, 0);
    setSelectedSubcategory(null);
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  const handleBackToCategories = () => {
    window.scrollTo(0, 0);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setFilters((prev) => ({ ...prev, search: "" }));
    setProducts([]);
  };

  const handleCreateProduct = (printfulProduct: PrintfulProduct) => {
    // Store selected product in localStorage and navigate to design workflow
    console.log("Storing product and navigating:", printfulProduct);
    localStorage.setItem(
      "selectedPrintfulProduct",
      JSON.stringify(printfulProduct)
    );

    // Store the source category so canvas can auto-select it in Marketplace Category dropdown
    if (selectedCategory) {
      localStorage.setItem('sourceCatalogCategory', JSON.stringify({
        id: selectedCategory.id,
        title: selectedCategory.title
      }));
    } else if (printfulProduct.categoryIds && printfulProduct.categoryIds.length > 0) {
      const catId = printfulProduct.categoryIds[0];
      const matchedCat = categories.find((c) => c.id === catId);
      if (matchedCat) {
        localStorage.setItem(
          'sourceCatalogCategory',
          JSON.stringify({
            id: matchedCat.id,
            title: matchedCat.title,
          })
        );
      }
    }

    // Navigate to design canvas workflow with 4 steps
    router.push(`/dashboard/creator/canvas?blueprintId=${printfulProduct.id}`);
  };

  const handleSelectSubcategoryFromSearch = async (category: Category, subcat: any) => {
    window.scrollTo(0, 0);
    setSelectedCategory(category);
    setSelectedSubcategory(subcat);
    setFilters((prev) => ({ ...prev, search: "" }));
    await fetchCatalog(category.id);
  };

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-black">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-26 pb-16">
          {!selectedCategory ? (
            <CategorySelection
              categories={categories}
              onSelectCategory={handleSelectCategory}
              onSelectSubcategoryFromSearch={handleSelectSubcategoryFromSearch}
              onCreateProduct={handleCreateProduct}
            />
          ) : !selectedSubcategory ? (
            <SubcategorySelection
              category={selectedCategory}
              products={products}
              loading={loading}
              onSelectSubcategory={handleSelectSubcategory}
              onBack={handleBackToCategories}
            />
          ) : (
            <ProductView
              products={products.filter((p) => selectedSubcategory.match(p))}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              handleCreateProduct={handleCreateProduct}
              setSelectedProduct={setSelectedProduct}
              onBackToCategories={handleBackToSubcategories}
              subcategoryTitle={selectedSubcategory.title}
            />
          )}
        </div>

        {/* Product Details Modal */}
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onCreateProduct={handleCreateProduct}
          />
        )}
      </div>
    </CreatorProtectedRoute>
  );
}

function GlobalCatalogSearch({
  categories,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  onSelectSubcategory,
  onCreateProduct,
  onViewAllInGrid,
}: {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectCategory: (category: Category) => void;
  onSelectSubcategory: (category: Category, subcat: any) => void;
  onCreateProduct: (product: PrintfulProduct) => void;
  onViewAllInGrid?: () => void;
}) {
  const { calculateSellingPrice } = useGlobalMarkup();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productResults, setProductResults] = useState<PrintfulProduct[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K, Cmd+K, or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API search for products/catalogs
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setProductResults([]);
      setIsSearchingProducts(false);
      return;
    }

    setIsSearchingProducts(true);
    const timer = setTimeout(async () => {
      try {
        const response = await printifyAPI.getCatalog({ search: trimmed });
        setProductResults(response.result || []);
      } catch (err) {
        console.error("Global search catalog error:", err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Matching root categories
  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return categories.filter(
      (c) => c.parent_id === 0 && c.title.toLowerCase().includes(q)
    );
  }, [searchQuery, categories]);

  // Matching subcategories across all categories
  const matchingSubcategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches: Array<{
      id: string;
      title: string;
      category: Category;
      subcat: any;
    }> = [];

    categories.forEach((cat) => {
      const subcats = SUBCATEGORIES_CONFIG[cat.id] || [];
      subcats.forEach((sub) => {
        if (sub.title.toLowerCase().includes(q)) {
          matches.push({
            id: `${cat.id}-${sub.id}`,
            title: `${sub.title} (${cat.title})`,
            category: cat,
            subcat: sub,
          });
        }
      });
    });

    return matches.slice(0, 8);
  }, [searchQuery, categories]);

  const hasAnyResults =
    matchingCategories.length > 0 ||
    matchingSubcategories.length > 0 ||
    productResults.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-[80%] mx-auto mb-8 sm:mb-12 z-30"
    >
      {/* Search Bar Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/25 via-orange-400/15 to-orange-600/25 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300 pointer-events-none"></div>

        <div className="relative flex items-center bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/15 focus-within:border-orange-500/80 rounded-2xl transition-all duration-300 shadow-2xl">
          <div className="pl-4 sm:pl-5 text-gray-400 group-focus-within:text-orange-400 transition-colors pointer-events-none">
            <Search className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search categories, products, catalogs (e.g. Hoodie, Bella Canvas, Mug, Men)..."
            className="w-full bg-transparent px-3.5 sm:px-4 py-3.5 sm:py-4 text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none font-medium"
          />

          <div className="pr-3.5 sm:pr-5 flex items-center gap-2.5 flex-shrink-0">
            {isSearchingProducts && (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 animate-spin flex-shrink-0" />
            )}

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setProductResults([]);
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-400 select-none pointer-events-none whitespace-nowrap flex-shrink-0">
              <span>⌘K</span>
              <span className="text-gray-600">•</span>
              <span>/</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Dropdown Results */}
      {isOpen && searchQuery.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#101013]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(255,109,31,0.2)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/10 custom-scrollbar">
            {/* Matching Categories & Subcategories */}
            {(matchingCategories.length > 0 || matchingSubcategories.length > 0) && (
              <div className="p-3 sm:p-4 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Folder className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Categories & Subcategories
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setIsOpen(false);
                        onSelectCategory(cat);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-500/60 text-white text-xs sm:text-sm font-semibold transition-all group"
                    >
                      <span className="text-orange-400">📁</span>
                      <span>{cat.title}</span>
                      <ArrowRight className="w-3 h-3 text-orange-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}

                  {matchingSubcategories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsOpen(false);
                        onSelectSubcategory(item.category, item.subcat);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-orange-400/50 text-gray-200 hover:text-white text-xs sm:text-sm font-medium transition-all group"
                    >
                      <Tag className="w-3 h-3 text-orange-400" />
                      <span>{item.title}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Products */}
            {productResults.length > 0 && (
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Catalog Products ({productResults.length})
                    </span>
                  </div>
                  {onViewAllInGrid && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onViewAllInGrid();
                      }}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      View all in grid →
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {productResults.slice(0, 8).map((product) => {
                    const pppPrice = parseFloat(
                      (product as any).premiumPrice ||
                        (product as any).cost ||
                        product.price ||
                        '0'
                    ).toFixed(2);
                    const lokaPrice = calculateSellingPrice(
                      parseFloat(pppPrice),
                      product.title
                    ).toFixed(2);

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setIsOpen(false);
                          onCreateProduct(product);
                        }}
                        className="flex items-center gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-orange-500/30 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10">
                          <ImageWithFallback
                            src={product.image || "/placeholder-product.png"}
                            alt={product.title || product.model}
                            fill
                            sizes="48px"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">
                              {product.title || product.model}
                            </span>
                            {product.brand && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10 flex-shrink-0">
                                {product.brand}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{product.sizesCount || 4} sizes</span>
                            <span>•</span>
                            <span>{product.colorsCount || 5} colors</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">Cost: ${pppPrice}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block font-medium">Selling From</span>
                            <span className="font-extrabold text-orange-400 text-sm">
                              {formatPrice(lokaPrice)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-md group-hover:shadow-orange-500/30 transition-all"
                          >
                            <span>Design</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isSearchingProducts && productResults.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin mx-auto mb-2" />
                <span className="text-xs sm:text-sm">
                  Searching Printify catalog for &quot;{searchQuery}&quot;...
                </span>
              </div>
            )}

            {/* Empty state */}
            {!isSearchingProducts && !hasAnyResults && (
              <div className="p-8 text-center text-gray-400">
                <Package className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
                <span className="text-sm font-semibold text-white block">
                  No results found for &quot;{searchQuery}&quot;
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching for categories (e.g. &quot;Men&quot;, &quot;Mugs&quot;) or products (e.g. &quot;Bella Canvas&quot;, &quot;Hoodie&quot;, &quot;Gildan&quot;).
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySelection({
  categories,
  onSelectCategory,
  onSelectSubcategoryFromSearch,
  onCreateProduct,
}: {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  onSelectSubcategoryFromSearch: (category: Category, subcat: any) => void;
  onCreateProduct: (product: PrintfulProduct) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [searchResults, setSearchResults] = useState<PrintfulProduct[]>([]);

  // Debounced search for the main page grid when user is searching
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearchingCatalog(false);
      return;
    }

    setIsSearchingCatalog(true);
    const timer = setTimeout(async () => {
      try {
        const response = await printifyAPI.getCatalog({ search: trimmed });
        setSearchResults(response.result || []);
      } catch (err) {
        console.error("Search catalog error:", err);
      } finally {
        setIsSearchingCatalog(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories.filter((c: { parent_id: number }) => c.parent_id === 0);
    return categories.filter(
      (c: { parent_id: number; title: string }) =>
        c.parent_id === 0 && c.title.toLowerCase().includes(q)
    );
  }, [searchQuery, categories]);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div>
      {/* Global Search Bar (Positioned ABOVE 'Choose a Category') */}
      <GlobalCatalogSearch
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCategory={onSelectCategory}
        onSelectSubcategory={onSelectSubcategoryFromSearch}
        onCreateProduct={onCreateProduct}
        onViewAllInGrid={() => {
          const gridEl = document.getElementById("catalog-search-results");
          if (gridEl) gridEl.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {!isSearchActive ? (
        <>
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <GradientTitle
              text="Choose a Category"
              size="sm"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
            />
            <GradientText
              className="block mt-2 sm:mt-3 leading-relaxed max-w-3xl mx-auto"
              gradient="linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)"
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Select a product category to start creating your designs
            </GradientText>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categories
              .filter((c: { parent_id: number }) => c.parent_id === 0)
              .map((category: any) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onSelect={onSelectCategory}
                />
              ))}
          </div>
        </>
      ) : (
        /* Search Results View */
        <div id="catalog-search-results" className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <span>Search results for</span>
                <span className="text-orange-400">&quot;{searchQuery}&quot;</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Found {matchingCategories.length} categories and {searchResults.length} products
              </p>
            </div>

            <Button
              onClick={() => setSearchQuery("")}
              variant="secondary"
              className="self-start sm:self-auto px-4 py-2 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              View All Categories
            </Button>
          </div>

          {/* Matched Categories in Grid */}
          {matchingCategories.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Folder className="w-4 h-4 text-orange-400" />
                <span>Matching Categories ({matchingCategories.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {matchingCategories.map((category: any) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onSelect={onSelectCategory}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Matched Products in Grid */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-400" />
              <span>Matching Products & Catalogs ({searchResults.length})</span>
            </h3>

            {isSearchingCatalog ? (
              <CreativeLoader
                variant="product"
                message={`Searching catalog for "${searchQuery}"...`}
              />
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {searchResults.map((product: PrintfulProduct) => (
                  <PrintfulProductCard
                    key={product.id}
                    product={product}
                    onCreateProduct={onCreateProduct}
                  />
                ))}
              </div>
            ) : matchingCategories.length === 0 ? (
              <div className="text-center py-12 gradient-border-white-top rounded-2xl bg-gray-900/60 p-8 border border-white/10">
                <Package className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                <span className="text-lg sm:text-xl font-bold text-white block mb-2">
                  No matching categories or products found
                </span>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                  We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try searching with a different term like &quot;T-Shirt&quot;, &quot;Bella Canvas&quot;, &quot;Mug&quot;, or &quot;Hoodie&quot;.
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  Clear Search and Browse Categories
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, onSelect }: any) {
  return (
    <div
      className="bg-black border border-white/15 hover:border-orange-500/60 rounded-2xl overflow-hidden group hover:shadow-[0_15px_35px_rgba(255,109,31,0.25)] hover:translate-y-[-4px] transition-transform transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelect(category)}
    >
      <div className="aspect-square relative overflow-hidden bg-black">
        {/* Image with fallback */}
        <ImageWithFallback
          src={category.image_url || category.image || '/placeholder-product.png'}
          alt={category.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-3 sm:p-4 bg-black border-t border-white/10">
        <span className="font-bold text-white text-sm sm:text-lg text-center group-hover:text-orange-400 transition-colors block">
          {category.title}
        </span>
      </div>
    </div>
  );
}

function ProductView({
  products,
  loading,
  filters,
  setFilters,
  handleCreateProduct,
  onBackToCategories,
  subcategoryTitle,
}: any) {
  // Client-side search filtering — no API call needed since products are already loaded
  const filteredProducts = useMemo(() => {
    const q = (filters.search || '').trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: any) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.type_name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.model || '').toLowerCase().includes(q)
    );
  }, [products, filters.search]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-4">
      {/* Filters Section */}
      <div className="gradient-border-white-top rounded-lg p-3 sm:p-4 bg-gray-900">
        <div className="flex flex-col gap-3 items-stretch sm:flex-row sm:gap-3 sm:items-center">
          <Button
            onClick={onBackToCategories}
            variant="secondary"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Back
          </Button>

          <div className="flex-grow w-full">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev: any) => ({
                    ...prev,
                    search: e.target.value,
                  }));
                  // No API call — filtering is done client-side via useMemo above
                }}
                className="w-full pl-8 pr-9 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-orange-500 focus:outline-none text-white placeholder-gray-400 font-normal transition-all text-xs sm:text-sm"
                placeholder="Search..."
              />
              <Search className="absolute left-2.5 top-2.5 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilters((prev: any) => ({ ...prev, search: "" }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  title="Clear search"
                >
                  <X className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div className="text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {subcategoryTitle}
            </h3>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-1.5 self-start sm:self-auto">
            <span className="text-xs sm:text-sm font-normal text-orange-400">
              {loading ? "Loading..." : `${filteredProducts.length} products`}
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <CreativeLoader variant="product" message="Loading products..." />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 gradient-border-white-top rounded-lg bg-gray-900">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 sm:p-4 inline-block mb-3 sm:mb-4">
              <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-orange-400" />
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white mb-2 block">
              No products found
            </span>
            <p className="text-sm sm:text-base font-bold text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredProducts.map((product: PrintfulProduct) => (
              <PrintfulProductCard
                key={product.id}
                product={product}
                onCreateProduct={handleCreateProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrintfulProductCard({
  product,
  onCreateProduct,
}: {
  product: PrintfulProduct;
  onCreateProduct: (product: PrintfulProduct) => void;
}) {
  const { calculateSellingPrice } = useGlobalMarkup();
  const { formatPrice } = useCurrency();
  const pbcPrice = parseFloat(product.price || '0').toFixed(2);
  const pppPrice = parseFloat((product as any).premiumPrice || (product as any).cost || product.price || '0').toFixed(2);
  const lokaPrice = calculateSellingPrice(parseFloat(pppPrice), product.title).toFixed(2);

  return (
    <div className="bg-black border border-white/15 hover:border-orange-500/60 rounded-2xl overflow-hidden group hover:shadow-[0_15px_35px_rgba(255,109,31,0.25)] hover:translate-y-[-4px] transition-transform transition-shadow duration-300 flex flex-col">
      {/* Image Section with Brand and Buttons */}
      <div className="aspect-square relative overflow-hidden rounded-t-2xl bg-black">
        <ImageWithFallback
          src={product.image || "/placeholder-product.png"}
          alt={product.title || product.model}
          fill
          unoptimized={true}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
        />
        <div onClick={() => onCreateProduct(product)} className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"></div>

        {/* Brand Badge - Top Right */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 sm:px-3 py-1">
          <span className="text-xs sm:text-sm font-bold text-black truncate max-w-[100px] sm:max-w-[120px] block">
            {product.brand}
          </span>
        </div>

        {/* Button - Bottom Left */}
        <button
          onClick={() => onCreateProduct(product)}
          className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 p-1.5 sm:p-2.5 rounded-full bg-black border border-orange-400 text-white hover:bg-orange-500 transition-all duration-300 transform hover:scale-110 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          title="Create Product"
        >
          <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Info Section - Bottom */}
      <div className="p-3 sm:p-4 flex flex-col gap-2.5 flex-grow text-center bg-black border-t border-white/10">
        {/* Product Type Label */}
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {product.type_name || product.type}
        </span>

        {/* Product Title */}
        <span className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-orange-400 transition-colors block line-clamp-2 min-h-[40px]">
          {product.title || product.model}
        </span>

        {/* Details Row (Sizes, Colors, Providers) */}
        <div className="text-[11px] sm:text-xs font-semibold text-gray-400 flex justify-center items-center gap-1.5 mt-auto">
          <span>{product.sizesCount || 0} sizes</span>
          <span className="text-gray-600">•</span>
          <span>{product.colorsCount || 0} colors</span>
          <span className="text-gray-600">•</span>
          <span>{product.providersCount || 0} providers</span>
        </div>

        {/* Pricing Info */}
        <div className="flex flex-col gap-1.5 mt-1 border-t border-white/10 pt-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-400/90 font-semibold">Printify Premium Cost:</span>
            <span className="font-bold text-emerald-400 text-xs">
              From {formatPrice(pppPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Selling Price:</span>
            <span className="font-extrabold text-orange-400 text-sm">
              From {formatPrice(lokaPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


function ProductDetailsModal({
  product,
  onClose,
  onCreateProduct,
}: {
  product: PrintfulProduct;
  onClose: () => void;
  onCreateProduct: (product: PrintfulProduct) => void;
}) {
  const { calculateSellingPrice } = useGlobalMarkup();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="gradient-border-white-top rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-900">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-3xl font-bold text-white block">
                {product.title || product.model}
              </span>
              <p className="text-gray-400 font-bold mt-1">by {product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors rounded-lg p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <Image
                src={product.image || "/placeholder-product.png"}
                alt={product.title || product.model}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex-grow">
                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-3">
                    Product Details
                  </span>
                  <div className="space-y-3 text-sm font-bold">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>{" "}
                      <span className="text-white">
                        {product.type_name || product.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Brand:</span>{" "}
                      <span className="text-white">{product.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Variants:</span>{" "}
                      <span className="text-white">
                        {product.variant_count}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-2">
                      <span className="text-gray-400">Standard Catalog Price (PBC):</span>{" "}
                      <span className="text-gray-400 line-through font-semibold">${parseFloat(product.price || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                      <span className="text-emerald-300 font-bold">Printify Premium Price (PPP):</span>{" "}
                      <span className="text-emerald-400 font-extrabold text-base">${parseFloat((product as any).premiumPrice || (product as any).cost || product.price || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-400">Estimated Retail Price:</span>{" "}
                      <span className="text-orange-400 font-extrabold text-base">${calculateSellingPrice(parseFloat((product as any).premiumPrice || (product as any).cost || product.price || '0'), product.title).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-4">
                    Available Variants
                  </span>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                    {product.variants?.slice(0, 12).map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center space-x-2 text-xs p-2 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-500 shadow-inner"
                          style={{
                            backgroundColor: variant.color_code || "#ccc",
                          }}
                        ></div>
                        <span className="text-gray-300 truncate font-bold">
                          {variant.size} - {variant.color}
                        </span>
                      </div>
                    ))}
                    {product.variants && product.variants.length > 12 && (
                      <div className="text-xs text-gray-400 font-bold col-span-3 mt-2">
                        +{product.variants.length - 12} more variants
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCreateProduct(product)}
                className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create Product with This Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubcategorySelection({ category, products, loading, onSelectSubcategory, onBack }: any) {
  // Filter subcategories that actually contain products in the current list (once loaded)
  const allSubcategories = SUBCATEGORIES_CONFIG[category.id] || [];

  // Show all by default while loading, but filter if loaded
  const availableSubcategories = loading
    ? allSubcategories
    : allSubcategories.filter(subcat => products.some((p: any) => subcat.match(p)));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 sm:mb-8 md:mb-12">
        <Button
          onClick={onBack}
          variant="secondary"
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Back
        </Button>
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {category.title} Catalog
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-bold">
            Select a subcategory to browse products
          </p>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <CreativeLoader variant="product" message="Loading subcategories..." />
      ) : availableSubcategories.length === 0 ? (
        <div className="text-center py-12 gradient-border-white-top rounded-lg bg-gray-900">
          <span className="text-xl font-bold text-white block mb-2">No subcategories available</span>
          <p className="text-gray-400 font-bold">Check back later for products in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {availableSubcategories.map((subcat: any) => {
            const matchingProducts = products.filter((p: any) => subcat.match(p));
            const exclusiveProduct = matchingProducts.find(
              (p: any) => Array.isArray(p.categoryIds) && p.categoryIds.length === 1
            );
            const matchingProduct = exclusiveProduct || matchingProducts[0];
            const coverImage = matchingProduct?.image || '/placeholder-product.png';

            return (
              <div
                key={subcat.id}
                className="bg-black border border-white/15 hover:border-orange-500/60 rounded-2xl overflow-hidden group hover:shadow-[0_15px_35px_rgba(255,109,31,0.25)] hover:translate-y-[-4px] transition-transform transition-shadow duration-300 cursor-pointer"
                onClick={() => onSelectSubcategory(subcat)}
              >
                <div className="aspect-square relative overflow-hidden bg-black">
                  <ImageWithFallback
                    src={coverImage}
                    alt={subcat.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-3 sm:p-4 bg-black border-t border-white/10">
                  <span className="font-bold text-white text-sm sm:text-lg text-center group-hover:text-orange-400 transition-colors block">
                    {subcat.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
