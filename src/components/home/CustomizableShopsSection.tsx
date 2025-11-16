"use client";

import { useEffect, useRef } from "react";

export function CustomizableShopsSection() {
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  // Top row shop images (moving left)
  const topRowShops = [
    {
      url: "/images/w1.webp",
      title: "The Home of History",
      theme: "dark-blue",
      website: "https://neffsauce.com"
    },
    {
      url: "/images/w2.webp",
      title: "Fashion Forward",
      theme: "yellow",
      website: "https://shop.lonelyshark.io"
    },
    {
      url: "/images/w3.webp",
      title: "Grill Kings Edition",
      theme: "red-dark",
      website: "https://example3.com"
    },
    {
      url: "/images/w4.webp",
      title: "Warislane",
      theme: "black",
      website: "https://example4.com"
    },
    {
      url: "/images/w5.webp",
      title: "Creator Studio",
      theme: "white",
      website: "https://example5.com"
    },
    {
      url: "/images/w6.webp",
      title: "Retro Gaming",
      theme: "purple",
      website: "https://example6.com"
    }
  ];

  // Bottom row shop images (moving right)
  const bottomRowShops = [
    {
      url: "/images/w7.webp",
      title: "The Five King Show",
      theme: "blue",
      website: "https://example7.com"
    },
    {
      url: "/images/w8.webp",
      title: "Apparel Collection",
      theme: "beige",
      website: "https://example8.com"
    },
    {
      url: "/images/w9.webp",
      title: "Horror Series",
      theme: "dark-red",
      website: "https://example9.com"
    },
    {
      url: "/images/w10.webp",
      title: "Cartoon World",
      theme: "yellow-bright",
      website: "https://example10.com"
    }
  ];

  useEffect(() => {
    const topRow = topRowRef.current;
    const bottomRow = bottomRowRef.current;

    if (!topRow || !bottomRow) return;

    // Top row animation (moving right to left continuously)
    const topRowAnimation = topRow.animate([
      { transform: 'translateX(0%)' },
      { transform: 'translateX(-50%)' }
    ], {
      duration: 30000,
      iterations: Infinity,
      easing: 'linear'
    });

    // Bottom row animation (moving left to right continuously)
    const bottomRowAnimation = bottomRow.animate([
      { transform: 'translateX(-50%)' },
      { transform: 'translateX(0%)' }
    ], {
      duration: 35000,
      iterations: Infinity,
      easing: 'linear'
    });

    return () => {
      topRowAnimation.cancel();
      bottomRowAnimation.cancel();
    };
  }, []);


  const handleCardClick = (website: string) => {
    window.open(website, '_blank');
  };

  return (
    <section className="relative py-20 bg-gradient-to-br from-yellow-100 via-pink-50 to-yellow-50 overflow-hidden border-y border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl lg:text-4xl xl:text-5xl font-extrabold text-black mb-6 leading-tight tracking-tight">
            Fully Customizable shop,
            <br />
            <span className="font-normal text-gray-700">100% owned by you</span>
          </h2>
          <p className="text-lg text-black font-medium max-w-2xl mx-auto leading-relaxed">
            Or customize the product and publish to our shop. Easily customize your design, layout, and domain to create a brand that's as unique as you are.
          </p>
        </div>
      </div>

      {/* Scrolling shop previews */}
      <div className="space-y-8">
        {/* Top row - moving left */}
        <div className="overflow-hidden">
          <div
            ref={topRowRef}
            className="flex space-x-6"
            style={{ width: '200%' }}
          >
            {/* Duplicate the array to create seamless loop */}
            {[...topRowShops, ...topRowShops].map((shop, index) => (
              <div
                key={`top-${index}`}
                className="flex-shrink-0 w-80 h-60 rounded-2xl overflow-hidden shadow-lg hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group cursor-pointer border border-black"
                onClick={() => handleCardClick(shop.website)}
              >
                <div className="w-full h-full relative bg-white flex flex-col">
                  {/* Mock browser header */}
                  <div className="flex items-center p-3 border-b border-black bg-yellow-100">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full border border-black"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full border border-black"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                    </div>
                  </div>

                  {/* Shop content */}
                  <div className="flex-1 relative overflow-hidden">
                    {/* Main image */}
                    <img
                      src={shop.url}
                      alt={shop.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 border-t border-black/20">
                      <h3 className="text-white text-lg font-extrabold">{shop.title}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row - moving right */}
        <div className="overflow-hidden">
          <div
            ref={bottomRowRef}
            className="flex space-x-6"
            style={{ width: '200%' }}
          >
            {/* Duplicate the array to create seamless loop */}
            {[...bottomRowShops, ...bottomRowShops].map((shop, index) => (
              <div
                key={`bottom-${index}`}
                className="flex-shrink-0 w-80 h-60 rounded-2xl overflow-hidden shadow-lg hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group cursor-pointer border border-black"
                onClick={() => handleCardClick(shop.website)}
              >
                <div className="w-full h-full relative bg-white flex flex-col">
                  {/* Mock browser header */}
                  <div className="flex items-center p-3 border-b border-black bg-pink-100">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full border border-black"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full border border-black"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                    </div>
                  </div>

                  {/* Shop content */}
                  <div className="flex-1 relative overflow-hidden">
                    {/* Main image */}
                    <img
                      src={shop.url}
                      alt={shop.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 border-t border-black/20">
                      <h3 className="text-white text-lg font-extrabold">{shop.title}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </section>
  );
}
