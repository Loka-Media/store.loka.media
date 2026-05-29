"use client";

import {
  UserPlus,
  Palette,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/GradientText";

export function HowItWorksSection() {
  const iconHoverStyles = `
    .group:hover .icon-inner {
      color: #FF6D1F !important;
    }
  `;
  const UserIcon = () => (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="41.5" stroke="white" />
      <mask id="mask0_1248_127" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="14" y="14" width="56" height="56">
        <rect x="14" y="14" width="56" height="56" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_1248_127)">
        <path d="M42 41.2826C39.7542 41.2826 37.8317 40.483 36.2326 38.8839C34.6331 37.2844 33.8333 35.3617 33.8333 33.1159C33.8333 30.8701 34.6331 28.9476 36.2326 27.3485C37.8317 25.749 39.7542 24.9492 42 24.9492C44.2458 24.9492 46.1683 25.749 47.7674 27.3485C49.3669 28.9476 50.1667 30.8701 50.1667 33.1159C50.1667 35.3617 49.3669 37.2844 47.7674 38.8839C46.1683 40.483 44.2458 41.2826 42 41.2826ZM24.5 59.0521V53.8645C24.5 52.7219 24.8103 51.6637 25.431 50.69C26.0517 49.7162 26.8812 48.9676 27.9195 48.4441C30.2256 47.3136 32.5521 46.4657 34.8991 45.9002C37.246 45.3348 39.613 45.0521 42 45.0521C44.387 45.0521 46.754 45.3348 49.1009 45.9002C51.4479 46.4657 53.7744 47.3136 56.0805 48.4441C57.1188 48.9676 57.9483 49.7162 58.569 50.69C59.1897 51.6637 59.5 52.7219 59.5 53.8645V59.0521H24.5ZM28 55.5521H56V53.8645C56 53.392 55.8631 52.9545 55.5893 52.552C55.3156 52.1499 54.944 51.8216 54.4746 51.5673C52.464 50.5772 50.4142 49.827 48.3251 49.3168C46.2356 48.807 44.1272 48.5521 42 48.5521C39.8728 48.5521 37.7644 48.807 35.6749 49.3168C33.5858 49.827 31.536 50.5772 29.5254 51.5673C29.056 51.8216 28.6844 52.1499 28.4107 52.552C28.1369 52.9545 28 53.392 28 53.8645V55.5521ZM42 37.7826C43.2833 37.7826 44.3819 37.3256 45.2958 36.4117C46.2097 35.4978 46.6667 34.3992 46.6667 33.1159C46.6667 31.8326 46.2097 30.7339 45.2958 29.8201C44.3819 28.9062 43.2833 28.4492 42 28.4492C40.7167 28.4492 39.6181 28.9062 38.7042 29.8201C37.7903 30.7339 37.3333 31.8326 37.3333 33.1159C37.3333 34.3992 37.7903 35.4978 38.7042 36.4117C39.6181 37.3256 40.7167 37.7826 42 37.7826Z" fill="white" />
      </g>
    </svg>
  )
  const PaletteIcon = () => (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="41.5" stroke="white" />
      <mask id="mask0_1248_137" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="14" y="14" width="56" height="56">
        <rect x="14" y="14" width="56" height="56" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_1248_137)">
        <path d="M41.9499 64.1673C38.9255 64.1673 36.0687 63.5848 33.3795 62.4196C30.69 61.2545 28.3417 59.6683 26.3346 57.6608C24.3272 55.6538 22.7409 53.3018 21.5758 50.6048C20.4107 47.9079 19.8281 45.0398 19.8281 42.0007C19.8281 38.9226 20.4264 36.0351 21.623 33.3382C22.8197 30.6412 24.4448 28.2952 26.4985 26.3002C28.5519 24.3048 30.954 22.7283 33.705 21.5706C36.4557 20.4128 39.3894 19.834 42.5064 19.834C45.423 19.834 48.1871 20.3314 50.7985 21.3262C53.4102 22.3209 55.7039 23.6978 57.6795 25.4567C59.6554 27.2157 61.2296 29.306 62.4021 31.7276C63.575 34.1488 64.1615 36.7744 64.1615 39.6043C64.1615 43.6429 62.9612 46.8019 60.5605 49.0812C58.1599 51.3608 55.0825 52.5006 51.3281 52.5006H47.1013C46.4371 52.5006 45.906 52.7175 45.5082 53.1511C45.1104 53.5851 44.9115 54.0982 44.9115 54.6905C44.9115 55.4115 45.2031 56.1609 45.7865 56.9387C46.3698 57.7164 46.6615 58.6093 46.6615 59.6173C46.6615 61.1577 46.2352 62.3012 45.3828 63.0479C44.53 63.7942 43.3857 64.1673 41.9499 64.1673ZM29.1615 43.7507C29.9929 43.7507 30.6869 43.4724 31.2434 42.9159C31.7999 42.3594 32.0781 41.6654 32.0781 40.834C32.0781 40.0025 31.7999 39.3086 31.2434 38.7521C30.6869 38.1956 29.9929 37.9173 29.1615 37.9173C28.33 37.9173 27.636 38.1956 27.0795 38.7521C26.523 39.3086 26.2448 40.0025 26.2448 40.834C26.2448 41.6654 26.523 42.3594 27.0795 42.9159C27.636 43.4724 28.33 43.7507 29.1615 43.7507ZM36.1615 34.4173C36.9929 34.4173 37.6869 34.1391 38.2434 33.5826C38.7999 33.0261 39.0781 32.3321 39.0781 31.5007C39.0781 30.6692 38.7999 29.9752 38.2434 29.4187C37.6869 28.8622 36.9929 28.584 36.1615 28.584C35.33 28.584 34.636 28.8622 34.0795 29.4187C33.523 29.9752 33.2448 30.6692 33.2448 31.5007C33.2448 32.3321 33.523 33.0261 34.0795 33.5826C34.636 34.1391 35.33 34.4173 36.1615 34.4173ZM47.8281 34.4173C48.6596 34.4173 49.3535 34.1391 49.91 33.5826C50.4665 33.0261 50.7448 32.3321 50.7448 31.5007C50.7448 30.6692 50.4665 29.9752 49.91 29.4187C49.3535 28.8622 48.6596 28.584 47.8281 28.584C46.9967 28.584 46.3027 28.8622 45.7462 29.4187C45.1897 29.9752 44.9115 30.6692 44.9115 31.5007C44.9115 32.3321 45.1897 33.0261 45.7462 33.5826C46.3027 34.1391 46.9967 34.4173 47.8281 34.4173ZM54.8281 43.7507C55.6596 43.7507 56.3535 43.4724 56.91 42.9159C57.4665 42.3594 57.7448 41.6654 57.7448 40.834C57.7448 40.0025 57.4665 39.3086 56.91 38.7521C56.3535 38.1956 55.6596 37.9173 54.8281 37.9173C53.9967 37.9173 53.3027 38.1956 52.7462 38.7521C52.1897 39.3086 51.9115 40.0025 51.9115 40.834C51.9115 41.6654 52.1897 42.3594 52.7462 42.9159C53.3027 43.4724 53.9967 43.7507 54.8281 43.7507ZM41.9499 60.6673C42.3298 60.6673 42.6267 60.5738 42.8406 60.3867C43.0545 60.1997 43.1615 59.9432 43.1615 59.6173C43.1615 59.0729 42.8698 58.4612 42.2865 57.7822C41.7031 57.1031 41.4115 56.0397 41.4115 54.5919C41.4115 52.9286 41.9753 51.5809 43.1031 50.5488C44.2309 49.5167 45.6115 49.0007 47.2448 49.0007H51.3281C54.0745 49.0007 56.3166 48.196 58.0545 46.5868C59.7925 44.9772 60.6615 42.6497 60.6615 39.6043C60.6615 34.884 58.8516 30.9922 55.2318 27.9289C51.6124 24.8656 47.3706 23.334 42.5064 23.334C37.1728 23.334 32.643 25.1423 28.917 28.759C25.1911 32.3757 23.3281 36.7895 23.3281 42.0007C23.3281 47.1729 25.1462 51.577 28.7823 55.2132C32.4184 58.8493 36.8076 60.6673 41.9499 60.6673Z" fill="white" />
      </g>
    </svg>
  )
  const RocketIcon = () => (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="41.5" stroke="white" />
      <mask id="mask0_1248_147" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="14" y="14" width="56" height="56">
        <rect x="14" y="14" width="56" height="56" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_1248_147)">
        <path d="M26.6484 38.7837L31.7818 40.9554C32.416 39.6869 33.0921 38.4611 33.81 37.2781C34.5279 36.0951 35.3191 34.9306 36.1836 33.7845L32.76 33.1207C32.6402 33.0907 32.5244 33.0944 32.4124 33.1317C32.3 33.1691 32.1989 33.2327 32.109 33.3225L26.6484 38.7837ZM34.5724 43.154L41.2003 49.7457C42.9382 49.0188 44.7405 48.0137 46.6072 46.7304C48.4739 45.4471 50.2464 43.9662 51.9249 42.2877C54.5421 39.6705 56.5664 36.819 57.9979 33.7332C59.4294 30.6477 60.1376 27.473 60.1224 24.2091C56.8589 24.1943 53.682 24.9025 50.5919 26.3336C47.5018 27.7651 44.648 29.7896 42.0304 32.4072C40.3523 34.0853 38.8716 35.8615 37.5883 37.736C36.3049 39.6101 35.2997 41.416 34.5724 43.154ZM45.8086 38.4873C45.0188 37.6975 44.6239 36.7373 44.6239 35.6068C44.6239 34.4759 45.0188 33.5156 45.8086 32.7257C46.5984 31.9359 47.5683 31.541 48.7183 31.541C49.8686 31.541 50.8387 31.9359 51.6285 32.7257C52.4184 33.5156 52.8133 34.4759 52.8133 35.6068C52.8133 36.7373 52.4184 37.6975 51.6285 38.4873C50.8387 39.2772 49.8686 39.6721 48.7183 39.6721C47.5683 39.6721 46.5984 39.2772 45.8086 38.4873ZM45.5484 57.7058L51.009 52.2452C51.0989 52.1554 51.1624 52.0543 51.1998 51.9419C51.2371 51.8299 51.241 51.714 51.2114 51.5942L50.547 48.1707C49.4014 49.0352 48.237 49.8203 47.054 50.5262C45.8706 51.2324 44.6449 51.9026 43.3767 52.5369L45.5484 57.7058ZM63.3133 21.0054C63.8126 25.5014 63.2808 29.7626 61.7179 33.7892C60.1549 37.8157 57.583 41.6194 54.0021 45.2003L53.5984 45.604L54.6525 50.8855C54.7933 51.5882 54.762 52.2717 54.5586 52.9359C54.3552 53.6001 54.0037 54.1819 53.5039 54.6812L44.3549 63.8081L39.9706 53.5058L30.8263 44.3609L20.5234 39.9544L29.6147 30.8276C30.114 30.3282 30.7018 29.973 31.3781 29.7618C32.054 29.551 32.7435 29.516 33.4466 29.6568L38.773 30.7337C38.8477 30.659 38.9111 30.5917 38.9632 30.5318C39.0157 30.4719 39.0793 30.4045 39.1539 30.3294C42.7348 26.7489 46.5325 24.1749 50.547 22.6072C54.5615 21.0396 58.8169 20.5057 63.3133 21.0054ZM24.5531 51.5003C25.6898 50.3636 27.0756 49.7929 28.7105 49.7882C30.345 49.784 31.7306 50.3502 32.8674 51.4869C34.0041 52.6236 34.5666 54.0092 34.5549 55.6437C34.5429 57.2786 33.9685 58.6644 32.8318 59.8012C31.9494 60.6836 30.5015 61.4411 28.4883 62.0738C26.475 62.7066 23.8918 63.2129 20.7387 63.5928C21.1186 60.4401 21.6287 57.8571 22.2688 55.8438C22.9093 53.8306 23.6707 52.3827 24.5531 51.5003ZM27.048 53.9812C26.6292 54.4001 26.2253 55.1211 25.8364 56.1442C25.4475 57.1674 25.1827 58.2114 25.0419 59.2762C26.1071 59.1358 27.1511 58.8733 28.1739 58.4887C29.197 58.1044 29.918 57.7029 30.3369 57.2841C30.8035 56.8174 31.0489 56.2572 31.073 55.6035C31.0967 54.9498 30.8753 54.3896 30.4086 53.9229C29.9419 53.4562 29.3817 53.2326 28.728 53.2521C28.0747 53.2715 27.5147 53.5146 27.048 53.9812Z" fill="white" />
      </g>
    </svg>

  )
  const steps = [
    {
      step: "01",
      icon: <UserIcon />,
      title: "Sign up for free",
      description:
        "Create your account in seconds. No credit card required.",
      bgColor: "bg-yellow-200",
    },
    {
      step: "02",
      icon: <PaletteIcon />,
      title: "Design your products",
      description:
        "Use our easy design tools or upload your own artwork. Pick from thousands of products.",
      bgColor: "bg-pink-200",
    },
    {
      step: "03",
      icon: <RocketIcon />,
      title: "Start earning",
      description:
        "Share your store link and get paid. We handle production, shipping, and customer service.",
      bgColor: "bg-green-200",
    },
  ];

  return (
    <>
      <style>{iconHoverStyles}</style>
      <section className="py-[35px] sm:py-[35px] md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden border-y border-white/10">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2
              className="flex justify-center
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
              Sell Products in Minutes

            </h2>
            <GradientText className="text-sm sm:text-base md:text-lg lg:text-xl max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-medium block">
              Build your product business the simple way. No inventory, no shipping, no hassle.
            </GradientText>

          </div>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 relative z-10 min-h-80">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative group transition-all duration-300 ease-out"
                >
                  {/* Card with Gradient Border */}
                  <div className="gradient-border-white-top p-6 md:p-8">
                    <div className="w-full h-full flex flex-col">
                      {/* Top Row: Icon (left) and Step Number (right) */}
                      <div className="flex items-start justify-between w-full mb-4">
                        {/* Icon */}
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          {/* <span className="icon-inner w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center transition-colors duration-300" style={{ color: 'rgba(255, 255, 255, 0.9)' }}> */}
                          {step.icon}
                          {/* </span> */}
                        </div>

                        {/* Step Number */}
                        <span className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-orange-500 transition-colors duration-300">
                          {step.step}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col items-start gap-3">
                        {/* Title */}
                        <h3 className="text-xs sm:text-sm md:text-[11px] font-extrabold text-white group-hover:text-orange-500 leading-tight transition-colors duration-300">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <GradientText className="text-xs sm:text-sm leading-relaxed font-medium block">
                          {step.description}
                        </GradientText>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CTA section - Full width */}
        <div className="text-center relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(255, 89, 0, 0.5) 50%, rgba(0, 0, 0, 0.5) 100%)' }}>
          <div className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20">
            <div className="max-w-2xl mx-auto relative z-10">
              <h3
                className="!text-5xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 sm:mb-6 leading-tight tracking-tight text-transparent"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #B94D13 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Start Building Your Brand
              </h3>
              <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-sm sm:text-base  text-white/80 mb-8 sm:mb-10 leading-relaxed font-thin">
                Join trendsetting creators already earning with our platform
              </p>

              <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center flex-wrap">
                <Button variant="primary" href="/auth/signup/creator">
                  <span className="flex items-center justify-center">
                    Get Started Free
                    {/* <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /> */}
                  </span>
                </Button>

                <Button variant="secondary" href="/products">
                  <span>View Products</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
