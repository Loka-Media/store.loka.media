"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const QualityProductsHeading = () => (
  <svg width="1754" height="235" viewBox="0 0 1754 235" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path d="M76.7382 100.163H52.9482L40.2602 84.0589C15.2502 82.5949 0.000195358 66.3689 0.000195358 42.0909C0.000195358 16.5929 16.8362 0.000936627 43.9202 0.000936627C71.6142 0.000936627 88.3282 16.5929 88.3282 42.0909C88.3282 61.9769 78.2022 76.4949 60.5122 81.8629L76.7382 100.163ZM43.9202 66.6129C61.8542 66.6129 68.8082 60.2689 68.8082 42.0909C68.8082 23.9129 61.8542 17.5689 43.9202 17.5689C25.9862 17.5689 19.3982 23.9129 19.3982 42.0909C19.3982 60.2689 25.9862 66.6129 43.9202 66.6129ZM124.003 84.1809C106.801 84.1809 98.6267 73.5669 98.6267 59.9029V21.8389H116.927V53.8029C116.927 63.6849 121.075 67.8329 132.665 67.8329C144.621 67.8329 148.891 63.1969 148.891 52.8269V21.8389H167.191V82.9609H150.111V64.2949H149.135C147.549 74.5429 140.107 84.1809 124.003 84.1809ZM197.776 84.1809C184.6 84.1809 176.67 78.0809 176.67 67.8329C176.67 58.8049 183.38 53.1929 196.434 51.8509L222.664 49.1669V46.8489C222.664 38.9189 219.126 36.7229 209.366 36.7229C200.094 36.7229 196.312 39.1629 196.312 46.1169V46.6049H177.89V46.2389C177.89 31.1109 190.578 20.6189 210.708 20.6189C231.082 20.6189 240.72 31.1109 240.72 47.0929V82.9609H223.64V68.9309H222.664C219.858 78.4469 211.318 84.1809 197.776 84.1809ZM195.092 66.6129C195.092 69.9069 197.654 71.2489 203.022 71.2489C215.466 71.2489 222.176 68.3209 222.664 59.6589L201.436 62.0989C197.044 62.4649 195.092 63.6849 195.092 66.6129ZM270.735 82.9609H252.435V1.22094H270.735V82.9609ZM301.054 15.6169H282.754V1.22094H301.054V15.6169ZM301.054 82.9609H282.754V21.8389H301.054V82.9609ZM356.139 82.9609H341.011C326.737 82.9609 318.075 76.2509 318.075 60.8789V36.9669H308.437V21.8389H318.075V10.0049H336.375V21.8389H356.139V36.9669H336.375V58.8049C336.375 64.9049 338.693 66.4909 345.159 66.4909H356.139V82.9609ZM377.145 103.701H367.141V87.1089H382.147C386.661 87.1089 388.613 85.8889 389.833 83.2049L359.943 21.8389H380.683L393.615 49.7769L398.739 64.1729H399.959L404.839 49.6549L416.429 21.8389H436.803L406.547 87.3529C400.691 100.163 392.517 103.701 377.145 103.701ZM483.211 82.9609H464.911V1.22094H507.611C526.521 1.22094 538.721 11.9569 538.721 30.7449C538.721 49.5329 526.521 60.3909 507.611 60.3909H483.211V82.9609ZM505.659 17.6909H483.211V43.9209H505.659C515.785 43.9209 520.543 40.9929 520.543 30.7449C520.543 20.7409 515.785 17.6909 505.659 17.6909ZM565.952 82.9609H547.652V21.8389H564.61V38.0649H565.708C567.416 28.1829 573.882 20.6189 586.204 20.6189C599.868 20.6189 605.48 30.0129 605.48 41.9689V52.0949H587.18V45.7509C587.18 39.0409 584.496 36.1129 577.054 36.1129C568.88 36.1129 565.952 39.8949 565.952 47.5809V82.9609ZM647.121 84.1809C626.259 84.1809 612.229 71.7369 612.229 52.4609C612.229 32.9409 626.259 20.6189 647.121 20.6189C667.983 20.6189 682.013 32.9409 682.013 52.4609C682.013 71.7369 667.983 84.1809 647.121 84.1809ZM647.121 67.9549C659.443 67.9549 663.835 63.1969 663.835 52.4609C663.835 41.7249 659.443 36.7229 647.121 36.7229C634.677 36.7229 630.407 41.7249 630.407 52.4609C630.407 63.1969 634.677 67.9549 647.121 67.9549ZM719.254 84.1809C700.222 84.1809 689.73 71.7369 689.73 52.4609C689.73 32.9409 700.1 20.6189 718.278 20.6189C732.796 20.6189 740.238 27.8169 742.312 38.0649H743.41V1.22094H761.71V82.9609H744.63V66.0029H743.654C741.336 78.0809 733.284 84.1809 719.254 84.1809ZM708.274 52.4609C708.274 63.5629 713.764 67.4669 725.476 67.4669C737.066 67.4669 743.41 63.4409 743.41 52.8269V51.8509C743.41 41.2369 737.188 37.3329 725.476 37.3329C713.764 37.3329 708.274 41.2369 708.274 52.4609ZM799.087 84.1809C781.885 84.1809 773.711 73.5669 773.711 59.9029V21.8389H792.011V53.8029C792.011 63.6849 796.159 67.8329 807.749 67.8329C819.705 67.8329 823.975 63.1969 823.975 52.8269V21.8389H842.275V82.9609H825.195V64.2949H824.219C822.633 74.5429 815.191 84.1809 799.087 84.1809ZM886.646 84.1809C865.662 84.1809 852.242 71.7369 852.242 52.4609C852.242 32.9409 865.662 20.6189 886.646 20.6189C906.288 20.6189 919.708 31.1109 919.708 46.9709V48.6789H901.53V47.7029C901.53 39.8949 895.796 37.0889 886.28 37.0889C875.422 37.0889 870.42 41.1149 870.42 52.4609C870.42 63.6849 875.422 67.7109 886.28 67.7109C895.796 67.7109 901.53 64.9049 901.53 57.0969V56.1209H919.708V57.8289C919.708 73.5669 906.288 84.1809 886.646 84.1809ZM973.087 82.9609H957.959C943.685 82.9609 935.023 76.2509 935.023 60.8789V36.9669H925.385V21.8389H935.023V10.0049H953.323V21.8389H973.087V36.9669H953.323V58.8049C953.323 64.9049 955.641 66.4909 962.107 66.4909H973.087V82.9609ZM1013.25 84.1809C992.629 84.1809 981.283 76.1289 981.283 61.9769V61.6109H999.583V62.7089C999.583 68.1989 1003 69.6629 1013.37 69.6629C1023.13 69.6629 1025.45 68.0769 1025.45 64.4169C1025.45 61.0009 1023.62 60.0249 1016.42 59.0489L999.217 56.9749C987.017 55.6329 980.185 50.1429 980.185 39.8949C980.185 29.1589 989.335 20.6189 1010.32 20.6189C1030.33 20.6189 1041.67 28.1829 1041.67 43.0669V43.4329H1023.37V42.7009C1023.37 37.6989 1020.93 35.1369 1009.71 35.1369C1000.56 35.1369 998.241 36.7229 998.241 40.6269C998.241 43.7989 999.949 45.1409 1008 46.1169L1021.06 47.7029C1037.4 49.5329 1043.5 55.0229 1043.5 65.1489C1043.5 76.6169 1032.16 84.1809 1013.25 84.1809Z" fill="url(#paint0_linear_0_1)"/>
    <path d="M433.478 232.961H410.664L393.95 171.839H412.86L420.058 199.777L422.62 218.809H423.84L428.72 197.947L437.992 171.839H461.538L470.688 197.947L475.568 218.809H476.788L479.472 199.777L486.548 171.839H505.214L487.89 232.961H465.076L454.584 203.559L450.07 186.723H448.728L444.092 203.559L433.478 232.961ZM530.848 165.617H512.548V151.221H530.848V165.617ZM530.848 232.961H512.548V171.839H530.848V232.961ZM585.932 232.961H570.804C556.53 232.961 547.868 226.251 547.868 210.879V186.967H538.23V171.839H547.868V160.005H566.168V171.839H585.932V186.967H566.168V208.805C566.168 214.905 568.486 216.491 574.952 216.491H585.932V232.961ZM613.526 232.961H595.226V151.221H613.526V190.505H614.502C616.454 180.135 623.652 170.619 639.268 170.619C655.738 170.619 663.79 181.355 663.79 195.507V232.961H645.49V200.997C645.49 190.749 641.098 187.089 629.63 187.089C617.308 187.089 613.526 192.091 613.526 202.339V232.961ZM708.039 234.181C687.177 234.181 673.147 221.737 673.147 202.461C673.147 182.941 687.177 170.619 708.039 170.619C728.901 170.619 742.931 182.941 742.931 202.461C742.931 221.737 728.901 234.181 708.039 234.181ZM708.039 217.955C720.361 217.955 724.753 213.197 724.753 202.461C724.753 191.725 720.361 186.723 708.039 186.723C695.595 186.723 691.325 191.725 691.325 202.461C691.325 213.197 695.595 217.955 708.039 217.955ZM778.099 234.181C760.897 234.181 752.723 223.567 752.723 209.903V171.839H771.023V203.803C771.023 213.685 775.171 217.833 786.761 217.833C798.717 217.833 802.987 213.197 802.987 202.827V171.839H821.287V232.961H804.207V214.295H803.231C801.645 224.543 794.203 234.181 778.099 234.181ZM876.149 232.961H861.021C846.747 232.961 838.085 226.251 838.085 210.879V186.967H828.447V171.839H838.085V160.005H856.385V171.839H876.149V186.967H856.385V208.805C856.385 214.905 858.703 216.491 865.169 216.491H876.149V232.961ZM949.774 232.961H934.646C920.372 232.961 911.71 226.251 911.71 210.879V186.967H902.072V171.839H911.71V160.005H930.01V171.839H949.774V186.967H930.01V208.805C930.01 214.905 932.328 216.491 938.794 216.491H949.774V232.961ZM977.368 232.961H959.068V151.221H977.368V190.505H978.344C980.296 180.135 987.494 170.619 1003.11 170.619C1019.58 170.619 1027.63 181.355 1027.63 195.507V232.961H1009.33V200.997C1009.33 190.749 1004.94 187.089 993.472 187.089C981.15 187.089 977.368 192.091 977.368 202.339V232.961ZM1071.76 234.181C1051.38 234.181 1037.48 224.177 1037.48 202.461C1037.48 182.941 1051.26 170.619 1071.39 170.619C1091.4 170.619 1104.7 181.111 1104.7 200.265C1104.7 202.461 1104.45 204.047 1104.21 206.121H1054.43C1054.92 215.515 1059.31 219.541 1071.15 219.541C1082.01 219.541 1085.79 216.735 1085.79 211.489V210.269H1104.09V211.611C1104.09 224.909 1091.16 234.181 1071.76 234.181ZM1071.03 184.893C1060.17 184.893 1055.53 188.553 1054.68 196.483H1087.13C1086.64 188.431 1081.76 184.893 1071.03 184.893ZM1154.46 232.961H1136.16V151.221H1154.46V190.505H1197.16V151.221H1215.46V232.961H1197.16V200.143H1154.46V232.961ZM1260.17 234.181C1239.8 234.181 1225.89 224.177 1225.89 202.461C1225.89 182.941 1239.68 170.619 1259.81 170.619C1279.81 170.619 1293.11 181.111 1293.11 200.265C1293.11 202.461 1292.87 204.047 1292.62 206.121H1242.85C1243.34 215.515 1247.73 219.541 1259.56 219.541C1270.42 219.541 1274.2 216.735 1274.2 211.489V210.269H1292.5V211.611C1292.5 224.909 1279.57 234.181 1260.17 234.181ZM1259.44 184.893C1248.58 184.893 1243.95 188.553 1243.09 196.483H1275.54C1275.06 188.431 1270.18 184.893 1259.44 184.893ZM1322.1 234.181C1308.92 234.181 1300.99 228.081 1300.99 217.833C1300.99 208.805 1307.7 203.193 1320.76 201.851L1346.99 199.167V196.849C1346.99 188.919 1343.45 186.723 1333.69 186.723C1324.42 186.723 1320.64 189.163 1320.64 196.117V196.605H1302.21V196.239C1302.21 181.111 1314.9 170.619 1335.03 170.619C1355.41 170.619 1365.04 181.111 1365.04 197.093V232.961H1347.96V218.931H1346.99C1344.18 228.447 1335.64 234.181 1322.1 234.181ZM1319.42 216.613C1319.42 219.907 1321.98 221.249 1327.35 221.249C1339.79 221.249 1346.5 218.321 1346.99 209.659L1325.76 212.099C1321.37 212.465 1319.42 213.685 1319.42 216.613ZM1404.09 234.181C1385.06 234.181 1374.56 221.737 1374.56 202.461C1374.56 182.941 1384.93 170.619 1403.11 170.619C1417.63 170.619 1425.07 177.817 1427.15 188.065H1428.24V151.221H1446.54V232.961H1429.46V216.003H1428.49C1426.17 228.081 1418.12 234.181 1404.09 234.181ZM1393.11 202.461C1393.11 213.563 1398.6 217.467 1410.31 217.467C1421.9 217.467 1428.24 213.441 1428.24 202.827V201.851C1428.24 191.237 1422.02 187.333 1410.31 187.333C1398.6 187.333 1393.11 191.237 1393.11 202.461ZM1477.46 234.181C1464.28 234.181 1456.35 228.081 1456.35 217.833C1456.35 208.805 1463.06 203.193 1476.11 201.851L1502.34 199.167V196.849C1502.34 188.919 1498.81 186.723 1489.05 186.723C1479.77 186.723 1475.99 189.163 1475.99 196.117V196.605H1457.57V196.239C1457.57 181.111 1470.26 170.619 1490.39 170.619C1510.76 170.619 1520.4 181.111 1520.4 197.093V232.961H1503.32V218.931H1502.34C1499.54 228.447 1491 234.181 1477.46 234.181ZM1474.77 216.613C1474.77 219.907 1477.33 221.249 1482.7 221.249C1495.15 221.249 1501.86 218.321 1502.34 209.659L1481.12 212.099C1476.72 212.465 1474.77 213.685 1474.77 216.613ZM1564.69 234.181C1543.7 234.181 1530.28 221.737 1530.28 202.461C1530.28 182.941 1543.7 170.619 1564.69 170.619C1584.33 170.619 1597.75 181.111 1597.75 196.971V198.679H1579.57V197.703C1579.57 189.895 1573.84 187.089 1564.32 187.089C1553.46 187.089 1548.46 191.115 1548.46 202.461C1548.46 213.685 1553.46 217.711 1564.32 217.711C1573.84 217.711 1579.57 214.905 1579.57 207.097V206.121H1597.75V207.829C1597.75 223.567 1584.33 234.181 1564.69 234.181ZM1626.36 232.961H1608.06V151.221H1626.36V190.505H1627.34C1629.29 180.135 1636.49 170.619 1652.11 170.619C1668.58 170.619 1676.63 181.355 1676.63 195.507V232.961H1658.33V200.997C1658.33 190.749 1653.94 187.089 1642.47 187.089C1630.15 187.089 1626.36 192.091 1626.36 202.339V232.961ZM1720.76 234.181C1700.38 234.181 1686.47 224.177 1686.47 202.461C1686.47 182.941 1700.26 170.619 1720.39 170.619C1740.4 170.619 1753.7 181.111 1753.7 200.265C1753.7 202.461 1753.45 204.047 1753.21 206.121H1703.43C1703.92 215.515 1708.31 219.541 1720.15 219.541C1731 219.541 1734.79 216.735 1734.79 211.489V210.269H1753.09V211.611C1753.09 224.909 1740.15 234.181 1720.76 234.181ZM1720.02 184.893C1709.17 184.893 1704.53 188.553 1703.68 196.483H1736.13C1735.64 188.431 1730.76 184.893 1720.02 184.893Z" fill="url(#paint1_linear_0_1)"/>
    <defs>
      <linearGradient id="paint0_linear_0_1" x1="521.95" y1="-31.0391" x2="521.95" y2="118.961" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="#B94D13"/>
      </linearGradient>
      <linearGradient id="paint1_linear_0_1" x1="1075.45" y1="118.961" x2="1075.45" y2="268.961" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="#B94D13"/>
      </linearGradient>
    </defs>
  </svg>
);

