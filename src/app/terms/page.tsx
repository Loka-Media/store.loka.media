'use client';

const termsSections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p className="mb-4">
          Welcome to Loka (
          <a href="https://loka.media" className="text-[#FF6D1F] hover:underline">
            loka.media
          </a>
          ). These Terms of Use (&quot;Terms&quot;) govern your access to and use of our website, platform, creator storefronts, mobile applications, and monetization services (collectively, the &quot;Platform&quot;).
        </p>
        <p className="mb-4">
          The Platform is owned and operated by Loka Media Inc. (&quot;Loka&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account, launching a storefront, or using any part of the Platform, you (&quot;Creator&quot;, &quot;Artist&quot;, &quot;User&quot;, or &quot;you&quot;) agree to be bound by these Terms.
        </p>
        <p>
          If you are entering into these Terms on behalf of a company, agency, or other legal entity (such as a talent agency or brand partner), you represent and warrant that you have the authority to bind that entity to these Terms. If you do not agree to these Terms, you must not access or use the Platform.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "2. Description of Services",
    content: (
      <>
        <p className="mb-4">
          Loka is a creator-first monetization platform. We offer zero-upfront-cost tools for Artists, Influencers, and Creators to design custom branded product lines, set up custom e-commerce storefronts, access exclusive brand campaigns, and monetize their audience beyond content.
        </p>
        <p className="mb-4">
          Loka handles:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>Hosting, building, and maintaining your custom creator storefront.</li>
          <li>Sourcing blanks, manufacturing, and printing your designs onto apparel, accessories, and other products.</li>
          <li>Order fulfillment, packaging, shipping, tracking, and customer service.</li>
          <li>Payment processing, refund handling, and creator earnings distribution.</li>
        </ul>
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time, including store templates, features, product offerings, or design tools, without liability to you.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. Storefronts & Creator Verification",
    content: (
      <>
        <p className="mb-4">
          To launch a storefront and distribute merchandise, you must register for an account. We offer two creator pathways:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Agency Managed:</strong> For creators represented by verified talent agencies. Your agency handles store settings, payouts, and licensing on your behalf.
          </li>
          <li>
            <strong className="text-white">Independent:</strong> For creators who manage their own storefronts, payments, and payouts directly.
          </li>
        </ul>
        <p className="mb-4">
          Account creation requires providing accurate, current, and complete details, including social links (Instagram, YouTube, TikTok, or Spotify) and contact numbers.
        </p>
        <p>
          Verification and storefront activation are at our sole discretion. We reserve the right to reject any application for a storefront without providing a reason. You are responsible for keeping your credentials secure and notifying us immediately of any unauthorized access.
        </p>
      </>
    ),
  },
  {
    id: "ip-licensing",
    title: "4. Intellectual Property Rights",
    content: (
      <>
        <p className="mb-4">
          We respect intellectual property rights and expect you to do the same.
        </p>
        <div className="bg-[#151515] border-l-4 border-[#FF6D1F] p-4 rounded-r-xl mb-6">
          <h4 className="font-bold text-white mb-2 font-clash">Creator IP Ownership</h4>
          <p className="text-sm">
            You retain 100% ownership of all original artwork, logos, graphics, brand marks, and slogans that you upload to the Platform or use in your custom merchandise (&quot;Creator IP&quot;). Loka does not claim ownership over any of your content.
          </p>
        </div>
        <p className="mb-4">
          <strong className="text-white">License to Loka:</strong> By uploading designs or setting up a storefront, you grant Loka a limited, non-exclusive, worldwide, royalty-free, sublicensable license to manufacture, print, distribute, display, market, adapt (solely for print formatting), and sell merchandise featuring your Creator IP. This license is granted solely to allow us to operate your storefront, print and fulfill orders placed by your fans, and market your products.
        </p>
        <p className="mb-4">
          <strong className="text-white">Loka IP:</strong> Loka retains all rights, title, and interest in and to the Platform, including our brand, logos, storefront designs, website themes, custom codes, proprietary algorithms, image templates, and other assets provided by us. You are granted a limited, personal, non-transferable license to use our tools to set up your storefront during the term of these Terms.
        </p>
      </>
    ),
  },
  {
    id: "manufacturing",
    title: "5. Manufacturing, Fulfillment & Shipping",
    content: (
      <>
        <p className="mb-4">
          Loka operates a global on-demand printing and manufacturing network. When a customer purchases a product from your store:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>We direct the order to the closest or most efficient fulfillment facility.</li>
          <li>All product specs, sizing grids, and materials will be displayed on the product page.</li>
          <li>Production times vary by season and product category, typically taking 3 to 7 business days before shipping.</li>
        </ul>
        <p className="mb-4">
          Shipping and delivery estimates are provided by shipping carriers and are not guaranteed by Loka. Custom duties, import taxes, or local carrier fees are the responsibility of the buying customer.
        </p>
        <p>
          We stand behind the quality of our products. If a customer receives a defective, damaged, or incorrectly sized product due to printing or manufacturing errors, we will replace the product or issue a full refund at no cost to the Creator.
        </p>
      </>
    ),
  },
  {
    id: "earnings",
    title: "6. Creator Earnings & Payouts",
    content: (
      <>
        <p className="mb-4">
          Loka is free to use with zero upfront costs. We generate revenue only when you sell products.
        </p>
        <p className="mb-4">
          <strong className="text-white">How Earnings are Calculated:</strong> Your earnings (&quot;Creator Revenue&quot; or &quot;Royalties&quot;) are calculated as the Retail Price set for the product, minus the base manufacturing cost, platform processing fees, and payment gateway costs (approx. 3% credit card processing).
        </p>
        <p className="mb-4">
          <strong className="text-white">Payout Schedules:</strong>
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>Payouts are computed at the end of each calendar month.</li>
          <li>Payments are processed and sent within 15 days of the following month (e.g., January earnings paid by February 15th).</li>
          <li>We support direct bank transfers (ACH/Wire) and other local payment solutions in India, USA, Canada, and other supported regions.</li>
          <li>There is a minimum payout threshold of $20 USD. If your earnings are below this amount, they roll over to the next month.</li>
        </ul>
        <p>
          Creators (or their designated agencies) are responsible for reporting and paying any local, state, or federal income taxes associated with their earnings. Loka will provide appropriate tax documents (such as 1099s or regional equivalents) as required by law.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    title: "7. Prohibited Conduct & Content Policy",
    content: (
      <>
        <p className="mb-4">
          We maintain a strict content policy. You represent and warrant that your designs, products, descriptions, and storefront materials:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>Do not infringe on any third party&apos;s copyright, trademark, patent, trade secret, or right of publicity.</li>
          <li>Do not contain defamatory, hateful, racist, obscene, or threatening language.</li>
          <li>Do not promote violence, illegal activities, or hazardous substances.</li>
          <li>Do not mimic official brand logos, sports teams, or licensed characters unless you possess explicit written authorization.</li>
        </ul>
        <p className="mb-4">
          If we receive a Digital Millennium Copyright Act (DMCA) takedown notice or trademark infringement claim regarding your merchandise, we will immediately deactivate the corresponding products.
        </p>
        <p>
          Repeated violations or willful infringement will lead to permanent account suspension, closing of your storefront, and forfeiture of any accrued earnings.
        </p>
      </>
    ),
  },
  {
    id: "limitation",
    title: "8. Limitation of Liability & Warranties",
    content: (
      <>
        <p className="mb-4">
          THE PLATFORM AND SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
        <p className="mb-4">
          Loka does not guarantee that your storefront will generate any specific volume of sales, revenue, or customer interest. We are not responsible for any direct or indirect sales losses, server outages, traffic drops, or customer disputes.
        </p>
        <p>
          IN NO EVENT SHALL LOKA, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "9. Account Termination",
    content: (
      <>
        <p className="mb-4">
          You may terminate these Terms at any time by closing your account and sending a request to terminate storefront services to{" "}
          <a href="mailto:hello@loka.media" className="text-[#FF6D1F] hover:underline">
            hello@loka.media
          </a>.
        </p>
        <p className="mb-4">
          Loka reserves the right to terminate these Terms, suspend your account, or shut down your storefront at any time, with or without cause, upon 7 days&apos; written notice. In cases of trademark violations, illegal acts, or breach of these Terms, termination will be immediate.
        </p>
        <p>
          Upon termination, we will cease manufacturing and selling merchandise featuring your Creator IP, except that we reserve the right to fulfill any customer orders placed prior to the effective date of termination. Any unpaid creator earnings above the minimum threshold will be paid out during the next regular billing cycle.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "10. Governing Law & Dispute Resolution",
    content: (
      <>
        <p className="mb-4">
          These Terms and any action related thereto will be governed by the laws of the Province of Manitoba and the federal laws of Canada, without regard to conflict of law rules.
        </p>
        <p>
          Any disputes, claims, or controversies arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof, shall be settled exclusively in the state or federal courts located in Winnipeg, Manitoba, Canada, and each party consents to the personal jurisdiction and venue of these courts.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "11. Contact Information",
    content: (
      <>
        <p className="mb-4">
          If you have questions, comments, or complaints regarding these Terms, please reach out to our legal and creator relations team:
        </p>
        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 space-y-3 max-w-md">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold font-clash">Email:</span>
            <a href="mailto:hello@loka.media" className="text-[#FF6D1F] hover:underline text-sm md:text-base">
              hello@loka.media
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold font-clash">Phone:</span>
            <a href="tel:1-888-568-5652" className="text-[#FF6D1F] hover:underline text-sm md:text-base">
              1-888-568-5652 (loka)
            </a>
          </div>
          <div>
            <span className="text-white font-bold font-clash block mb-1">Corporate Addresses:</span>
            <p className="text-xs text-[#cccccc] leading-relaxed">
              Winnipeg, Manitoba, Canada | Toronto, Ontario, Canada <br />
              Los Angeles, California, USA | Mumbai / Bangalore, India
            </p>
          </div>
        </div>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black font-satoshi flex flex-col justify-between overflow-x-clip">
      <main className="bg-black flex-grow pt-[40px] md:pt-[60px] pb-16 px-4 sm:px-6 md:px-12 max-w-[1400px] mx-auto w-full relative">
        {/* Decorative ambient light blur */}
        <div className="absolute top-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#FF6D1F]/5 rounded-full blur-[100px] sm:blur-[180px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/10 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#B94D13]/5 rounded-full blur-[80px] sm:blur-[150px] pointer-events-none" />

        {/* Title / Header section */}
        <div className="text-center md:text-left mb-12 sm:mb-16 md:mb-20 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-clash tracking-tight mb-4 uppercase">
            <span
              style={{
                background: "linear-gradient(273.09deg, #9E4719 0.41%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Terms of Use
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#8B8B8B] font-satoshi leading-relaxed">
            Last Updated: July 13, 2026. Please read these terms carefully before accessing or using our creator merchandise platform.
          </p>
        </div>

        {/* Layout Grid: Sidebar Index (left) + Clauses (right) */}
        <div className="flex flex-col lg:flex-row gap-10 items-start relative">
          
          {/* Left Sticky Sidebar Index for Desktop */}
          <aside className="w-full lg:w-[320px] shrink-0 sticky top-[120px] hidden lg:block bg-[#111111]/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-sm font-bold font-clash text-[#FF6D1F] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              On This Page
            </h3>
            <nav className="flex flex-col gap-3">
              {termsSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-xs md:text-sm text-[#8B8B8B] hover:text-white transition-all font-satoshi hover:translate-x-1 duration-200 inline-block truncate"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Right Main Clauses Content */}
          <div className="flex-1 w-full space-y-12">
            {termsSections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-[130px] w-full bg-[#1A1A1A]/40 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(26,26,26,0.3), rgba(26,26,26,0.3)),
                    linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)
                  `,
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <h2 className="text-xl sm:text-2xl font-bold font-clash text-white mb-6 tracking-wide">
                  {section.title}
                </h2>
                <div className="text-sm sm:text-base text-[#cccccc] font-satoshi leading-relaxed space-y-4">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}