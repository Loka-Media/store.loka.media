"use client";

export function MakeAndSellSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Make & sell custom products
            </h2>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              There are no monthly contracts and no upfront costs. You set your prices and 
              choose your margins.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start now
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Browse All
              </button>
            </div>
            
            <p className="text-sm text-gray-400">
              Premium quality. Fast shipping. No minimums.
            </p>
          </div>
          
          {/* Right Video */}
          <div className="relative">
            <video 
              className="w-full h-auto rounded-lg shadow-2xl"
              autoPlay 
              muted 
              loop 
              playsInline
            >
              <source src="/images/v1.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}