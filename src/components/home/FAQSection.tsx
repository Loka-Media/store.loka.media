"use client";

import { useState } from "react";
import { HelpCircle, Plus, Minus } from "lucide-react";

export function FAQSection() {
  // test commits
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "How much does it cost to use Loka?",
      answer:
        "Loka is free to use. We take a small commission on sales to keep the platform running and continue improving our services.",
      color: "bg-yellow-200",
      hoverColor: "hover:bg-yellow-300"
    },
    {
      question:
        "How much money do I make on sales from the Loka catalog?",
      answer:
        "You earn a commission on every sale from the Loka catalog. The exact percentage varies by product type and volume, but you'll always see your earnings clearly before making any decisions.",
      color: "bg-pink-200",
      hoverColor: "hover:bg-pink-300"
    },
    {
      question: "Does Loka ship worldwide?",
      answer:
        "Yes! Loka ships to customers worldwide. We have fulfillment centers in multiple regions to ensure fast and cost-effective shipping to your customers globally.",
      color: "bg-green-200",
      hoverColor: "hover:bg-green-300"
    },
    {
      question: "Does Loka handle payment processing?",
      answer:
        "Absolutely. Loka handles all payment processing securely, including credit cards, PayPal, and other popular payment methods. You don't need to worry about setting up payment systems.",
      color: "bg-blue-200",
      hoverColor: "hover:bg-blue-300"
    },
    {
      question: "Does Loka handle sales tax?",
      answer:
        "Yes, Loka automatically handles sales tax calculations and remittance where required. This takes the complexity of tax compliance off your shoulders.",
      color: "bg-purple-200",
      hoverColor: "hover:bg-purple-300"
    },
    {
      question: "Can I connect a custom domain to Loka?",
      answer:
        "Yes! You can connect your own custom domain to your Loka store to maintain your brand identity and provide a seamless experience for your customers.",
      color: "bg-orange-200",
      hoverColor: "hover:bg-orange-300"
    },
    {
      question: "Does Loka offer artwork & design support?",
      answer:
        "Yes, we offer design services and have a library of templates to help you create amazing products. Our design team can also provide custom artwork services for your shop.",
      color: "bg-yellow-200",
      hoverColor: "hover:bg-yellow-300"
    },
    {
      question: "Does Loka provide customer support for my orders?",
      answer:
        "Yes! Loka provides full customer support for all orders placed through your store, including handling returns, exchanges, and customer inquiries.",
      color: "bg-pink-200",
      hoverColor: "hover:bg-pink-300"
    },
    {
      question: "Can you show me examples of storefronts on Loka?",
      answer:
        "Of course! We have many successful creators using Loka. You can browse our creator showcase to see examples of different store styles and approaches.",
      color: "bg-green-200",
      hoverColor: "hover:bg-green-300"
    },
    {
      question: "What integrations does Loka have?",
      answer:
        "Loka integrates with popular platforms like Twitch, YouTube, Discord, and social media platforms. We also offer API access for custom integrations.",
      color: "bg-blue-200",
      hoverColor: "hover:bg-blue-300"
    },
    {
      question: "Are there any requirements to join Loka?",
      answer:
        "No special requirements! Loka is open to all creators, whether you're just starting out or already have an established audience. Simply sign up and start building your own custom shop.",
      color: "bg-purple-200",
      hoverColor: "hover:bg-purple-300"
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 overflow-hidden border-y border-black">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-yellow-300 rounded-full opacity-20 hidden lg:block"></div>
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-pink-400 rounded-3xl opacity-20 hidden lg:block rotate-12"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <HelpCircle className="w-6 h-6 text-black" />
              <span className="text-sm font-extrabold text-black uppercase tracking-widest">FAQ</span>
            </div>
          </div>
          <h2
            id="faq-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-black mb-4 tracking-tight leading-tight"
          >
            Got Questions?
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
              We've Got Answers.
            </span>
          </h2>
          <p className="text-black text-lg font-medium max-w-2xl mx-auto">
            Everything you need to know about getting started with Loka.
          </p>
        </div>

        {/* FAQ Items - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${faq.color} border border-black rounded-2xl overflow-hidden transition-all duration-300 ${faq.hoverColor} hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]`}
            >
              <h3>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-5 md:p-6 text-left flex items-start justify-between transition-all duration-300 focus:outline-none group"
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span className="text-base md:text-lg font-extrabold text-black pr-4 group-hover:translate-x-1 transition-transform">
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center transition-all duration-300 ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}>
                    {openFAQ === index ? (
                      <Minus className="w-5 h-5 text-white" />
                    ) : (
                      <Plus className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
              </h3>

              <div
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-heading-${index}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                  openFAQ === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 md:px-6 pb-5 md:pb-6 text-black text-sm md:text-base leading-relaxed font-medium border-t border-black/20 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at bottom */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="inline-block bg-white border border-black rounded-2xl p-6 md:p-8 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <p className="text-black font-extrabold text-lg md:text-xl mb-4">
              Still have questions?
            </p>
            <a
              href="/contact"
              className="inline-block bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-xl font-extrabold text-base transition-all border border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
