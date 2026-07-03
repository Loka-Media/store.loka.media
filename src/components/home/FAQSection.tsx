"use client";

import { useState } from "react";
import { GradientText } from "@/components/ui/GradientText";

export function FAQSection() {
  // test commits
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: "How much does it cost to use Loka?",
      answer:
        "Loka is free to use. We take a small commission on sales to keep the platform running and continue improving our services.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question:
        "How much money do I make on sales from the Loka catalog?",
      answer:
        "You earn a commission on every sale from the Loka catalog. The exact percentage varies by product type and volume, but you'll always see your earnings clearly before making any decisions.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Does Loka ship worldwide?",
      answer:
        "Yes! Loka ships to customers worldwide. We have fulfillment centers in multiple regions to ensure fast and cost-effective shipping to your customers globally.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Does Loka handle payment processing?",
      answer:
        "Absolutely. Loka handles all payment processing securely, including credit cards, PayPal, and other popular payment methods. You don't need to worry about setting up payment systems.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Does Loka handle sales tax?",
      answer:
        "Yes, Loka automatically handles sales tax calculations and remittance where required. This takes the complexity of tax compliance off your shoulders.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Can I connect a custom domain to Loka?",
      answer:
        "Yes! You can connect your own custom domain to your Loka store to maintain your brand identity and provide a seamless experience for your customers.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Does Loka offer artwork & design support?",
      answer:
        "Yes, we offer design services and have a library of templates to help you create amazing products. Our design team can also provide custom artwork services for your shop.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Does Loka provide customer support for my orders?",
      answer:
        "Yes! Loka provides full customer support for all orders placed through your store, including handling returns, exchanges, and customer inquiries.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Can you show me examples of storefronts on Loka?",
      answer:
        "Of course! We have many successful creators using Loka. You can browse our creator showcase to see examples of different store styles and approaches.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "What integrations does Loka have?",
      answer:
        "Loka integrates with popular platforms like Twitch, YouTube, Discord, and social media platforms. We also offer API access for custom integrations.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
    {
      question: "Are there any requirements to join Loka?",
      answer:
        "No special requirements! Loka is open to all creators, whether you're just starting out or already have an established audience. Simply sign up and start building your own custom shop.",
      color: "bg-white/10",
      hoverColor: "hover:bg-white/20"
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="relative py-16 md:py-24 bg-black overflow-hidden border-y border-white/10">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="w-full max-w-4xl mx-auto mb-8 px-2 sm:px-4 md:px-6">
            <h2
              className="
  text-center
  !text-[34px]
  font-bold
  leading-[1.08]
  tracking-[-0.04em]

  sm:!text-[52px]

  md:!text-[58px]
  md:leading-[1.05]

  lg:!text-[65px]
  lg:text-left
"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #B94D13 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Got Questions?
              <br />
              <span
                className="
    block
    md:text-center
    lg:text-end
  "
              >
                We’ve Got You
              </span>
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
            Everything you need to know about getting started with Loka.
          </p>
        </div>

        {/* FAQ Items - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${faq.color} border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 ${faq.hoverColor} hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]`}
            >
              <h3>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-5 md:p-6 text-left flex items-start justify-between transition-all duration-300 focus:outline-none group"
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-panel-${index}`}
                >
                  {openFAQ === index ? (
                    <GradientText
                      gradient="linear-gradient(180deg, #FFFFFF 0%, #B94D13 100%)"
                      className="text-base md:text-lg font-extrabold pr-4 group-hover:translate-x-1 transition-transform block"
                      style={{ wordSpacing: '0.15em' }}
                    >
                      {faq.question}
                    </GradientText>
                  ) : (
                    <span className="text-base md:text-lg font-extrabold text-white pr-4 group-hover:translate-x-1 transition-transform" style={{ wordSpacing: '0.15em' }}>
                      {faq.question}
                    </span>
                  )}
                  <div className={`flex-shrink-0 transition-all duration-300 ${openFAQ === index ? "rotate-180" : ""
                    }`}>
                    {openFAQ === index ? (
                      <svg width="20" height="4" viewBox="0 0 36 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36 6H0V0H36V6Z" fill="url(#paint0_linear_1248_293)" />
                        <defs>
                          <linearGradient id="paint0_linear_1248_293" x1="17.9787" y1="-26.8604" x2="17.9787" y2="29.8256" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="#B94D13" />
                          </linearGradient>
                        </defs>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.0403 28H9.95973V17.8924H0V10.1076H9.95973V0H18.0403V10.1076H28V17.8924H18.0403V28Z" fill="url(#paint0_linear_1248_297)" />
                        <defs>
                          <linearGradient id="paint0_linear_1248_297" x1="13.993" y1="-23.8252" x2="13.993" y2="52.6883" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" />
                            <stop offset="1" stopColor="#B94D13" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </div>
                </button>
              </h3>

              <div
                id={`faq-panel-${index}`}
                role="region"
                aria-labelledby={`faq-heading-${index}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${openFAQ === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
              >
                <div className="overflow-hidden">
                  {openFAQ === index ? (
                    <GradientText
                      className="px-5 md:px-6 pb-5 md:pb-6 text-sm md:text-base leading-relaxed font-medium border-t border-white/20 pt-4 block"
                    >
                      {faq.answer}
                    </GradientText>
                  ) : (
                    <div className="px-5 md:px-6 pb-5 md:pb-6 text-white/90 text-sm md:text-base leading-relaxed font-medium border-t border-white/20 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
