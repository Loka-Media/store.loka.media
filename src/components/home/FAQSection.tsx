"use client";

import { useState } from "react";

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How much does it cost to use Loka Media?",
      answer: "Loka Media is free to use. We take a small commission on sales to keep the platform running and continue improving our services."
    },
    {
      question: "How much money do I make on sales from the Loka Media catalog?",
      answer: "You earn a commission on every sale from the Loka Media catalog. The exact percentage varies by product type and volume, but you'll always see your earnings clearly before making any decisions."
    },
    {
      question: "Does Loka Media ship worldwide?",
      answer: "Yes! Loka Media ships to customers worldwide. We have fulfillment centers in multiple regions to ensure fast and cost-effective shipping to your customers globally."
    },
    {
      question: "Does Loka Media handle payment processing?",
      answer: "Absolutely. Loka Media handles all payment processing securely, including credit cards, PayPal, and other popular payment methods. You don't need to worry about setting up payment systems."
    },
    {
      question: "Does Loka Media handle sales tax?",
      answer: "Yes, Loka Media automatically handles sales tax calculations and remittance where required. This takes the complexity of tax compliance off your shoulders."
    },
    {
      question: "Can I connect a custom domain to Loka Media?",
      answer: "Yes! You can connect your own custom domain to your Loka Media store to maintain your brand identity and provide a seamless experience for your customers."
    },
    {
      question: "Does Loka Media offer artwork & design support?",
      answer: "Yes, we offer design services and have a library of templates to help you create amazing products. Our design team can also provide custom artwork services for your store."
    },
    {
      question: "Does Loka Media provide customer support for my orders?",
      answer: "Yes! Loka Media provides full customer support for all orders placed through your store, including handling returns, exchanges, and customer inquiries."
    },
    {
      question: "Can you show me examples of storefronts on Loka Media?",
      answer: "Of course! We have many successful creators using Loka Media. You can browse our creator showcase to see examples of different store styles and approaches."
    },
    {
      question: "What integrations does Loka Media have?",
      answer: "Loka Media integrates with popular platforms like Twitch, YouTube, Discord, and social media platforms. We also offer API access for custom integrations."
    },
    {
      question: "Are there any requirements to join Loka Media?",
      answer: "No special requirements! Loka Media is open to all creators, whether you're just starting out or already have an established audience. Simply sign up and start building your store."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="relative py-10 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-2">
            Frequently asked questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="border border-black rounded-lg overflow-hidden bg-white">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-black last:border-b-0">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 py-4 text-left flex items-center justify-between transition-all duration-200 focus:outline-none group"
              >
                <span className="text-base font-medium text-black pr-4 group-hover:text-gray-700 transition-colors">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-3 h-0.5 bg-black transition-all duration-300"></div>
                      <div 
                        className={`w-0.5 h-3 bg-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                          openFAQ === index ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFAQ === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4">
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}