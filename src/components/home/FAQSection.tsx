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
            <svg width="1454" height="235" viewBox="0 0 1454 235" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" style={{ minHeight: 'clamp(60px, 15vw, 150px)' }}>
              <path d="M40.3822 84.1809C15.3722 84.1809 0.000195358 67.5889 0.000195358 42.0909C0.000195358 16.5929 17.3242 0.000936627 45.3842 0.000936627C71.0042 0.000936627 87.2302 11.9569 87.2302 31.5989V32.5749H66.8562V31.5989C66.8562 22.0829 60.6342 17.5689 44.8962 17.5689C26.3522 17.5689 19.3982 23.9129 19.3982 42.0909C19.3982 60.2689 26.1082 66.6129 44.0422 66.6129C62.8302 66.6129 68.5642 63.6849 69.0522 53.3149H41.3582V39.7729H87.3522V82.9609H70.3942V65.3929H69.4182C66.6122 76.1289 58.0722 84.1809 40.3822 84.1809ZM131.323 84.1809C110.461 84.1809 96.4307 71.7369 96.4307 52.4609C96.4307 32.9409 110.461 20.6189 131.323 20.6189C152.185 20.6189 166.215 32.9409 166.215 52.4609C166.215 71.7369 152.185 84.1809 131.323 84.1809ZM131.323 67.9549C143.645 67.9549 148.037 63.1969 148.037 52.4609C148.037 41.7249 143.645 36.7229 131.323 36.7229C118.879 36.7229 114.609 41.7249 114.609 52.4609C114.609 63.1969 118.879 67.9549 131.323 67.9549ZM219.194 82.9609H204.066C189.792 82.9609 181.13 76.2509 181.13 60.8789V36.9669H171.492V21.8389H181.13V10.0049H199.43V21.8389H219.194V36.9669H199.43V58.8049C199.43 64.9049 201.748 66.4909 208.214 66.4909H219.194V82.9609ZM324.66 100.163H300.87L288.182 84.0589C263.172 82.5949 247.922 66.3689 247.922 42.0909C247.922 16.5929 264.758 0.000936627 291.842 0.000936627C319.536 0.000936627 336.25 16.5929 336.25 42.0909C336.25 61.9769 326.124 76.4949 308.434 81.8629L324.66 100.163ZM291.842 66.6129C309.776 66.6129 316.73 60.2689 316.73 42.0909C316.73 23.9129 309.776 17.5689 291.842 17.5689C273.908 17.5689 267.32 23.9129 267.32 42.0909C267.32 60.2689 273.908 66.6129 291.842 66.6129ZM371.925 84.1809C354.723 84.1809 346.549 73.5669 346.549 59.9029V21.8389H364.849V53.8029C364.849 63.6849 368.997 67.8329 380.587 67.8329C392.543 67.8329 396.813 63.1969 396.813 52.8269V21.8389H415.113V82.9609H398.033V64.2949H397.057C395.471 74.5429 388.029 84.1809 371.925 84.1809ZM459.362 84.1809C438.988 84.1809 425.08 74.1769 425.08 52.4609C425.08 32.9409 438.866 20.6189 458.996 20.6189C479.004 20.6189 492.302 31.1109 492.302 50.2649C492.302 52.4609 492.058 54.0469 491.814 56.1209H442.038C442.526 65.5149 446.918 69.5409 458.752 69.5409C469.61 69.5409 473.392 66.7349 473.392 61.4889V60.2689H491.692V61.6109C491.692 74.9089 478.76 84.1809 459.362 84.1809ZM458.63 34.8929C447.772 34.8929 443.136 38.5529 442.282 46.4829H474.734C474.246 38.4309 469.366 34.8929 458.63 34.8929ZM533.368 84.1809C512.75 84.1809 501.404 76.1289 501.404 61.9769V61.6109H519.704V62.7089C519.704 68.1989 523.12 69.6629 533.49 69.6629C543.25 69.6629 545.568 68.0769 545.568 64.4169C545.568 61.0009 543.738 60.0249 536.54 59.0489L519.338 56.9749C507.138 55.6329 500.306 50.1429 500.306 39.8949C500.306 29.1589 509.456 20.6189 530.44 20.6189C550.448 20.6189 561.794 28.1829 561.794 43.0669V43.4329H543.494V42.7009C543.494 37.6989 541.054 35.1369 529.83 35.1369C520.68 35.1369 518.362 36.7229 518.362 40.6269C518.362 43.7989 520.07 45.1409 528.122 46.1169L541.176 47.7029C557.524 49.5329 563.624 55.0229 563.624 65.1489C563.624 76.6169 552.278 84.1809 533.368 84.1809ZM616.514 82.9609H601.386C587.112 82.9609 578.45 76.2509 578.45 60.8789V36.9669H568.812V21.8389H578.45V10.0049H596.75V21.8389H616.514V36.9669H596.75V58.8049C596.75 64.9049 599.068 66.4909 605.534 66.4909H616.514V82.9609ZM644.108 15.6169H625.808V1.22094H644.108V15.6169ZM644.108 82.9609H625.808V21.8389H644.108V82.9609ZM688.701 84.1809C667.839 84.1809 653.809 71.7369 653.809 52.4609C653.809 32.9409 667.839 20.6189 688.701 20.6189C709.563 20.6189 723.593 32.9409 723.593 52.4609C723.593 71.7369 709.563 84.1809 688.701 84.1809ZM688.701 67.9549C701.023 67.9549 705.415 63.1969 705.415 52.4609C705.415 41.7249 701.023 36.7229 688.701 36.7229C676.257 36.7229 671.987 41.7249 671.987 52.4609C671.987 63.1969 676.257 67.9549 688.701 67.9549ZM751.806 82.9609H733.506V21.8389H750.464V40.6269H751.562C753.148 30.3789 760.468 20.6189 776.45 20.6189C793.164 20.6189 801.094 31.3549 801.094 44.8969V82.9609H782.794V50.9969C782.794 41.2369 778.768 37.0889 767.544 37.0889C755.954 37.0889 751.806 41.7249 751.806 52.0949V82.9609ZM843.658 84.1809C823.04 84.1809 811.694 76.1289 811.694 61.9769V61.6109H829.994V62.7089C829.994 68.1989 833.41 69.6629 843.78 69.6629C853.54 69.6629 855.858 68.0769 855.858 64.4169C855.858 61.0009 854.028 60.0249 846.83 59.0489L829.628 56.9749C817.428 55.6329 810.596 50.1429 810.596 39.8949C810.596 29.1589 819.746 20.6189 840.73 20.6189C860.738 20.6189 872.084 28.1829 872.084 43.0669V43.4329H853.784V42.7009C853.784 37.6989 851.344 35.1369 840.12 35.1369C830.97 35.1369 828.652 36.7229 838.412 46.1169L851.466 47.7029C867.814 49.5329 873.914 55.0229 873.914 65.1489C873.914 76.6169 862.568 84.1809 843.658 84.1809ZM921.436 55.9989H903.136V51.7289C903.136 42.8229 909.358 38.6749 916.922 35.7469L925.462 32.3309C931.318 30.0129 934.124 28.1829 934.124 24.0349C934.124 19.8869 931.684 16.7149 917.532 16.7149C902.648 16.7149 898.134 20.6189 898.134 28.4269V33.1849H880.078V29.8909C880.078 14.0309 890.936 0.000936627 918.874 0.000936627C942.908 0.000936627 952.424 10.4929 952.424 23.4249C952.424 36.1129 943.762 41.2369 935.71 44.4089L926.682 47.9469C922.168 49.7769 921.436 51.4849 921.436 54.5349V55.9989ZM922.9 82.9609H901.916V63.0749H922.9V82.9609Z" fill="url(#paint0_linear_0_1)"/>
              <path d="M589.774 232.961H562.568L543.292 151.221H563.788L573.67 197.581L576.476 215.515H577.818L581.6 197.581L595.264 151.221H622.47L636.012 197.581L639.794 215.515H641.136L643.942 197.581L653.824 151.221H673.832L654.434 232.961H627.228L615.028 192.091L609.294 168.545H607.952L602.218 192.091L589.774 232.961ZM715.041 234.181C694.667 234.181 680.759 224.177 680.759 202.461C680.759 182.941 694.545 170.619 714.675 170.619C734.683 170.619 747.981 181.111 747.981 200.265C747.981 202.461 747.737 204.047 747.493 206.121H697.717C698.205 215.515 702.597 219.541 714.431 219.541C725.289 219.541 729.071 216.735 729.071 211.489V210.269H747.371V211.611C747.371 224.909 734.439 234.181 715.041 234.181ZM714.309 184.893C703.451 184.893 698.815 188.553 697.961 196.483H730.413C729.925 188.431 725.045 184.893 714.309 184.893ZM764.159 189.773H757.693V178.427H763.671C766.111 178.427 767.331 177.695 767.331 174.645V172.571H756.961V151.221H780.507V174.523C780.507 184.771 774.529 189.773 764.159 189.773ZM836.984 232.961H814.414L786.598 171.839H806.972L825.272 215.149H826.492L844.914 171.839H864.922L836.984 232.961ZM904.646 234.181C884.272 234.181 870.364 224.177 870.364 202.461C870.364 182.941 884.15 170.619 904.28 170.619C924.288 170.619 937.586 181.111 937.586 200.265C937.586 202.461 937.342 204.047 937.098 206.121H887.322C887.81 215.515 892.202 219.541 904.036 219.541C914.894 219.541 918.676 216.735 918.676 211.489V210.269H936.976V211.611C936.976 224.909 924.044 234.181 904.646 234.181ZM903.914 184.893C893.056 184.893 888.42 188.553 887.566 196.483H920.018C919.53 188.431 914.65 184.893 903.914 184.893ZM1007.6 234.181C982.592 234.181 967.22 217.589 967.22 192.091C967.22 166.593 984.544 150.001 1012.6 150.001C1038.22 150.001 1054.45 161.957 1054.45 181.599V182.575H1034.08V181.599C1034.08 172.083 1027.85 167.569 1012.12 167.569C993.572 167.569 986.618 173.913 986.618 192.091C986.618 210.269 993.328 216.613 1011.26 216.613C1030.05 216.613 1035.78 213.685 1036.27 203.315H1008.58V189.773H1054.57V232.961H1037.61V215.393H1036.64C1033.83 226.129 1025.29 234.181 1007.6 234.181ZM1098.54 234.181C1077.68 234.181 1063.65 221.737 1063.65 202.461C1063.65 182.941 1077.68 170.619 1098.54 170.619C1119.4 170.619 1133.43 182.941 1133.43 202.461C1133.43 221.737 1119.4 234.181 1098.54 234.181ZM1098.54 217.955C1110.86 217.955 1115.26 213.197 1115.26 202.461C1115.26 191.725 1110.86 186.723 1098.54 186.723C1086.1 186.723 1081.83 191.725 1081.83 202.461C1081.83 213.197 1086.1 217.955 1098.54 217.955ZM1186.41 232.961H1171.29C1157.01 232.961 1148.35 226.251 1148.35 210.879V186.967H1138.71V171.839H1148.35V160.005H1166.65V171.839H1186.41V186.967H1166.65V208.805C1166.65 214.905 1168.97 216.491 1175.43 216.491H1186.41V232.961ZM1265.41 232.961H1246.98V205.877L1210.75 151.221H1233.32L1248.94 175.133L1255.77 186.113H1257.11L1263.94 175.133L1279.56 151.221H1302.25L1265.41 205.999V232.961ZM1340.75 234.181C1319.88 234.181 1305.85 221.737 1305.85 202.461C1305.85 182.941 1319.88 170.619 1340.75 170.619C1361.61 170.619 1375.64 182.941 1375.64 202.461C1375.64 221.737 1361.61 234.181 1340.75 234.181ZM1340.75 217.955C1353.07 217.955 1357.46 213.197 1357.46 202.461C1357.46 191.725 1353.07 186.723 1340.75 186.723C1328.3 186.723 1324.03 191.725 1324.03 202.461C1324.03 213.197 1328.3 217.955 1340.75 217.955ZM1410.81 234.181C1393.6 234.181 1385.43 223.567 1385.43 209.903V171.839H1403.73V203.803C1403.73 213.685 1407.88 217.833 1419.47 217.833C1431.42 217.833 1435.69 213.197 1435.69 202.827V171.839H1453.99V232.961H1436.91V214.295H1435.94C1434.35 224.543 1426.91 234.181 1410.81 234.181Z" fill="url(#paint1_linear_0_1)"/>
              <defs>
                <linearGradient id="paint0_linear_0_1" x1="476.45" y1="-31.0391" x2="476.45" y2="118.961" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white"/>
                  <stop offset="1" stopColor="#B94D13"/>
                </linearGradient>
                <linearGradient id="paint1_linear_0_1" x1="1000.45" y1="118.961" x2="1000.45" y2="268.961" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white"/>
                  <stop offset="1" stopColor="#B94D13"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
            Everything you need to know about getting started with Loka.
          </p>
        </div>

        {/* FAQ Items - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                  <div className={`flex-shrink-0 transition-all duration-300 ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}>
                    {openFAQ === index ? (
                      <svg width="20" height="4" viewBox="0 0 36 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36 6H0V0H36V6Z" fill="url(#paint0_linear_1248_293)"/>
                        <defs>
                          <linearGradient id="paint0_linear_1248_293" x1="17.9787" y1="-26.8604" x2="17.9787" y2="29.8256" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white"/>
                            <stop offset="1" stopColor="#B94D13"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.0403 28H9.95973V17.8924H0V10.1076H9.95973V0H18.0403V10.1076H28V17.8924H18.0403V28Z" fill="url(#paint0_linear_1248_297)"/>
                        <defs>
                          <linearGradient id="paint0_linear_1248_297" x1="13.993" y1="-23.8252" x2="13.993" y2="52.6883" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white"/>
                            <stop offset="1" stopColor="#B94D13"/>
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
                className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                  openFAQ === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
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
