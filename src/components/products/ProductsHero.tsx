import GradientTitle from "@/components/ui/GradientTitle";
import { GradientText } from "@/components/ui/GradientText";
import StartShape from "@/components/ui/StartShape";

interface ProductsHeroProps {
  creators: {
    id: number;
    name: string;
    username: string;
    product_count: number;
  }[];
  categories: {
    category: string;
    product_count: number;
  }[];
}

export function ProductsHero({
  creators,
  categories,
}: ProductsHeroProps) {
  return (
    <div className="relative bg-black overflow-hidden border-b border-white/10">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-orange-500 rounded-full opacity-20 hidden lg:block"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-500 rounded-3xl opacity-10 rotate-12 hidden lg:block"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 relative z-10">
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          {/* Heading - Neubrutalism style: bold and colorful */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <GradientTitle
              text="Premium Marketplace"
              size="lg"
              className="sm:!text-3xl md:!text-4xl lg:!text-5xl"
            />

            <GradientText className="sm:text-lg md:text-xl lg:text-xl max-w-3xl block mx-auto text-center">
              Discover curated designs from top creators worldwide
            </GradientText>
          </div>

          {/* Stats bar - StarShape cards */}
          <div className="grid grid-cols-3 gap-0 sm:gap-1 lg:gap-2 mb-6 sm:mb-8 lg:mb-12">
            <div className="text-center flex flex-col items-center">
              <StartShape className="max-w-[80px] sm:max-w-[100px]">
                <div className="flex justify-center">
                  <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.949" fillRule="evenodd" clipRule="evenodd" d="M56.6019 10.477C61.6319 10.1199 65.2647 12.1824 67.5003 16.6645C69.0791 21.2946 68.0714 25.2556 64.4769 28.5473C60.4141 31.3396 56.2891 31.4334 52.1019 28.8286C48.2351 25.6218 47.0866 21.614 48.6566 16.8052C50.211 13.3003 52.8594 11.1909 56.6019 10.477ZM56.8831 13.9927C58.0181 13.9416 59.1431 14.0119 60.2581 14.2036C60.8826 14.8173 61.3513 15.5439 61.6644 16.3833C62.5042 16.5 63.3479 16.5703 64.1956 16.5942C64.684 16.6391 65.0824 16.85 65.3909 17.227C65.622 20.0738 65.6688 22.9332 65.5316 25.8052C65.2689 26.3706 64.8235 26.6752 64.1956 26.7192C60.2581 26.813 56.3206 26.813 52.3831 26.7192C51.6887 26.681 51.2435 26.3294 51.0472 25.6645C50.9534 22.9927 50.9534 20.3208 51.0472 17.6489C51.1577 17.2154 51.4155 16.9108 51.8206 16.7348C52.8469 16.5918 53.8781 16.4745 54.9144 16.3833C55.2067 15.7515 55.5348 15.1421 55.8988 14.5552C56.1835 14.2649 56.5116 14.0773 56.8831 13.9927Z" fill="url(#paint0_linear_1341_437)"/>
                    <path opacity="0.954" fillRule="evenodd" clipRule="evenodd" d="M57.0234 15.54C57.8685 15.5166 58.7122 15.5401 59.5547 15.6103C59.9321 16.5082 60.4478 17.305 61.1016 18.0009C62.0771 18.182 63.0615 18.2524 64.0547 18.2119C64.0547 20.5087 64.0547 22.8057 64.0547 25.1025C60.211 25.1025 56.3671 25.1025 52.5234 25.1025C52.5234 22.8057 52.5234 20.5087 52.5234 18.2119C53.5167 18.2524 54.501 18.182 55.4766 18.0009C55.6283 17.8665 55.7923 17.7493 55.9688 17.6494C56.3221 16.9424 56.6737 16.2393 57.0234 15.54ZM58.0078 18.7744C55.6914 19.5171 55.0118 21.017 55.9688 23.2744C57.5156 24.9619 59.0625 24.9619 60.6094 23.2744C61.5991 20.7075 60.732 19.2075 58.0078 18.7744Z" fill="url(#paint1_linear_1341_437)"/>
                    <path opacity="0.983" fillRule="evenodd" clipRule="evenodd" d="M32.8373 17.086C38.4282 16.9382 41.9203 19.5632 43.3139 24.961C43.877 29.999 41.8379 33.5381 37.1967 35.5782C32.5022 36.9197 28.7287 35.6306 25.8764 31.711C23.6617 27.642 23.9898 23.7982 26.8608 20.1797C28.5241 18.4928 30.5162 17.4615 32.8373 17.086Z" fill="url(#paint2_linear_1341_437)"/>
                    <path opacity="0.872" fillRule="evenodd" clipRule="evenodd" d="M58.1486 20.3203C59.4203 20.5193 59.8187 21.2224 59.3439 22.4297C58.6408 23.1796 57.9377 23.1796 57.2345 22.4297C56.7813 21.3692 57.0859 20.6661 58.1486 20.3203Z" fill="url(#paint3_linear_1341_437)"/>
                    <path opacity="0.953" fillRule="evenodd" clipRule="evenodd" d="M11.179 22.9923C15.5242 22.7145 18.5945 24.5426 20.39 28.4767C21.682 32.5678 20.6742 35.9663 17.3665 38.672C13.3316 41.0686 9.55816 40.717 6.0462 37.6173C3.6579 34.8155 3.0954 31.6748 4.3587 28.1955C5.7681 25.3073 8.04153 23.573 11.179 22.9923ZM11.4603 24.5392C13.5238 24.8753 15.5862 25.2269 17.6478 25.5939C17.8587 25.711 18.0228 25.8752 18.14 26.0861C18.2337 27.2111 18.2337 28.3361 18.14 29.4611C17.9993 29.7892 17.7649 30.0236 17.4368 30.1642C15.7883 29.8152 14.1243 29.5339 12.4446 29.3205C12.4681 31.7115 12.4446 34.1021 12.3743 36.4923C11.5997 38.6418 10.17 39.2278 8.08526 38.2502C6.70216 36.9339 6.60841 35.5277 7.80401 34.0314C8.70219 33.3024 9.68656 33.1383 10.7571 33.5392C10.8743 30.681 10.9446 27.8217 10.9681 24.9611C11.1291 24.8013 11.2932 24.6607 11.4603 24.5392Z" fill="url(#paint4_linear_1341_437)"/>
                    <path opacity="0.859" fillRule="evenodd" clipRule="evenodd" d="M12.4453 26.2266C13.8443 26.497 15.2506 26.7313 16.6641 26.9297C16.6641 27.3984 16.6641 27.8672 16.6641 28.3359C15.2578 28.1485 13.8516 27.9609 12.4453 27.7734C12.4453 27.2578 12.4453 26.7422 12.4453 26.2266Z" fill="url(#paint5_linear_1341_437)"/>
                    <path opacity="0.849" fillRule="evenodd" clipRule="evenodd" d="M9.34952 34.8047C10.6631 34.8756 11.1084 35.5319 10.6855 36.7734C10.2643 37.1623 9.77213 37.2794 9.20889 37.125C8.59566 36.812 8.38472 36.3198 8.57608 35.6484C8.76729 35.2936 9.0251 35.0124 9.34952 34.8047Z" fill="black"/>
                    <path opacity="0.961" fillRule="evenodd" clipRule="evenodd" d="M50.9766 36.7734C55.3396 36.3643 58.5037 38.0988 60.4688 41.9765C61.9399 46.422 60.7915 50.0079 57.0235 52.7343C52.8624 54.8294 49.1358 54.2434 45.8438 50.9765C43.3051 47.5107 43.1645 43.9481 45.4219 40.289C46.8647 38.4553 48.7162 37.2834 50.9766 36.7734ZM50.2735 40.7109C50.6632 40.6998 51.0381 40.7701 51.3985 40.9218C53.2734 41.8594 55.1485 42.7968 57.0235 43.7343C58.2212 45.0144 58.0806 46.1394 56.6016 47.1093C54.6639 48.1605 52.6719 49.0746 50.6251 49.8515C49.7324 49.7562 49.123 49.2875 48.7969 48.4453C48.7031 46.3359 48.7031 44.2265 48.7969 42.1171C49.0931 41.422 49.5853 40.9533 50.2735 40.7109Z" fill="url(#paint6_linear_1341_437)"/>
                    <path opacity="0.982" fillRule="evenodd" clipRule="evenodd" d="M32.8369 37.8981C36.6332 37.7574 40.2895 38.3902 43.8057 39.7966C43.8525 39.8434 43.8995 39.8904 43.9463 39.9372C41.5187 44.1116 41.7765 48.1194 44.7197 51.9606C46.7564 54.2562 49.311 55.428 52.3838 55.4762C52.3838 57.3044 52.3838 59.1325 52.3838 60.9606C49.8057 60.9606 47.2275 60.9606 44.6494 60.9606C44.6729 58.5226 44.6494 56.0851 44.5791 53.6481C44.2364 52.8589 43.7677 52.7653 43.1729 53.3669C43.1026 55.8977 43.0791 58.4289 43.1026 60.9606C37.0089 60.9606 30.915 60.9606 24.8213 60.9606C24.8448 58.4758 24.8213 55.9915 24.751 53.5075C24.2823 52.7575 23.8134 52.7575 23.3447 53.5075C23.2744 55.9915 23.2509 58.4758 23.2744 60.9606C20.6964 60.9606 18.1181 60.9606 15.5401 60.9606C15.5166 57.5384 15.5401 54.1165 15.6104 50.695C16.3107 45.8928 18.8186 42.4006 23.1338 40.2184C26.2316 38.7992 29.466 38.0258 32.8369 37.8981Z" fill="url(#paint7_linear_1341_437)"/>
                    <path opacity="0.917" fillRule="evenodd" clipRule="evenodd" d="M50.4132 42.2578C52.3646 43.0927 54.2864 44.0068 56.1788 45C56.3218 45.1475 56.3453 45.3116 56.2491 45.4922C54.5245 46.4601 52.7667 47.3742 50.9757 48.2344C50.7882 48.3282 50.6006 48.3282 50.4132 48.2344C50.2269 46.2421 50.2269 44.25 50.4132 42.2578Z" fill="url(#paint8_linear_1341_437)"/>
                    <defs>
                      <linearGradient id="paint0_linear_1341_437" x1="58.0998" y1="10.4375" x2="58.0998" y2="30.7143" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_1341_437" x1="58.2891" y1="15.5312" x2="58.2891" y2="25.1025" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint2_linear_1341_437" x1="33.9175" y1="17.0801" x2="33.9175" y2="36.0913" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint3_linear_1341_437" x1="58.2844" y1="20.3203" x2="58.2844" y2="22.9922" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint4_linear_1341_437" x1="12.3187" y1="22.9648" x2="12.3187" y2="40.2395" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint5_linear_1341_437" x1="14.5547" y1="26.2266" x2="14.5547" y2="28.3359" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint6_linear_1341_437" x1="52.4583" y1="36.7148" x2="52.4583" y2="53.9622" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint7_linear_1341_437" x1="33.9575" y1="37.8789" x2="33.9575" y2="60.9606" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                      <linearGradient id="paint8_linear_1341_437" x1="53.2903" y1="42.2578" x2="53.2903" y2="48.3047" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FB1FFF"/>
                        <stop offset="1" stopColor="#500851"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </StartShape>
              <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">10K+</div>
              <div className="text-xs text-white">Products</div>
            </div>
            <div className="text-center flex flex-col items-center">
              <StartShape className="max-w-[80px] sm:max-w-[100px]">
                <div className="flex justify-center">
                  <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M35.7898 8.78906C37.3107 8.85286 38.7638 9.20443 40.1492 9.84375C46.4003 12.6177 52.6346 15.4302 58.8523 18.2812C59.4261 18.6615 59.9418 19.1069 60.3992 19.6172C57.0452 21.1769 53.6702 22.7002 50.2742 24.1875C49.993 24.2813 49.7117 24.2813 49.4305 24.1875C41.4276 20.4321 33.4353 16.6587 25.4539 12.8672C25.3708 12.7289 25.4178 12.6351 25.5945 12.5859C27.9534 11.5119 30.3206 10.4573 32.6961 9.42188C33.7201 9.07322 34.7515 8.86229 35.7898 8.78906Z" fill="url(#paint0_linear_products_2)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M19.7586 15.1172C28.0591 18.8689 36.3092 22.7361 44.5086 26.7188C42.4158 27.6948 40.3064 28.6324 38.1805 29.5312C36.8794 29.9256 35.5669 29.9724 34.243 29.6719C26.6797 26.4646 19.1563 23.16 11.6726 19.7578C11.4958 19.7086 11.4489 19.6148 11.532 19.4766C12.0113 19.0613 12.5035 18.6628 13.0086 18.2812C15.267 17.21 17.517 16.1553 19.7586 15.1172Z" fill="url(#paint1_linear_products_2)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.21094 23.5547C16.6296 26.7704 24.0358 30.0281 31.4297 33.3281C32.1628 33.6118 32.9127 33.8227 33.6797 33.9609C33.7032 43.5704 33.6797 53.1797 33.6094 62.7891C26.7195 59.7779 19.8522 56.7075 13.0078 53.5781C10.8308 52.1017 9.49486 50.0626 9 47.4609C8.90625 39.7734 8.90625 32.086 9 24.3984C9.04434 24.1051 9.11466 23.8238 9.21094 23.5547Z" fill="url(#paint2_linear_products_2)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M62.2276 23.5546C62.4135 23.5307 62.5776 23.5776 62.7197 23.6953C62.7666 23.9297 62.8135 24.164 62.8604 24.3984C62.9542 32.0859 62.9542 39.7733 62.8604 47.4609C62.3655 50.0626 61.0296 52.1017 58.8526 53.5781C52.0082 56.7074 45.1409 59.7778 38.251 62.789C38.1807 53.1797 38.1572 43.5704 38.1807 33.9609C38.9477 33.8227 39.6976 33.6117 40.4307 33.3281C42.7686 32.2598 45.1122 31.2051 47.4619 30.164C47.5391 32.2344 47.6563 34.2968 47.8135 36.3515C48.6589 37.8549 49.8074 38.1362 51.2588 37.1953C51.5572 36.9209 51.7682 36.5927 51.8916 36.2109C51.9384 33.539 51.9854 30.8671 52.0322 28.1953C55.4496 26.6619 58.8481 25.115 62.2276 23.5546Z" fill="url(#paint3_linear_products_2)"/>
                    <defs>
                      <linearGradient id="paint0_linear_products_2" x1="42.9066" y1="8.78906" x2="42.9066" y2="24.2578" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF6D1F"/>
                        <stop offset="1" stopColor="#772C05"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_products_2" x1="28.0004" y1="15.1172" x2="28.0004" y2="29.8669" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF6D1F"/>
                        <stop offset="1" stopColor="#772C05"/>
                      </linearGradient>
                      <linearGradient id="paint2_linear_products_2" x1="21.3091" y1="23.5547" x2="21.3091" y2="62.7891" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF6D1F"/>
                        <stop offset="1" stopColor="#772C05"/>
                      </linearGradient>
                      <linearGradient id="paint3_linear_products_2" x1="50.5513" y1="23.5486" x2="50.5513" y2="62.789" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF6D1F"/>
                        <stop offset="1" stopColor="#772C05"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </StartShape>
              <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">{creators.length}+</div>
              <div className="text-xs text-white">Creators</div>
            </div>
            <div className="text-center flex flex-col items-center">
              <StartShape className="max-w-[80px] sm:max-w-[100px]">
                <div className="flex justify-center">
                  <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.986" fillRule="evenodd" clipRule="evenodd" d="M20 20H35V35H20V20Z" fill="url(#paint0_linear_1341_459)"/>
                    <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M37 20H52V35H37V20Z" fill="url(#paint1_linear_1341_459)"/>
                    <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M20 37H35V52H20V37Z" fill="url(#paint2_linear_1341_459)"/>
                    <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M37 37H52V52H37V37Z" fill="url(#paint3_linear_1341_459)"/>
                    <defs>
                      <linearGradient id="paint0_linear_1341_459" x1="27.5" y1="20" x2="27.5" y2="35" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5EC900"/>
                        <stop offset="1" stopColor="#224801"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_1341_459" x1="44.5" y1="20" x2="44.5" y2="35" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5EC900"/>
                        <stop offset="1" stopColor="#224801"/>
                      </linearGradient>
                      <linearGradient id="paint2_linear_1341_459" x1="27.5" y1="37" x2="27.5" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5EC900"/>
                        <stop offset="1" stopColor="#224801"/>
                      </linearGradient>
                      <linearGradient id="paint3_linear_1341_459" x1="44.5" y1="37" x2="44.5" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#5EC900"/>
                        <stop offset="1" stopColor="#224801"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </StartShape>
              <div className="text-lg sm:text-2xl font-extrabold text-white mt-2 sm:mt-3">{categories.length}+</div>
              <div className="text-xs text-white">Categories</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
