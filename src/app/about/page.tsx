'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About Loka</h1>

          <div className="bg-pink-50 border border-pink-200 p-8 rounded-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Empowering Creators to Build Their Brand</h2>
            <p className="text-lg text-gray-600">
              Loka is a creative marketplace platform that empowers creators to design, customize, and sell unique products while building their brand and community.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          
          <p>
            We believe every creator deserves the tools and platform to turn their creativity into a sustainable business. Whether you're an artist, content creator, influencer, or entrepreneur, Loka provides everything you need to design, sell, and grow your brand.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Offer</h2>

          <div className="grid md:grid-cols-2 gap-6 my-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🎨 Design Tools</h3>
              <p className="text-gray-600">
                Powerful canvas editor with advanced design features, text tools, clipart library, and mockup generation capabilities.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🛍️ Marketplace</h3>
              <p className="text-gray-600">
                Integrated marketplace where creators can sell their designs on high-quality products with automated fulfillment.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Analytics</h3>
              <p className="text-gray-600">
                Comprehensive dashboard with sales analytics, customer insights, and performance metrics to grow your business.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🚀 No Upfront Costs</h3>
              <p className="text-gray-600">
                Start selling immediately with no inventory investment. Products are printed and shipped on-demand.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Technology</h2>
          
          <p>
            Built with modern technologies and integrated with industry-leading partners:
          </p>

          <ul>
            <li><strong>Secure Payments:</strong> Stripe integration for safe and reliable transactions</li>
            <li><strong>Global Reach:</strong> Shopify integration for expanded catalog and international fulfillment</li>
            <li><strong>Advanced Design:</strong> Custom-built canvas editor with professional design capabilities</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">For Creators</h2>

          <p>
            Whether you&apos;re just starting out or looking to expand your existing brand, Loka provides:
          </p>

          <ul>
            <li>Easy-to-use design tools that require no technical expertise</li>
            <li>Access to thousands of high-quality products</li>
            <li>Automated order processing and customer service</li>
            <li>Real-time analytics and insights</li>
            <li>Community support and resources</li>
            <li>Fair creator revenue sharing</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">For Customers</h2>
          
          <p>
            Shop unique, creator-designed products with confidence:
          </p>

          <ul>
            <li>Discover original designs from talented creators worldwide</li>
            <li>High-quality products with satisfaction guarantee</li>
            <li>Secure checkout and payment processing</li>
            <li>Fast, reliable shipping</li>
            <li>Easy returns for quality issues</li>
            <li>Support your favorite creators directly</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Join Our Community</h2>

          <p>
            Ready to start your creative journey? Join thousands of creators who are already building their brands and growing their businesses with Loka.
          </p>

          <div className="bg-pink-50 border border-pink-200 p-6 rounded-lg mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
              >
                Start Creating
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-pink-500 font-semibold rounded-lg border border-pink-500 hover:bg-gray-50 transition-colors"
              >
                Shop Products
              </Link>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>

          <p>
            Have questions or want to learn more? We'd love to hear from you:
          </p>

          <ul>
            <li><strong>General:</strong> <a href="mailto:hello@loka.media" className="text-pink-500 hover:text-pink-600">hello@loka.media</a></li>
            <li><strong>Creator Support:</strong> <a href="mailto:creators@loka.media" className="text-pink-500 hover:text-pink-600">creators@loka.media</a></li>
            <li><strong>Customer Support:</strong> <a href="mailto:support@loka.media" className="text-pink-500 hover:text-pink-600">support@loka.media</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}