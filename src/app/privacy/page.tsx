'use client';

const privacySections = [
  {
    id: "information-collected",
    title: "1. Information We Collect",
    content: (
      <>
        <p className="mb-4">
          Loka collects information to provide a better experience and activate your creator storefront. We collect the following types of information:
        </p>
        <p className="mb-4">
          <strong className="text-white">Information You Provide Directly:</strong>
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Account & Registration Info:</strong> Full name, email address, mobile phone number, and password when you register.
          </li>
          <li>
            <strong className="text-white">Creator Verification Data:</strong> Social media links and handles (Instagram, Spotify, TikTok, YouTube) and agency affiliation details (managed vs. independent).
          </li>
          <li>
            <strong className="text-white">Financial Details:</strong> Direct deposit account numbers, tax identification information, or regional IDs needed for distributing earnings and executing payouts.
          </li>
        </ul>
        <p className="mb-4">
          <strong className="text-white">Information Collected Automatically:</strong>
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Device & Connection Data:</strong> IP address, device type, browser specifications, operating system details, and referring URL.
          </li>
          <li>
            <strong className="text-white">Usage Behavior:</strong> Pages visited, time spent on storefronts, navigation patterns, and button clicks.
          </li>
          <li>
            <strong className="text-white">Referrals:</strong> Links and codes used to sign up for early access waitlists.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: (
      <>
        <p className="mb-4">
          We use the information we collect for several essential business purposes:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>To activate, host, and personalize your custom creator storefront.</li>
          <li>To process and fulfill fan orders, coordinate apparel printing, and dispatch shipping packages.</li>
          <li>To calculate and transfer creator royalties or payout commissions.</li>
          <li>To send you transactional notifications, platform notices, security alerts, and customer service updates.</li>
          <li>To distribute newsletters and marketing updates (which you can opt-out of at any time).</li>
          <li>To verify account validity and protect the Platform against fraudulent behavior or intellectual property violations.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "3. Sharing of Information",
    content: (
      <>
        <p className="mb-4">
          We do not sell your personal details to third parties. We share your information only in the following controlled contexts:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Fulfillment & Sourcing Networks:</strong> Order details, product preferences, and shipping addresses are shared with print-on-demand suppliers and shipping couriers to produce and deliver custom merchandise.
          </li>
          <li>
            <strong className="text-white">Payment Processing Partners:</strong> Email address, transaction costs, and payout details are shared with verified payment processors (e.g., Stripe, bank transfer gateways) to manage deposits.
          </li>
          <li>
            <strong className="text-white">Agencies & Team Members:</strong> If your account is registered as Agency Managed, your details and earnings reports are accessible by your authorized talent agency.
          </li>
          <li>
            <strong className="text-white">Legal Obligations:</strong> We may share data when compelled to do so by applicable laws, subpoenas, court commands, or to safeguard intellectual property copyrights.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "4. Cookies & Tracking Technologies",
    content: (
      <>
        <p className="mb-4">
          Loka uses cookies, web beacons, and unique identifiers to enhance storefront operations:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Essential Cookies:</strong> Used to maintain shopping carts, hold session details, and secure user logins.
          </li>
          <li>
            <strong className="text-white">Analytical Cookies:</strong> Help us measure storefront performance, tracking page traffic via services like Google Analytics.
          </li>
          <li>
            <strong className="text-white">Preference Cookies:</strong> Remember sizing choices, region settings, and display preferences.
          </li>
        </ul>
        <p>
          You can disable or customize cookies in your browser settings; however, disabling essential cookies may impact store checkout flows.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "5. Data Security & Storage",
    content: (
      <>
        <p className="mb-4">
          We implement rigorous administrative, technical, and physical security measures to protect your personal details:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>All platform traffic is encrypted using SSL (Secure Sockets Layer) and HTTPS protocols.</li>
          <li>Data databases are stored on secure cloud services with restricted operational access.</li>
          <li>Payment card details are processed directly by PCI-compliant gateways and are never saved on Loka servers.</li>
        </ul>
        <p>
          While we take extensive precautions, no storage or network transfer is 100% secure. You are advised to safeguard your storefront credentials and notify us if you notice suspicious behaviors.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "6. International Data Transfers",
    content: (
      <>
        <p className="mb-4">
          Loka is a global platform with operational facilities located in Canada (Winnipeg, Toronto), the USA (Los Angeles), and India.
        </p>
        <p>
          By accessing the Platform, you acknowledge that your information may be transferred to, stored, and processed in regions outside your country of residence, where local privacy policies might differ from regional policies in your home country. We utilize legal transfer guidelines (including standard contract clauses) to verify that your data remains securely protected.
        </p>
      </>
    ),
  },
  {
    id: "privacy-rights",
    title: "7. Your Privacy Rights",
    content: (
      <>
        <p className="mb-4">
          Depending on your location (such as Canada, the European Union under GDPR, or California under CCPA), you may hold specific privacy privileges:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2 text-[#cccccc]">
          <li>
            <strong className="text-white">Right of Access:</strong> Review the personal data Loka holds about you.
          </li>
          <li>
            <strong className="text-white">Right to Correction:</strong> Update or correct inaccurate registration details.
          </li>
          <li>
            <strong className="text-white">Right to Deletion:</strong> Request that we delete your account and personal details (subject to active transaction records).
          </li>
          <li>
            <strong className="text-white">Right to Opt-Out:</strong> Cancel email marketing subscriptions or object to automated profiling.
          </li>
        </ul>
        <p>
          To exercise any of these privileges, please send a message to our legal operations team at{" "}
          <a href="mailto:hello@loka.media" className="text-[#FF6D1F] hover:underline">
            hello@loka.media
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "8. Children's Privacy",
    content: (
      <>
        <p className="mb-4">
          Our Services are designed for professional creators and are not structured for children under the age of 13.
        </p>
        <p>
          Loka does not knowingly collect personal details from children under 13. If you believe a minor has registered an account or provided personal details without parental permission, contact us immediately, and we will delete the data from our databases.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to This Privacy Policy",
    content: (
      <>
        <p className="mb-4">
          We may update this Privacy Policy from time to time to align with legal guidelines, server adjustments, or product enhancements.
        </p>
        <p>
          Changes will be published directly on this route with an updated &quot;Last Updated&quot; marker at the top. We encourage you to review this document regularly to remain informed about how we safeguard your information.
        </p>
      </>
    ),
  },
  {
    id: "contact-info",
    title: "10. Contact Details",
    content: (
      <>
        <p className="mb-4">
          If you have questions, feedback, or complaints regarding this Privacy Policy, please get in touch with us:
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

export default function PrivacyPage() {
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
              Privacy Policy
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#8B8B8B] font-satoshi leading-relaxed">
            Last Updated: July 13, 2026. Please read this privacy policy carefully to understand our data practices.
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
              {privacySections.map((section) => (
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
            {privacySections.map((section) => (
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