'use client';

import Navigation from '@/components/Navigation';
import { useState } from 'react';

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I become a creator?",
        answer: "To become a creator, simply register for an account and apply for creator status. Our team reviews all applications and will contact you with next steps if approved."
      },
      {
        question: "What can I design and sell?",
        answer: "You can design and sell a wide variety of products including apparel, accessories, home goods, and more. All designs must be original or properly licensed."
      },
      {
        question: "Do I need design experience?",
        answer: "No! Our design tools are user-friendly and perfect for beginners. We also provide tutorials and resources to help you get started."
      }
    ]
  },
  {
    category: "Orders & Shipping",
    questions: [
      {
        question: "How long does shipping take?",
        answer: "Shipping times vary by location: US (3-7 business days), Europe (5-10 business days), Other International (7-15 business days)."
      },
      {
        question: "Can I track my order?",
        answer: "Yes! Once your order ships, you'll receive a tracking number via email that you can use to monitor your package."
      },
      {
        question: "What if my package is lost?",
        answer: "If your package appears to be lost, please contact our support team immediately. We'll work with the carrier to locate it or arrange a replacement."
      }
    ]
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        question: "What is your return policy?",
        answer: "We accept returns for defective products within 30 days of purchase. Due to the custom nature of our products, we don't accept returns for sizing or general dissatisfaction."
      },
      {
        question: "How do I report a quality issue?",
        answer: "Email us at support@loka.media with clear photos of the issue and your order number. We'll quickly resolve quality problems."
      },
      {
        question: "How long do refunds take?",
        answer: "PayPal refunds appear within 24 hours. Credit card refunds take 7-10 business days depending on your bank."
      }
    ]
  },
  {
    category: "Creator Earnings",
    questions: [
      {
        question: "How much do creators earn?",
        answer: "Creator earnings vary based on product type and pricing. Detailed earnings information is available in your creator dashboard."
      },
      {
        question: "When do I get paid?",
        answer: "Payments are processed monthly for creators who meet the minimum payout threshold. Check your dashboard for specific dates and amounts."
      },
      {
        question: "How do I set my product prices?",
        answer: "You can set custom markups on products within platform guidelines. Higher quality designs and marketing typically support higher prices."
      }
    ]
  }
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState("Getting Started");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFAQ = faqData.filter(category => 
    category.category === activeCategory &&
    category.questions.some(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-gray-400 mb-8">
            Find answers to common questions or get in touch with our support team.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
            <nav className="space-y-2">
              {faqData.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setActiveCategory(category.category)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeCategory === category.category
                      ? 'bg-blue-900 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {category.category}
                </button>
              ))}
            </nav>

            {/* Quick Contact */}
            <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Still need help?</h3>
              <p className="text-sm text-gray-400 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium text-sm"
              >
                Contact Support
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-white mb-6">{activeCategory}</h2>
            
            <div className="space-y-4">
              {filteredFAQ.length > 0 ? (
                filteredFAQ[0].questions
                  .filter(q => 
                    searchTerm === "" ||
                    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    q.answer.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((faq, index) => (
                    <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No questions found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popular Help Articles */}
        <div className="mt-16 pt-16 border-t border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Popular Help Articles</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-white mb-2">
                Getting Started Guide
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Everything you need to know to start creating and selling on Loka Media.
              </p>
              <a href="/creator-guide" className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                Read Guide →
              </a>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-white mb-2">
                Design Best Practices
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Tips and tricks for creating high-quality designs that sell.
              </p>
              <a href="/design-tips" className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                Learn More →
              </a>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-white mb-2">
                Quality Standards
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Understand our quality requirements and how to meet them.
              </p>
              <a href="/quality-standards" className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                View Standards →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}