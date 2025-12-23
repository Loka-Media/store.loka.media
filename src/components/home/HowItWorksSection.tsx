"use client";

import {
  UserPlus,
  Palette,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/GradientText";
import { GradientCardLayout } from "@/components/ui/GradientCardLayout";

export function HowItWorksSection() {
  const iconHoverStyles = `
    .group:hover .icon-inner {
      color: #FF6D1F !important;
    }
  `;

  const steps = [
    {
      step: "01",
      icon: (
        <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transition-colors duration-300" />
      ),
      title: "Sign up for free",
      description:
        "Create your account in seconds. No credit card required.",
      bgColor: "bg-yellow-200",
    },
    {
      step: "02",
      icon: (
        <Palette className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transition-colors duration-300" />
      ),
      title: "Design your products",
      description:
        "Use our easy design tools or upload your own artwork. Pick from thousands of products.",
      bgColor: "bg-pink-200",
    },
    {
      step: "03",
      icon: (
        <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transition-colors duration-300" />
      ),
      title: "Start earning",
      description:
        "Share your store link and get paid. We handle production, shipping, and customer service.",
      bgColor: "bg-green-200",
    },
  ];

  return (
    <>
      <style>{iconHoverStyles}</style>
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden border-y border-white/10">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <svg width="873" height="50" viewBox="0 0 873 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-3xl mx-auto mb-4 sm:mb-6 h-auto">
            <path d="M23.2558 49.6809C8.63979 49.6809 0.431793 43.9209 0.431793 32.6889V32.2569H11.2318V33.5529C11.2318 38.0169 13.4638 39.8169 23.2558 39.8169C31.8958 39.8169 33.9118 38.5209 33.9118 35.2809C33.9118 32.3289 32.2558 31.2489 27.2878 30.3849L13.7518 28.4409C5.11179 27.0729 -0.000206918 22.7529 -0.000206918 14.9049C-0.000206918 7.63294 5.90379 0.000936985 22.1038 0.000936985C36.9358 0.000936985 43.8478 6.84093 43.8478 16.9929V17.4249H32.9758V16.4169C32.9758 11.8089 30.5998 9.86493 21.0238 9.86493C13.2478 9.86493 10.8718 11.3769 10.8718 14.4729C10.8718 17.2809 12.4558 18.2889 16.4878 19.0089L30.0238 21.1689C40.8238 22.8969 44.7118 28.1529 44.7118 34.7769C44.7118 42.6249 38.5918 49.6809 23.2558 49.6809ZM69.702 49.6809C57.678 49.6809 49.47 43.7769 49.47 30.9609C49.47 19.4409 57.606 12.1689 69.486 12.1689C81.294 12.1689 89.142 18.3609 89.142 29.6649C89.142 30.9609 88.998 31.8969 88.854 33.1209H59.478C59.766 38.6649 62.358 41.0409 69.342 41.0409C75.75 41.0409 77.982 39.3849 77.982 36.2889V35.5689H88.782V36.3609C88.782 44.2089 81.15 49.6809 69.702 49.6809ZM69.27 20.5929C62.862 20.5929 60.126 22.7529 59.622 27.4329H78.774C78.486 22.6809 75.606 20.5929 69.27 20.5929ZM105.962 48.9609H95.1619V0.720936H105.962V48.9609ZM123.855 48.9609H113.055V0.720936H123.855V48.9609ZM154.297 48.9609H143.497V0.720936H168.697C179.857 0.720936 187.057 7.05694 187.057 18.1449C187.057 29.2329 179.857 35.6409 168.697 35.6409H154.297V48.9609ZM167.545 10.4409H154.297V25.9209H167.545C173.521 25.9209 176.329 24.1929 176.329 18.1449C176.329 12.2409 173.521 10.4409 167.545 10.4409ZM203.128 48.9609H192.328V12.8889H202.336V22.4649H202.984C203.992 16.6329 207.808 12.1689 215.08 12.1689C223.144 12.1689 226.456 17.7129 226.456 24.7689V30.7449H215.656V27.0009C215.656 23.0409 214.072 21.3129 209.68 21.3129C204.856 21.3129 203.128 23.5449 203.128 28.0809V48.9609ZM251.031 49.6809C238.719 49.6809 230.439 42.3369 230.439 30.9609C230.439 19.4409 238.719 12.1689 251.031 12.1689C263.343 12.1689 271.623 19.4409 271.623 30.9609C271.623 42.3369 263.343 49.6809 251.031 49.6809ZM251.031 40.1049C258.303 40.1049 260.895 37.2969 260.895 30.9609C260.895 24.6249 258.303 21.6729 251.031 21.6729C243.687 21.6729 241.167 24.6249 241.167 30.9609C241.167 37.2969 243.687 40.1049 251.031 40.1049ZM293.602 49.6809C282.37 49.6809 276.178 42.3369 276.178 30.9609C276.178 19.4409 282.298 12.1689 293.026 12.1689C301.594 12.1689 305.986 16.4169 307.21 22.4649H307.858V0.720936H318.658V48.9609H308.578V38.9529H308.002C306.634 46.0809 301.882 49.6809 293.602 49.6809ZM287.122 30.9609C287.122 37.5129 290.362 39.8169 297.274 39.8169C304.114 39.8169 307.858 37.4409 307.858 31.1769V30.6009C307.858 24.3369 304.186 22.0329 297.274 22.0329C290.362 22.0329 287.122 24.3369 287.122 30.9609ZM340.716 49.6809C330.564 49.6809 325.74 43.4169 325.74 35.3529V12.8889H336.54V31.7529C336.54 37.5849 338.988 40.0329 345.828 40.0329C352.884 40.0329 355.404 37.2969 355.404 31.1769V12.8889H366.204V48.9609H356.124V37.9449H355.548C354.612 43.9929 350.22 49.6809 340.716 49.6809ZM392.39 49.6809C380.006 49.6809 372.086 42.3369 372.086 30.9609C372.086 19.4409 380.006 12.1689 392.39 12.1689C403.982 12.1689 411.902 18.3609 411.902 27.7209V28.7289H401.174V28.1529C401.174 23.5449 397.79 21.8889 392.174 21.8889C385.766 21.8889 382.814 24.2649 382.814 30.9609C382.814 37.5849 385.766 39.9609 392.174 39.9609C397.79 39.9609 401.174 38.3049 401.174 33.6969V33.1209H411.902V34.1289C411.902 43.4169 403.982 49.6809 392.39 49.6809ZM443.405 48.9609H434.477C426.053 48.9609 420.941 45.0009 420.941 35.9289V21.8169H415.253V12.8889H420.941V5.90493H431.741V12.8889H443.405V21.8169H431.741V34.7049C431.741 38.3049 433.109 39.2409 436.925 39.2409H443.405V48.9609ZM467.106 49.6809C454.938 49.6809 448.242 44.9289 448.242 36.5769V36.3609H459.042V37.0089C459.042 40.2489 461.058 41.1129 467.178 41.1129C472.938 41.1129 474.306 40.1769 474.306 38.0169C474.306 36.0009 473.226 35.4249 468.978 34.8489L458.826 33.6249C451.626 32.8329 447.594 29.5929 447.594 23.5449C447.594 17.2089 452.994 12.1689 465.378 12.1689C477.186 12.1689 483.882 16.6329 483.882 25.4169V25.6329H473.082V25.2009C473.082 22.2489 471.642 20.7369 465.018 20.7369C459.618 20.7369 458.25 21.6729 458.25 23.9769C458.25 25.8489 459.258 26.6409 464.01 27.2169L471.714 28.1529C481.362 29.2329 484.962 32.4729 484.962 38.4489C484.962 45.2169 478.266 49.6809 467.106 49.6809ZM514.109 9.21693H503.309V0.720936H514.109V9.21693ZM514.109 48.9609H503.309V12.8889H514.109V48.9609ZM532.002 48.9609H521.202V12.8889H531.21V23.9769H531.858C532.794 17.9289 537.114 12.1689 546.546 12.1689C556.41 12.1689 561.09 18.5049 561.09 26.4969V48.9609H550.29V30.0969C550.29 24.3369 547.914 21.8889 541.29 21.8889C534.45 21.8889 532.002 24.6249 532.002 30.7449V48.9609ZM591.343 48.9609H580.543V0.720936H595.159L606.463 24.4809L610.999 35.7849H611.791L616.183 24.4809L627.127 0.720936H641.815V48.9609H631.015V24.4809L631.375 16.9209H630.583L627.775 24.4809L617.695 46.0809H604.591L594.511 24.4809L591.703 16.9209H590.911L591.343 24.4809V48.9609ZM659.721 9.21693H648.921V0.720936H659.721V9.21693ZM659.721 48.9609H648.921V12.8889H659.721V48.9609ZM677.614 48.9609H666.814V12.8889H676.822V23.9769H677.47C678.406 17.9289 682.726 12.1689 692.158 12.1689C702.022 12.1689 706.702 18.5049 706.702 26.4969V48.9609H695.902V30.0969C695.902 24.3369 693.526 21.8889 686.902 21.8889C680.062 21.8889 677.614 24.6249 677.614 30.7449V48.9609ZM728.509 49.6809C718.357 49.6809 713.533 43.4169 713.533 35.3529V12.8889H724.333V31.7529C724.333 37.5849 726.781 40.0329 733.621 40.0329C740.677 40.0329 743.197 37.2969 743.197 31.1769V12.8889H753.997V48.9609H743.917V37.9449H743.341C742.405 43.9929 738.013 49.6809 728.509 49.6809ZM786.375 48.9609H777.447C769.023 48.9609 763.911 45.0009 763.911 35.9289V21.8169H758.223V12.8889H763.911V5.90493H774.711V12.8889H786.375V21.8169H774.711V34.7049C774.711 38.3049 776.079 39.2409 779.895 39.2409H786.375V48.9609ZM811.012 49.6809C798.988 49.6809 790.78 43.7769 790.78 30.9609C790.78 19.4409 798.916 12.1689 810.796 12.1689C822.604 12.1689 830.452 18.3609 830.452 29.6649C830.452 30.9609 830.308 31.8969 830.164 33.1209H800.788C801.076 38.6649 803.668 41.0409 810.652 41.0409C817.06 41.0409 819.292 39.3849 819.292 36.2889V35.5689H830.092V36.3609C830.092 44.2089 822.46 49.6809 811.012 49.6809ZM810.58 20.5929C804.172 20.5929 801.436 22.7529 800.932 27.4329H820.084C819.796 22.6809 816.916 20.5929 810.58 20.5929ZM854.688 49.6809C842.52 49.6809 835.824 44.9289 835.824 36.5769V36.3609H846.624V37.0089C846.624 40.2489 848.64 41.1129 854.76 41.1129C860.52 41.1129 861.888 40.1769 861.888 38.0169C861.888 36.0009 860.808 35.4249 856.56 34.8489L846.408 33.6249C839.208 32.8329 835.176 29.5929 835.176 23.5449C835.176 17.2089 840.576 12.1689 852.96 12.1689C864.768 12.1689 871.464 16.6329 871.464 25.4169V25.6329H860.664V25.2009C860.664 22.2489 859.224 20.7369 852.6 20.7369C847.2 20.7369 845.832 21.6729 845.832 23.9769C845.832 25.8489 846.84 26.6409 851.592 27.2169L859.296 28.1529C868.944 29.2329 872.544 32.4729 872.544 38.4489C872.544 45.2169 865.848 49.6809 854.688 49.6809Z" fill="url(#paint0_linear_1248_37)"/>
            <defs>
              <linearGradient id="paint0_linear_1248_37" x1="436.488" y1="-14.0391" x2="436.488" y2="65.9609" gradientUnits="userSpaceOnUse">
                <stop stopColor="white"/>
                <stop offset="1" stopColor="#B94D13"/>
              </linearGradient>
            </defs>
          </svg>
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
                <GradientCardLayout>
                  <div className="w-full h-full flex flex-col">
                    {/* Top Row: Icon (left) and Step Number (right) */}
                    <div className="flex items-start justify-between w-full mb-4">
                      {/* Icon */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="icon-inner w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center transition-colors duration-300" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          {step.icon}
                        </span>
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
                </GradientCardLayout>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA section - Full width */}
      <div className="text-center relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(255, 89, 0, 0.5) 50%, rgba(0, 0, 0, 0.5) 100%)' }}>
        <div className="max-w-7xl mx-auto py-12 sm:py-16 md:py-20">
          <div className="max-w-2xl mx-auto relative z-10">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
              Start Building Your Brand
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-white/80 mb-8 sm:mb-10 leading-relaxed font-medium">
              Join trendsetting creators already earning with our platform
            </p>

            <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center flex-wrap">
              <Button variant="primary">
                <span className="flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>

              <Button variant="secondary">
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
