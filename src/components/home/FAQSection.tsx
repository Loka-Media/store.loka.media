"use client";

import { useState } from "react";

export function FAQSection() {
  // test commits
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How much does it cost to use Loka?",
      answer:
        "Loka is free to use. We take a small commission on sales to keep the platform running and continue improving our services.",
    },
    {
      question:
        "How much money do I make on sales from the Loka catalog?",
      answer:
        "You earn a commission on every sale from the Loka catalog. The exact percentage varies by product type and volume, but you'll always see your earnings clearly before making any decisions.",
    },
    {
      question: "Does Loka ship worldwide?",
      answer:
        "Yes! Loka ships to customers worldwide. We have fulfillment centers in multiple regions to ensure fast and cost-effective shipping to your customers globally.",
    },
    {
      question: "Does Loka handle payment processing?",
      answer:
        "Absolutely. Loka handles all payment processing securely, including credit cards, PayPal, and other popular payment methods. You don't need to worry about setting up payment systems.",
    },
    {
      question: "Does Loka handle sales tax?",
      answer:
        "Yes, Loka automatically handles sales tax calculations and remittance where required. This takes the complexity of tax compliance off your shoulders.",
    },
    {
      question: "Can I connect a custom domain to Loka?",
      answer:
        "Yes! You can connect your own custom domain to your Loka store to maintain your brand identity and provide a seamless experience for your customers.",
    },
    {
      question: "Does Loka offer artwork & design support?",
      answer:
        "Yes, we offer design services and have a library of templates to help you create amazing products. Our design team can also provide custom artwork services for your shop.",
    },
    {
      question: "Does Loka provide customer support for my orders?",
      answer:
        "Yes! Loka provides full customer support for all orders placed through your store, including handling returns, exchanges, and customer inquiries.",
    },
    {
      question: "Can you show me examples of storefronts on Loka?",
      answer:
        "Of course! We have many successful creators using Loka. You can browse our creator showcase to see examples of different store styles and approaches.",
    },
    {
      question: "What integrations does Loka have?",
      answer:
        "Loka integrates with popular platforms like Twitch, YouTube, Discord, and social media platforms. We also offer API access for custom integrations.",
    },
    {
      question: "Are there any requirements to join Loka?",
      answer:
        "No special requirements! Loka is open to all creators, whether you're just starting out or already have an established audience. Simply sign up and start building your own custom shop.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="relative py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            id="faq-heading"
            className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight"
          >
            Got Questions? We've Got Answers.
          </h2>
          <p className="text-gray-600 text-lg">
            Everything you need to know about getting started with Loka.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border-b border-gray-200 last:border-b-0 transition-all duration-300 ease-in-out ${
                openFAQ === index ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              <h3>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <span
                    className={`transform transition-transform duration-300 ease-in-out ${
                      openFAQ === index
                        ? "rotate-45 text-accent"
                        : "text-gray-600"
                    }`}
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
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
                  <div className="px-6 pb-6 text-gray-600 text-base leading-relaxed">
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
