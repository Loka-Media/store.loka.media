"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface Category {
  name: string;
  description: string;
  icon: string;
  gradient: string;
  image: string;
}

const categories: Category[] = [
  {
    name: "Beverages",
    description: "Custom mugs, tumblers & drinkware",
    icon: "☕",
    gradient: "from-amber-500 to-orange-600",
    image: "/images/categories/beverages.jpg",
  },
  {
    name: "Jewelry",
    description: "Unique necklaces, bracelets & accessories",
    icon: "💎",
    gradient: "from-purple-500 to-pink-600",
    image: "/images/categories/jewelry.jpg",
  },
  {
    name: "Indian Collections",
    description: "Traditional & cultural designs",
    icon: "🪔",
    gradient: "from-rose-500 to-red-600",
    image: "/images/categories/indian.jpg",
  },
  {
    name: "Apparel",
    description: "T-shirts, hoodies & custom clothing",
    icon: "👕",
    gradient: "from-blue-500 to-cyan-600",
    image: "/images/categories/apparel.jpg",
  },
  {
    name: "Home Decor",
    description: "Wall art, pillows & more",
    icon: "🏠",
    gradient: "from-green-500 to-emerald-600",
    image: "/images/categories/home.jpg",
  },
  {
    name: "Accessories",
    description: "Bags, hats & lifestyle items",
    icon: "🎒",
    gradient: "from-indigo-500 to-purple-600",
    image: "/images/categories/accessories.jpg",
  },
];

export function ProductCategoriesSection() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-semibold tracking-wider uppercase text-sm">
              Explore Collections
            </span>
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
            Create Your Own Product{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Baseline
              </span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-lg"></span>
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Choose from our curated collections and start selling your unique
            designs today
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleCategoryClick(category.name)}
              className="group relative cursor-pointer"
            >
              {/* Card Container */}
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-gray-800 transition-all duration-500 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2">
                {/* Background Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                ></div>

                {/* Animated Border Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-xl opacity-50 group-hover:animate-pulse"></div>
                </div>

                {/* Content Container */}
                <div className="relative h-full flex flex-col p-8 z-10">
                  {/* Icon */}
                  <motion.div
                    animate={{
                      scale: hoveredIndex === index ? 1.1 : 1,
                      rotate: hoveredIndex === index ? [0, -5, 5, 0] : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-6xl mb-4"
                  >
                    {category.icon}
                  </motion.div>

                  {/* Category Name */}
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-6 group-hover:text-gray-300 transition-colors duration-300">
                    {category.description}
                  </p>

                  {/* Spacer */}
                  <div className="flex-grow"></div>

                  {/* CTA Button */}
                  <div className="flex items-center gap-2 text-purple-400 font-semibold group-hover:text-purple-300 transition-colors duration-300">
                    <span>Explore Collection</span>
                    <motion.div
                      animate={{
                        x: hoveredIndex === index ? 5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </div>

                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => router.push("/products")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
          >
            <span className="relative z-10">View All Products</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
