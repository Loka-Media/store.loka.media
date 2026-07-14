'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate, checkoutAPI, addressAPI, Address } from '@/lib/api';
import { User, Package, MapPin, Calendar, Phone, Mail, Edit2, Plus, ChevronDown, ChevronUp, LogOut, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import CreativeLoader from '@/components/CreativeLoader';
import GradientTitle from '@/components/ui/GradientTitle';

interface OrderItem {
  product_id: number;
  variant_id: number;
  product_name: string;
  price: string;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
  total_price: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count: number;
  order_items: OrderItem[];
  shipping_cost: number;
  tax_amount: number;
  admin_fee: number;
  shipping_address: any;
  metadata: any;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchUserData();
  }, [isAuthenticated, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersResponse, addressesResponse] = await Promise.all([
        checkoutAPI.getUserOrders({ limit: 5 }),
        addressAPI.getAddresses()
      ]);

      console.log('📦 Fetched orders:', ordersResponse.orders);
      // Log image URLs for debugging
      ordersResponse.orders.forEach((order: Order, orderIndex: any) => {
        order.order_items?.forEach((item, itemIndex) => {
          console.log(`🖼️ Order ${orderIndex + 1}, Item ${itemIndex + 1} - Image URL:`, item.image_url);
        });
      });

      setOrders(ordersResponse.orders);
      setAddresses(addressesResponse.addresses);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to load profile data. Please try again.');
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <CreativeLoader variant="default" message="Loading your profile..." />
      </div>
    );
  }
  const OverviewIcon = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.991" fillRule="evenodd" clipRule="evenodd" d="M3.46875 1.03125C11.8021 1.02083 20.1354 1.03125 28.4688 1.0625C30.0286 1.35154 30.9349 2.27862 31.1875 3.84375C31.2292 6.94794 31.2292 10.0521 31.1875 13.1563C30.9818 14.2161 30.3464 14.8307 29.2813 15C20.4271 15.0417 11.5729 15.0417 2.71875 15C1.61996 14.8596 0.963708 14.245 0.750002 13.1563C0.708333 10.0729 0.708333 6.98956 0.750002 3.90625C0.985195 2.30663 1.89145 1.34829 3.46875 1.03125Z" fill="currentColor" />
      <path opacity="0.99" fillRule="evenodd" clipRule="evenodd" d="M2.34375 16.9063C5.92715 16.8958 9.5105 16.9063 13.0938 16.9375C13.9983 17.1963 14.5296 17.7901 14.6875 18.7188C14.7292 22.1771 14.7292 25.6354 14.6875 29.0938C14.5104 30.1042 13.9167 30.6979 12.9063 30.875C9.78125 30.9167 6.65625 30.9167 3.53125 30.875C1.90866 30.6066 0.981583 29.6587 0.750002 28.0313C0.708333 24.9271 0.708333 21.8229 0.750002 18.7188C0.919789 17.789 1.45104 17.1848 2.34375 16.9063Z" fill="currentColor" />
      <path opacity="0.992" fillRule="evenodd" clipRule="evenodd" d="M18.8438 16.9063C22.4271 16.8958 26.0105 16.9063 29.5938 16.9375C30.4983 17.1963 31.0296 17.7901 31.1875 18.7188C31.2292 21.8229 31.2292 24.9271 31.1875 28.0313C30.956 29.6587 30.0288 30.6066 28.4063 30.875C25.2605 30.9167 22.1146 30.9167 18.9688 30.875C18.0753 30.6899 17.5023 30.1586 17.25 29.2813C17.2083 25.6771 17.2083 22.0729 17.25 18.4688C17.4869 17.6381 18.0181 17.1173 18.8438 16.9063Z" fill="currentColor" />
    </svg>

  )
  const OrdersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1402_2169)">
        <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M3.40625 -0.03125C10.0104 -0.03125 16.6146 -0.03125 23.2188 -0.03125C24.0924 0.2276 24.7278 0.769269 25.125 1.59375C25.2336 1.85382 25.2961 2.12466 25.3125 2.40625C25.3438 6.92706 25.3542 11.4479 25.3438 15.9688C21.8401 15.7014 18.9546 16.8889 16.6875 19.5312C15.4624 21.1079 14.7958 22.8996 14.6875 24.9062C14.6563 26.3853 14.6458 27.8644 14.6563 29.3438C11.0104 29.3542 7.3645 29.3438 3.71875 29.3125C2.41825 29.1162 1.61616 28.3767 1.3125 27.0938C1.27083 18.8021 1.27083 10.5104 1.3125 2.21875C1.54978 1.03375 2.2477 0.283749 3.40625 -0.03125ZM5.34375 3.96875C9.76044 3.96875 14.1771 3.96875 18.5938 3.96875C18.5938 4.84375 18.5938 5.71875 18.5938 6.59375C14.1771 6.59375 9.76044 6.59375 5.34375 6.59375C5.34375 5.71875 5.34375 4.84375 5.34375 3.96875ZM5.34375 9.34375C10.6563 9.34375 15.9688 9.34375 21.2813 9.34375C21.2813 10.2188 21.2813 11.0938 21.2813 11.9688C15.9688 11.9688 10.6563 11.9688 5.34375 11.9688C5.34375 11.0938 5.34375 10.2188 5.34375 9.34375ZM5.34375 14.6562C7.98956 14.6562 10.6354 14.6562 13.2813 14.6562C13.2813 15.5312 13.2813 16.4062 13.2813 17.2812C10.6354 17.2812 7.98956 17.2812 5.34375 17.2812C5.34375 16.4062 5.34375 15.5312 5.34375 14.6562ZM5.34375 19.9688C7.09375 19.9688 8.84375 19.9688 10.5938 19.9688C10.5938 20.8438 10.5938 21.7188 10.5938 22.5938C8.84375 22.5938 7.09375 22.5938 5.34375 22.5938C5.34375 21.7188 5.34375 20.8438 5.34375 19.9688Z" fill="currentColor" />
        <path opacity="0.985" fillRule="evenodd" clipRule="evenodd" d="M24.8425 31.9688C24.2591 31.9688 23.6758 31.9688 23.0925 31.9688C19.7943 31.3346 17.8671 29.3555 17.3112 26.0313C17.1411 22.8303 18.4849 20.5282 21.3425 19.1251C23.9496 18.1707 26.3246 18.5665 28.4675 20.3126C30.4321 22.2646 31.0676 24.5875 30.3737 27.2813C29.4363 29.9168 27.5926 31.4793 24.8425 31.9688ZM22.9675 21.3438C23.6341 21.3438 24.3008 21.3438 24.9675 21.3438C24.9675 22.3438 24.9675 23.3438 24.9675 24.3438C25.9675 24.3438 26.9675 24.3438 27.9675 24.3438C27.9675 24.9896 27.9675 25.6355 27.9675 26.2813C26.3008 26.2813 24.6341 26.2813 22.9675 26.2813C22.9675 24.6355 22.9675 22.9896 22.9675 21.3438Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_1402_2169">
          <rect width="32" height="32" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
  const AddressesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M15.03 0.280983C19.2934 0.0791854 22.7413 1.64168 25.3738 4.96848C27.6955 8.19973 28.2163 11.6997 26.9363 15.4685C26.1821 17.3875 25.2654 19.2209 24.1863 20.9685C22.144 24.2815 19.8836 27.4377 17.405 30.4372C16.2016 31.1705 15.1079 31.0351 14.1238 30.031C11.1579 26.3513 8.53288 22.4346 6.24876 18.281C5.37711 16.6627 4.75211 14.9544 4.37376 13.156C4.0308 8.10186 6.02038 4.27891 10.3425 1.68723C11.8224 0.916558 13.3849 0.44781 15.03 0.280983ZM15.4675 5.65598C18.0646 5.60496 19.95 6.72998 21.1238 9.03098C21.9516 11.1463 21.6808 13.1046 20.3113 14.906C18.4818 16.8659 16.3048 17.3972 13.78 16.4997C11.1804 15.2073 10.0659 13.1135 10.4363 10.2185C11.1377 7.6103 12.8148 6.08949 15.4675 5.65598Z" fill="currentColor" />
    </svg>
  )
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pb-6 sm:pb-8 pt-6 sm:pt-8">
              <GradientTitle text="My Profile" size="lg" />
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-8 sm:p-12 mb-8 inline-block">
              <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-400 mx-auto" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Profile Data Not Found</h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-lg">
              {error}
            </p>
            <button
              onClick={() => fetchUserData()}
              disabled={loading}
              className="inline-flex items-center px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-sm sm:text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <span>Try Again</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <CreativeLoader variant="default" message="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-6 sm:pb-8 pt-6 sm:pt-8 text-center sm:text-left">
            <GradientTitle text="My Profile" size="lg" />
            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium px-2 sm:px-0">
              Manage your account and view your order history
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Overview */}
        <div className="gradient-border-white-top p-6 sm:p-8 mb-8">
          {/* Top Row - Member Since & Edit Button */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <div />
            <div className="flex items-center gap-4">
              <div className="flex items-center  gap-1">
                <span className="text-white/80 text-xs sm:text-sm font-medium">Member Since 2024</span>
                <svg width="20" height="20" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.965" fillRule="evenodd" clipRule="evenodd" d="M10.7852 2.58461C11.8398 2.39405 12.5918 2.77686 13.041 3.73304C13.0958 4.71742 13.0958 5.70179 13.041 6.68617C12.4626 7.84249 11.5739 8.15694 10.375 7.62953C9.99062 7.35347 9.73083 6.98433 9.59572 6.5221C9.54101 5.6471 9.54101 4.77211 9.59572 3.8971C9.75544 3.23209 10.1519 2.7946 10.7852 2.58461Z" fill="url(#paint0_linear_1394_2121)" />
                  <path opacity="0.965" fillRule="evenodd" clipRule="evenodd" d="M29.9844 2.58394C31.157 2.35602 31.9362 2.79352 32.3223 3.89644C32.377 4.77144 32.377 5.64644 32.3223 6.52144C31.9367 7.63752 31.1574 8.06135 29.9844 7.79292C29.4512 7.58785 29.0821 7.21871 28.877 6.6855C28.8223 5.70113 28.8223 4.71675 28.877 3.73238C29.0974 3.19762 29.4665 2.8148 29.9844 2.58394Z" fill="url(#paint1_linear_1394_2121)" />
                  <path opacity="0.987" fillRule="evenodd" clipRule="evenodd" d="M6.19263 5.20914C6.7395 5.20914 7.28637 5.20914 7.83325 5.20914C7.67491 6.95683 8.33118 8.28302 9.802 9.18766C11.431 9.85277 12.8391 9.53834 14.0266 8.2443C14.6704 7.33806 14.9302 6.32634 14.8059 5.20914C18.9075 5.20914 23.009 5.20914 27.1106 5.20914C26.95 7.73609 28.1121 9.18528 30.5969 9.5568C32.2088 9.42087 33.3026 8.60056 33.8782 7.09586C34.0095 6.47406 34.0779 5.84515 34.0833 5.20914C36.073 4.93885 37.4812 5.70447 38.3079 7.50602C38.373 7.74977 38.4277 7.99587 38.4719 8.2443C38.513 10.1582 38.5267 12.0722 38.513 13.9865C26.8098 13.9865 15.1067 13.9865 3.40356 13.9865C3.3899 12.0722 3.40356 10.1582 3.44458 8.2443C3.7214 6.64182 4.63741 5.6301 6.19263 5.20914Z" fill="url(#paint2_linear_1394_2121)" />
                  <path opacity="0.989" fillRule="evenodd" clipRule="evenodd" d="M3.40357 15.709C15.1067 15.709 26.8098 15.709 38.513 15.709C38.5267 22.5723 38.513 29.4356 38.4719 36.2988C38.2105 37.9001 37.2945 38.8981 35.7239 39.293C25.8801 39.3477 16.0364 39.3477 6.19263 39.293C4.62207 38.8981 3.70605 37.9001 3.44458 36.2988C3.40357 29.4356 3.38989 22.5723 3.40357 15.709ZM10.0481 20.1387C13.2327 19.5362 14.5042 20.8213 13.8626 23.9941C13.6494 24.6722 13.1982 25.096 12.509 25.2656C11.7434 25.3203 10.9778 25.3203 10.2122 25.2656C9.40555 25.1153 8.92698 24.6367 8.77662 23.8301C8.7219 23.0645 8.7219 22.2988 8.77662 21.5332C8.96168 20.8426 9.38553 20.3778 10.0481 20.1387ZM19.6458 20.1387C20.5212 20.125 21.3962 20.1387 22.2708 20.1797C23.0601 20.4579 23.4839 21.0184 23.5422 21.8613C23.9341 24.7499 22.6899 25.8847 19.8098 25.2656C19.2476 25.1413 18.8237 24.8268 18.5383 24.3223C18.3004 23.3452 18.2731 22.3608 18.4563 21.3691C18.6492 20.7526 19.0456 20.3424 19.6458 20.1387ZM29.3255 20.1387C32.425 19.506 33.6965 20.7364 33.1399 23.8301C32.9895 24.6367 32.511 25.1153 31.7044 25.2656C28.5979 25.823 27.3811 24.5515 28.054 21.4512C28.2742 20.8072 28.6981 20.3697 29.3255 20.1387ZM10.2122 29.7363C13.3175 29.2189 14.5344 30.5041 13.8626 33.5918C13.6575 34.2344 13.2336 34.6582 12.5911 34.8633C9.2953 35.4775 8.05118 34.1513 8.85865 30.8848C9.12796 30.2797 9.57913 29.8969 10.2122 29.7363ZM19.8098 29.7363C22.9652 29.2414 24.1819 30.5539 23.4602 33.6738C23.2825 34.2891 22.886 34.6855 22.2708 34.8633C18.9842 35.5415 17.7127 34.2426 18.4563 30.9668C18.7173 30.3362 19.1685 29.9261 19.8098 29.7363ZM29.4075 29.7363C30.1736 29.7227 30.9393 29.7363 31.7044 29.7774C32.511 29.9277 32.9895 30.4063 33.1399 31.2129C33.6973 34.3193 32.4258 35.5362 29.3255 34.8633C28.6829 34.6582 28.259 34.2344 28.054 33.5918C27.9993 32.7442 27.9993 31.8965 28.054 31.0488C28.2819 30.3696 28.733 29.9321 29.4075 29.7363Z" fill="url(#paint3_linear_1394_2121)" />
                  <defs>
                    <linearGradient id="paint0_linear_1394_2121" x1="11.3184" y1="2.53711" x2="11.3184" y2="7.87734" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFED26" />
                      <stop offset="1" stopColor="#998E17" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_1394_2121" x1="30.5996" y1="2.52539" x2="30.5996" y2="7.87099" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFED26" />
                      <stop offset="1" stopColor="#998E17" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_1394_2121" x1="20.9583" y1="5.15625" x2="20.9583" y2="13.9865" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFED26" />
                      <stop offset="1" stopColor="#998E17" />
                    </linearGradient>
                    <linearGradient id="paint3_linear_1394_2121" x1="20.9583" y1="15.709" x2="20.9583" y2="39.334" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFED26" />
                      <stop offset="1" stopColor="#998E17" />
                    </linearGradient>
                  </defs>
                </svg>

              </div>
              <div className="w-px h-5 bg-white" />
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-0 sm:px-0 py-2.5 sm:py-3  text-white font-medium rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2 whitespace-nowrap"
              >
                <span>Edit Profile</span>
                <svg width="20" height="20" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1412_2567)">
                    <path opacity="0.968" fillRule="evenodd" clipRule="evenodd" d="M36.957 -0.0410156C37.3672 -0.0410156 37.7773 -0.0410156 38.1875 -0.0410156C38.549 0.0993423 38.8771 0.30442 39.1719 0.574219C39.8965 1.29883 40.6211 2.02344 41.3457 2.74805C41.6155 3.04279 41.8206 3.37091 41.9609 3.73242C41.9609 4.14258 41.9609 4.55273 41.9609 4.96289C41.8465 5.1796 41.7235 5.39835 41.5918 5.61914C40.8672 6.34375 40.1426 7.06836 39.418 7.79297C39.3633 7.84766 39.3086 7.84766 39.2539 7.79297C37.5164 6.06918 35.7937 4.33285 34.0859 2.58398C34.8094 1.81952 35.5477 1.06757 36.3008 0.328125C36.5215 0.19648 36.7403 0.0734329 36.957 -0.0410156Z" fill="#FF6D1F" />
                    <path opacity="0.983" fillRule="evenodd" clipRule="evenodd" d="M32.2797 4.30664C34.0774 5.98119 35.8411 7.70384 37.5707 9.47461C37.6254 9.52932 37.6254 9.58396 37.5707 9.63867C32.4165 14.7929 27.2621 19.9473 22.1078 25.1016C20.2881 25.7628 18.4561 26.3918 16.6117 26.9883C15.3403 27.1386 14.7797 26.5781 14.9301 25.3066C15.5266 23.4623 16.1556 21.6303 16.8168 19.8105C21.9877 14.6534 27.1419 9.48544 32.2797 4.30664Z" fill="#FF6D1F" />
                    <path opacity="0.997" fillRule="evenodd" clipRule="evenodd" d="M31.625 41.959C22.2734 41.959 12.9219 41.959 3.57031 41.959C1.68359 41.4395 0.480469 40.2363 -0.0390625 38.3496C-0.0390625 28.998 -0.0390625 19.6465 -0.0390625 10.2949C0.465603 8.40944 1.66873 7.21999 3.57031 6.72656C11.2265 6.67187 18.8828 6.67187 26.5391 6.72656C22.6403 10.5979 18.7712 14.4944 14.9316 18.416C14.7467 18.7037 14.5827 19.0044 14.4395 19.3184C13.8379 21.123 13.2363 22.9277 12.6348 24.7324C12.2073 26.5424 12.7679 27.9506 14.3164 28.957C15.2297 29.4196 16.1868 29.529 17.1875 29.2852C18.9922 28.6836 20.7969 28.082 22.6016 27.4805C23.0525 27.2963 23.4626 27.0502 23.832 26.7422C27.6192 22.9551 31.4062 19.168 35.1934 15.3809C35.2481 23.0371 35.2481 30.6934 35.1934 38.3496C34.6999 40.2512 33.5105 41.4543 31.625 41.959Z" fill="#FF6D1F" />
                  </g>
                  <defs>
                    <clipPath id="clip0_1412_2567">
                      <rect width="42" height="42" fill="white" />
                    </clipPath>
                  </defs>
                </svg>

              </Link>
            </div>
          </div>

          {/* Main Content - Avatar, Name, and Contact Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="gradient-border-white-right rounded-2xl p-3 flex items-center gap-5 min-h-[110px]">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 relative">
                {user?.profileImg ? (
                  <img
                    src={user.profileImg || undefined}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg sm:!text-xl font-bold text-white">
                  {user?.name}
                </h2>

                <p className="!text-xs sm:!text-xs text-orange-400 font-medium mt-1">
                  @{user?.username}
                </p>
              </div>
            </div>

            {/* Phone Card */}
            <div className="gradient-border-white-top rounded-2xl p-6 flex flex-col justify-between min-h-[110px] gap-2">
              <svg width="25" height="25" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1394_1923)">
                  <path opacity="0.99" fillRule="evenodd" clipRule="evenodd" d="M2.58594 -0.0410156C5.64844 -0.0410156 8.71097 -0.0410156 11.7734 -0.0410156C13.2799 0.413563 14.1686 1.42528 14.4395 2.99414C14.434 5.7999 14.8715 8.53428 15.752 11.1973C15.8926 12.0651 15.756 12.8854 15.3418 13.6582C14.0057 15.3872 12.6795 17.1234 11.3633 18.8672C14.002 24.0215 17.8985 27.9179 23.0527 30.5566C24.7965 29.2404 26.5327 27.9142 28.2617 26.5781C29.1226 26.1311 30.025 26.0218 30.9688 26.25C33.6893 27.1153 36.4784 27.5527 39.3359 27.5625C40.6907 27.9467 41.5657 28.808 41.9609 30.1465C41.9609 33.209 41.9609 36.2715 41.9609 39.334C41.5508 40.6738 40.6758 41.5488 39.3359 41.959C38.2695 41.959 37.2031 41.959 36.1367 41.959C24.3629 40.9472 14.8609 35.8066 7.63086 26.5371C3.10672 20.3898 0.550077 13.4991 -0.0390625 5.86523C-0.0390625 4.77149 -0.0390625 3.67773 -0.0390625 2.58398C0.371094 1.24414 1.2461 0.369141 2.58594 -0.0410156Z" fill="url(#paint0_linear_1394_1923)" />
                </g>
                <defs>
                  <linearGradient id="paint0_linear_1394_1923" x1="20.9609" y1="-0.0410156" x2="20.9609" y2="41.959" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5EC900" />
                    <stop offset="1" stopColor="#2E6300" />
                  </linearGradient>
                  <clipPath id="clip0_1394_1923">
                    <rect width="42" height="42" fill="white" />
                  </clipPath>
                </defs>
              </svg>


              <span className="text-white text-xs sm:!text-sm font-medium font-satoshi">
                {user?.phone || "Not provided"}
              </span>
            </div>

            {/* Email Card */}
            <div className="gradient-border-white-top rounded-2xl p-6 flex flex-col justify-between min-h-[110px]">
              <svg width="25" height="25" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1394_2115)">
                  <path opacity="0.992" fillRule="evenodd" clipRule="evenodd" d="M41.9609 8.24414C41.9609 8.79104 41.9609 9.33786 41.9609 9.88476C41.7241 10.7938 41.2319 11.5458 40.4844 12.1406C34.7422 15.9688 29 19.7968 23.2578 23.625C21.7265 24.5547 20.1953 24.5547 18.6641 23.625C12.9219 19.7968 7.17969 15.9688 1.4375 12.1406C0.689971 11.5458 0.197783 10.7938 -0.0390625 9.88476C-0.0390625 9.33786 -0.0390625 8.79104 -0.0390625 8.24414C0.428709 6.61448 1.49512 5.61643 3.16016 5.25C15.0274 5.19531 26.8945 5.19531 38.7617 5.25C40.4258 5.61599 41.4922 6.61403 41.9609 8.24414Z" fill="url(#paint0_linear_1394_2115)" />
                  <path opacity="0.994" fillRule="evenodd" clipRule="evenodd" d="M-0.0390625 13.9863C5.90422 17.9193 11.8378 21.8704 17.7617 25.8398C19.8945 26.9883 22.0273 26.9883 24.1602 25.8398C30.084 21.8704 36.0176 17.9193 41.9609 13.9863C41.9609 20.5488 41.9609 27.1113 41.9609 33.6738C41.4922 35.304 40.4258 36.302 38.7617 36.668C26.8945 36.7227 15.0274 36.7227 3.16016 36.668C1.49512 36.3015 0.428709 35.3035 -0.0390625 33.6738C-0.0390625 27.1113 -0.0390625 20.5488 -0.0390625 13.9863Z" fill="url(#paint1_linear_1394_2115)" />
                </g>
                <defs>
                  <linearGradient id="paint0_linear_1394_2115" x1="-0.0390625" y1="14.7656" x2="41.9609" y2="14.7656" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4A92FF" />
                    <stop offset="1" stopColor="#1A4C99" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_1394_2115" x1="-0.0390625" y1="25.3477" x2="41.9609" y2="25.3477" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4A92FF" />
                    <stop offset="1" stopColor="#1A4C99" />
                  </linearGradient>
                  <clipPath id="clip0_1394_2115">
                    <rect width="42" height="42" fill="white" />
                  </clipPath>
                </defs>
              </svg>


              <span className="text-white !text-xs sm:!text-sm font-medium font-satoshi">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="gradient-border-white-bottom p-2 sm:p-3 mb-8 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="flex gap-2 min-w-max sm:min-w-0">
            {[
              { key: 'overview', label: 'Overview', icon: OverviewIcon },
              { key: 'orders', label: 'Order History', icon: OrdersIcon },
              { key: 'addresses', label: 'Addresses', icon: AddressesIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-[85vw] sm:w-auto sm:flex-1 snap-center shrink-0 py-3 sm:py-3.5 px-4 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer gap-2 rounded-full transition-all ${activeTab === key
                  ? 'bg-[#FF6D1F] text-black shadow-lg'
                  : 'border border-white text-white '
                  }`}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Total Orders */}
            <div className="gradient-border-white-top p-5 sm:p-6 hover:bg-white/5 transition-all h-[130px] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <svg width="40" height="40" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.99" fillRule="evenodd" clipRule="evenodd" d="M10.3382 6.68037C15.0775 6.19877 18.2884 8.16752 19.971 12.5866C20.2764 14.3506 20.581 16.1084 20.8851 17.8601C33.3539 17.9069 45.8225 17.9538 58.2913 18.0007C61.7851 19.1492 63.3085 21.5633 62.8616 25.2429C61.7529 31.8948 60.6748 38.5511 59.6273 45.2116C58.428 48.9189 55.8733 50.8877 51.9632 51.1179C42.9646 51.0033 33.9646 50.9329 24.9632 50.9069C22.1916 50.2914 20.5744 48.5806 20.1116 45.7741C18.5909 35.1294 17.044 24.4887 15.471 13.8522C15.0293 12.6606 14.209 11.8402 13.0101 11.3913C12.1237 11.2588 11.233 11.1651 10.3382 11.1101C9.07507 10.481 8.62975 9.47322 9.00225 8.08662C9.28664 7.45099 9.73195 6.98225 10.3382 6.68037ZM44.6507 28.196C46.0866 28.2726 46.8834 29.0226 47.0413 30.446C46.9986 30.9542 46.8345 31.423 46.5491 31.8522C43.7092 34.7391 40.8264 37.575 37.9007 40.3601C37.1251 40.6748 36.375 40.6279 35.6507 40.2194C34.1273 38.696 32.6038 37.1725 31.0804 35.6491C30.3628 33.8031 30.9721 32.6781 32.9085 32.2741C33.4081 32.3 33.8534 32.464 34.2444 32.7663C35.1117 33.6335 35.9788 34.5006 36.846 35.3679C39.0725 33.1413 41.2992 30.9147 43.5257 28.6882C43.8995 28.4803 44.2745 28.3162 44.6507 28.196Z" fill="url(#paint0_linear_1406_2280)" />
                    <path opacity="0.956" fillRule="evenodd" clipRule="evenodd" d="M26.0841 59.1326C28.852 58.9495 30.4459 60.2151 30.8653 62.9295C30.449 65.6649 28.8552 66.907 26.0841 66.656C23.7244 65.8048 22.8103 64.1408 23.3419 61.6638C23.8435 60.3508 24.7576 59.5071 26.0841 59.1326Z" fill="url(#paint1_linear_1406_2280)" />
                    <path opacity="0.956" fillRule="evenodd" clipRule="evenodd" d="M50.1336 59.1336C52.4086 58.8755 53.932 59.8131 54.7039 61.9461C55.0577 64.8016 53.8154 66.3953 50.9774 66.7273C48.2758 66.4396 47.0337 64.9396 47.2508 62.2273C47.6126 60.6236 48.5737 59.5924 50.1336 59.1336Z" fill="url(#paint2_linear_1406_2280)" />
                    <defs>
                      <linearGradient id="paint0_linear_1406_2280" x1="35.9063" y1="6.60937" x2="35.9063" y2="51.1179" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9D2CFF" />
                        <stop offset="1" stopColor="#5E1A99" />
                      </linearGradient>
                      <linearGradient id="paint1_linear_1406_2280" x1="27.0303" y1="59.1152" x2="27.0303" y2="66.6877" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9D2CFF" />
                        <stop offset="1" stopColor="#5E1A99" />
                      </linearGradient>
                      <linearGradient id="paint2_linear_1406_2280" x1="50.9947" y1="59.0918" x2="50.9947" y2="66.7273" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9D2CFF" />
                        <stop offset="1" stopColor="#5E1A99" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <p className="text-3xl sm:text-4xl font-bold text-white">
                  {orders.length}
                </p>
              </div>

              <p className="text-right text-white/60 font-medium text-sm sm:text-base">
                Total Orders
              </p>
            </div>

            {/* Saved Addresses */}
            <div className="gradient-border-white-top p-5 sm:p-6 hover:bg-white/5 transition-all h-[130px] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <svg width="40" height="40" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.997" fillRule="evenodd" clipRule="evenodd" d="M20.8828 4.42871C30.9142 4.40527 40.9454 4.42871 50.9766 4.49903C54.9679 5.34972 57.4289 7.76378 58.3594 11.7412C58.4532 29.835 58.4532 47.9287 58.3594 66.0225C57.7304 67.2855 56.7225 67.7309 55.3359 67.3584C48.8506 64.5143 42.3818 61.6314 35.9297 58.71C29.4775 61.6314 23.0088 64.5143 16.5234 67.3584C15.1369 67.7309 14.129 67.2855 13.5 66.0225C13.4062 47.9287 13.4062 29.835 13.5 11.7412C14.4557 7.76192 16.9166 5.32442 20.8828 4.42871ZM24.6797 13.4287C32.1798 13.4053 39.6799 13.4287 47.1797 13.499C48.8451 13.7587 49.5248 14.7196 49.2188 16.3818C48.853 17.3034 48.1733 17.7955 47.1797 17.8584C39.6797 17.9522 32.1796 17.9522 24.6797 17.8584C22.7329 17.4102 22.147 16.2617 22.9219 14.4131C23.409 13.8773 23.995 13.5491 24.6797 13.4287Z" fill="url(#paint0_linear_1406_2288)" />
                    <defs>
                      <linearGradient id="paint0_linear_1406_2288" x1="35.9297" y1="4.41992" x2="35.9297" y2="67.4856" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3A61FF" />
                        <stop offset="1" stopColor="#233A99" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <p className="text-3xl sm:text-4xl font-bold text-white">
                  {addresses.length}
                </p>
              </div>

              <p className="text-right text-white/60 font-medium text-sm sm:text-base">
                Saved Addresses
              </p>
            </div>

            {/* Account Type */}
            <div className="gradient-border-white-top p-5 sm:p-6 hover:bg-white/5 transition-all h-[130px] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <svg width="40" height="40" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_1406_2292)">
                      <path opacity="0.991" fillRule="evenodd" clipRule="evenodd" d="M33.2603 -0.0703125C34.7134 -0.0703125 36.1666 -0.0703125 37.6197 -0.0703125C44.6927 1.16577 49.4973 5.15014 52.0337 11.8828C54.2499 20.8024 51.5077 27.7163 43.8072 32.625C38.8021 35.0708 33.6926 35.3052 28.4791 33.3281C20.997 29.5861 17.5517 23.5157 18.1431 15.1172C19.0545 9.23801 22.0779 4.80832 27.2134 1.82812C29.1344 0.835951 31.1499 0.203138 33.2603 -0.0703125Z" fill="url(#paint0_linear_1406_2292)" />
                      <path opacity="0.994" fillRule="evenodd" clipRule="evenodd" d="M55.3349 71.9292C42.3506 71.9292 29.3661 71.9292 16.3818 71.9292C11.8893 71.3519 8.67834 69.0081 6.74901 64.8979C6.32386 63.8569 6.04261 62.7788 5.90526 61.6635C5.52758 56.25 6.13695 50.9533 7.73338 45.7729C8.78163 42.4778 10.5863 39.6888 13.1474 37.4057C16.0319 35.2256 19.2663 34.3819 22.8506 34.8745C24.3979 35.7416 25.8979 36.6791 27.3506 37.687C32.7134 40.799 38.151 40.9396 43.6631 38.1088C45.3738 36.9955 47.1082 35.9173 48.8662 34.8745C54.6324 34.3006 59.0152 36.4803 62.0146 41.4135C64.2648 45.6788 65.5304 50.2257 65.8115 55.0542C66.0139 57.3065 66.0139 59.5565 65.8115 61.8042C64.6838 67.6291 61.1916 71.0041 55.3349 71.9292Z" fill="url(#paint1_linear_1406_2292)" />
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_1406_2292" x1="35.4274" y1="-0.0703125" x2="35.4274" y2="34.6537" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF1F1F" />
                        <stop offset="1" stopColor="#991313" />
                      </linearGradient>
                      <linearGradient id="paint1_linear_1406_2292" x1="35.8801" y1="34.7383" x2="35.8801" y2="71.9292" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF1F1F" />
                        <stop offset="1" stopColor="#991313" />
                      </linearGradient>
                      <clipPath id="clip0_1406_2292">
                        <rect width="72" height="72" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>

                </div>

                <p className="text-xl sm:text-2xl font-bold text-white capitalize">
                  {user?.role || "User"}
                </p>
              </div>

              <p className="text-right text-white/60 font-medium text-sm sm:text-base">
                Account Type
              </p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="gradient-border-white-top overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-white/10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-8 inline-block mb-6">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-4">No orders yet</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4 p-4 sm:p-6">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="gradient-border-white-top rounded-lg overflow-hidden">
                      {/* Compact Order Header */}
                      <div
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/10"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-2 shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm sm:text-base break-words">
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs sm:text-sm text-white/60 mt-1">
                              {formatDate(order.created_at)} • {order.item_count} item(s)
                            </p>
                            <p className="text-xs sm:text-sm text-white/60">
                              {order.payment_method.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <p className="font-bold text-lg sm:text-xl text-white whitespace-nowrap">
                              {formatPrice(order.total_amount)}
                            </p>
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${order.status.toLowerCase() === 'pending'
                              ? 'bg-yellow-500/10 border-yellow-400/50 text-yellow-400'
                              : order.status.toLowerCase() === 'processing'
                                ? 'bg-blue-500/10 border-blue-400/50 text-blue-400'
                                : order.status.toLowerCase() === 'completed'
                                  ? 'bg-green-500/10 border-green-400/50 text-green-400'
                                  : 'bg-red-500/10 border-red-400/50 text-red-400'
                              }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="bg-white/10 border border-white/20 rounded-full p-2 shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            ) : (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="border-t border-white/10 p-4 sm:p-6 space-y-4">
                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                                <Package className="w-4 h-4 mr-2 text-purple-400" />
                                Items Ordered
                              </h4>
                              <div className="space-y-3">
                                {order.order_items.map((item, index) => (
                                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <Link
                                      href={`/products/${item.product_id}`}
                                      className="flex items-center gap-3 flex-1 min-w-0"
                                    >
                                      <div className="flex-shrink-0 relative">
                                        {item.image_url ? (
                                          <>
                                            <img
                                              src={item.image_url}
                                              alt={item.product_name}
                                              className="w-12 h-12 object-cover rounded-md border border-white/20 group-hover:border-purple-400/50 transition-colors"
                                              loading="lazy"
                                              onLoad={() => {
                                                console.log('✅ Image loaded successfully:', item.image_url);
                                                const key = `${item.variant_id}-${item.product_id}`;
                                                setLoadingImages(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(key);
                                                  return newSet;
                                                });
                                              }}
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                console.error('❌ Failed to load image:', item.image_url);
                                                target.onerror = null;
                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjOUIxMDZGIi8+CjxwYXRoIGQ9Ik0yNCAzMkMzMS4xNzk3IDMyIDM2IDI3LjE3OTcgMzYgMjBDMzYgMTIuODIwMyAzMS4xNzk3IDggMjQgOEMxNi44MjAzIDggMTIgMTIuODIwMyAxMiAyMEMxMiAyNy4xNzk3IDE2LjgyMDMgMzIgMjQgMzJaIiBmaWxsPSIjNjM2NkY3Ii8+CjxwYXRoIGQ9Ik0yNCAyOEMyOS41MjI4IDI4IDM0IDIzLjUyMjggMzQgMThDMzQgMTIuNDc3MiAyOS41MjI4IDggMjQgOEMxOC40NzcyIDggMTQgMTIuNDc3MiAxNCAxOEMxNCAyMy41MjI4IDE4LjQ3NzIgMjggMjQgMjhaIiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+';
                                                const key = `${item.variant_id}-${item.product_id}`;
                                                setLoadingImages(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(key);
                                                  return newSet;
                                                });
                                              }}
                                              style={{ display: loadingImages.has(`${item.variant_id}-${item.product_id}`) ? 'none' : 'block' }}
                                            />
                                            {loadingImages.has(`${item.variant_id}-${item.product_id}`) && (
                                              <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center animate-pulse">
                                                <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Package className="w-6 h-6 text-white/40" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white/90 truncate text-sm group-hover:text-white transition-colors">
                                          {item.product_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                                          {item.size && <span>Size: {item.size}</span>}
                                          {item.color && <span>Color: {item.color}</span>}
                                        </div>
                                        <p className="text-xs text-white/50">
                                          Qty: {item.quantity} × {formatPrice(parseFloat(item.price))}
                                        </p>
                                      </div>
                                    </Link>
                                    <div className="text-right">
                                      <p className="font-semibold text-white/90 text-sm">
                                        {formatPrice(parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity))}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Order Summary */}
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h5 className="text-sm font-semibold text-white mb-3">Order Summary</h5>
                            <div className="space-y-2 text-sm text-white/70">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="text-white/90">
                                  {formatPrice(
                                    order.order_items?.reduce((sum, item) =>
                                      sum + (parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity)), 0
                                    ) || 0
                                  )}
                                </span>
                              </div>
                              {order.shipping_cost && order.shipping_cost > 0 && (
                                <div className="flex justify-between">
                                  <span>Shipping:</span>
                                  <span className="text-white/90">{formatPrice(order.shipping_cost)}</span>
                                </div>
                              )}
                              {(order.tax_amount > 0 || order.admin_fee > 0) && (
                                <div className="flex justify-between">
                                  <span>Tax & Fees:</span>
                                  <span className="text-white/90">
                                    {formatPrice((order.tax_amount || 0) + (order.admin_fee || 0))}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-2 border-t border-white/10 text-white">
                                <span>Total:</span>
                                <span className="text-orange-400">{formatPrice(order.total_amount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-green-400" />
                                Shipping Address
                              </h5>
                              <div className="text-sm text-white/70 space-y-1">
                                <p className="font-medium text-white/90">{order.shipping_address.name}</p>
                                <p>{order.shipping_address.address1}</p>
                                {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
                                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                                <p>{order.shipping_address.country}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="gradient-border-white-top overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Saved Addresses</h3>
              <Link
                href="/addresses"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Address</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
            {addresses.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-8 inline-block mb-6">
                  <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-4">No addresses saved</p>
                <Link
                  href="/addresses"
                  className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
                >
                  Add Your First Address
                </Link>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="gradient-border-white-top rounded-lg p-4 sm:p-6 hover:bg-white/5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white text-base sm:text-lg mb-2">{address.name}</p>
                        <p className="text-white/70 font-medium text-xs sm:text-sm">{address.address1}</p>
                        {address.address2 && <p className="text-white/70 font-medium text-xs sm:text-sm">{address.address2}</p>}
                        <p className="text-white/70 font-medium text-xs sm:text-sm">
                          {address.city}, {address.state} {address.zip}
                        </p>
                        <p className="text-white/70 font-medium text-xs sm:text-sm">{address.country}</p>
                        {address.phone && <p className="text-white/70 font-medium text-xs sm:text-sm mt-2">{address.phone}</p>}
                      </div>
                      <div className="text-right flex flex-col gap-2">
                        {address.is_default && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-400/50">
                            ✓ Default
                          </span>
                        )}
                        <p className="text-xs font-semibold text-white/70 capitalize bg-white/10 border border-white/20 rounded-lg px-2 py-1">
                          {address.address_type} address
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}