export  function QualityProductsSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "create"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = ["/images/1.jpeg", "/images/2.jpeg", "/images/3.jpeg", "/images/4.jpeg", "/images/5.jpeg"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <section
      className="relative bg-black py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12 md:space-y-16">
        {/* Top - Heading */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl">
            <QualityProductsHeading />
          </div>
        </div>

        {/* Bottom - Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-16 items-start">
          {/* Left side - Scrolling Images */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] border border-white/20 hover:shadow-[12px_12px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentImageIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Product showcase ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
              ))}

              {/* Image indicators */}
              <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-3 sm:left-4 md:left-5 z-10 flex space-x-1.5 sm:space-x-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 border border-white ${
                      index === currentImageIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-2 sm:space-y-3">
              {/* Create beautiful products */}
              <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <button
                  onClick={() => toggleSection("create")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300">
                    Create beautiful products
                  </span>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out">
                      {expandedSection === "create" ? (
                        <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-500 ease-out ${
                    expandedSection === "create"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-4 sm:mb-5 font-medium">
                      From apparel to makeup to your own product lines, we've teamed up with top brands and manufacturers to bring your ideas to life. No minimums required.
                    </p>
                    <Button variant="primary" href="/dashboard/creator/canvas">
                      Create your first product
                    </Button>
                  </div>
                </div>
              </div>

              {/* Launch your own shop */}
              <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <button
                  onClick={() => toggleSection("shop")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300">
                    Launch your own shop
                  </span>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out">
                      {expandedSection === "shop" ? (
                        <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-500 ease-out ${
                    expandedSection === "shop"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
                      Set up your free custom shop and start selling your products with our easy-to-use platform across all social platforms. Full customization available. Ask us about your own fully branded website.
                    </p>
                  </div>
                </div>
              </div>

              {/* We handle shipping & support */}
              <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <button
                  onClick={() => toggleSection("shipping")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300">
                    We handle shipping & support
                  </span>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out">
                      {expandedSection === "shipping" ? (
                        <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-500 ease-out ${
                    expandedSection === "shipping"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
                      Join trendsetting creators already earning across all socials with our platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
