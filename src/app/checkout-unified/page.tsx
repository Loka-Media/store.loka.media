'use client';

import { useState, useEffect } from 'react';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ShoppingCart, MapPin, Package, ArrowLeft, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import StripePaymentForm from '@/components/StripePaymentForm';
import { addressAPI } from '@/lib/api';

// Printful countries and states data
interface PrintfulState {
  code: string;
  name: string;
}

interface PrintfulCountry {
  code: string;
  name: string;
  states: PrintfulState[];
  region: string;
}

// ZIP code lookup utility using multiple services
const lookupZipCode = async (zipCode: string, countryCode: string = 'US') => {
  if (!zipCode || zipCode.length < 4) return null;
  
  try {
    // First try Zippopotam.us for US ZIP codes
    if (countryCode === 'US' && zipCode.length === 5) {
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation']
        };
      }
    }
    
    // Fallback: Canadian postal codes
    if (countryCode === 'CA' && zipCode.length >= 6) {
      const response = await fetch(`https://api.zippopotam.us/ca/${zipCode.substring(0, 3)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation']
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn('ZIP code lookup failed:', error);
    return null;
  }
};

// Get Printful countries and states
const getPrintfulCountries = async (): Promise<PrintfulCountry[]> => {
  try {
    const response = await fetch('https://api.printful.com/countries');
    if (!response.ok) throw new Error('Failed to fetch countries');
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to fetch Printful countries:', error);
    // Fallback to basic US/CA data if Printful API fails
    return [
      {
        code: 'US',
        name: 'United States',
        states: [
          { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
          { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
          { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
          { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
          { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
          { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
          { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
          { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
          { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
          { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
          { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
          { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
          { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
          { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
          { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
          { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
          { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
        ],
        region: 'north_america'
      },
      {
        code: 'CA',
        name: 'Canada',
        states: [
          { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
          { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
          { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
          { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
          { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
          { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
          { code: 'YT', name: 'Yukon' }
        ],
        region: 'north_america'
      }
    ];
  }
};

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://catalog.loka.media' 
  : 'http://localhost:3003';

interface CheckoutData {
  email: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  cartItems: Array<{
    product_id: string;
    variant_id: string;
    product_name: string;
    price: string;
    quantity: number;
    image_url: string;
    size: string;
    color: string;
    source?: string;
  }>;
}

interface ProcessCheckoutData {
  sessionToken: string;
  paymentMethod: string;
  loginCredentials?: {
    email: string;
    password: string;
  };
}

interface Address {
  id: number;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  is_default?: boolean;
  address_type?: string;
}

interface User {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const unifiedCheckoutAPI = {
  createGuestCheckout: async (data: CheckoutData) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/guest/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create guest checkout');
    return response.json();
  },

  processCheckout: async (data: ProcessCheckoutData) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to process checkout');
    return response.json();
  },

  createStripePaymentIntent: async (amount: number, orderNumber: string, customerEmail?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), orderNumber, customerEmail })
    });
    if (!response.ok) throw new Error('Failed to create Stripe payment intent');
    return response.json();
  },

  confirmStripePayment: async (paymentIntentId: string, orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, orderNumber })
    });
    if (!response.ok) throw new Error('Failed to confirm Stripe payment');
    return response.json();
  }
};

export default function UnifiedCheckoutPage() {
  const { items, summary, clearCart } = useGuestCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'complete' | 'cart-merge'>('info');
  const [orderData, setOrderData] = useState<{ orderNumber: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  
  // Address management
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  
  // Cart merge state
  const [cartMergeData, setCartMergeData] = useState<{
    userCartCount: number;
    guestCartCount: number;
    token: string;
    userInfo: User;
  } | null>(null);

  const [customerInfo, setCustomerInfo] = useState({
    name: '', email: '', phone: '', address1: '', address2: '',
    city: '', state: '', zip: '', country: 'US'
  });
  
  // Printful countries and states
  const [printfulCountries, setPrintfulCountries] = useState<PrintfulCountry[]>([]);
  const [availableStates, setAvailableStates] = useState<PrintfulState[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [wantsToSignup, setWantsToSignup] = useState(false);
  const [signupInfo, setSignupInfo] = useState({ password: '', confirmPassword: '' });
  const [loginInfo, setLoginInfo] = useState({ email: '', password: '' });

  // Check if user is already logged in and pre-fill info
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoggedInUser(true);
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      });
      console.log('✅ User already logged in, pre-filling info:', user.name);
      loadUserAddresses();
    } else {
      setIsLoggedInUser(false);
      setSavedAddresses([]);
      setSelectedAddressId(null);
    }
  }, [isAuthenticated, user]);

  // Load Printful countries on component mount
  useEffect(() => {
    const loadPrintfulCountries = async () => {
      const countries = await getPrintfulCountries();
      setPrintfulCountries(countries);
      
      // Set initial states for US
      const usCountry = countries.find(c => c.code === 'US');
      if (usCountry) {
        setAvailableStates(usCountry.states);
      }
    };
    
    loadPrintfulCountries();
  }, []);

  // Update available states when country changes
  useEffect(() => {
    const selectedCountry = printfulCountries.find(c => c.code === customerInfo.country);
    if (selectedCountry) {
      setAvailableStates(selectedCountry.states);
      // Clear state if country changed
      if (customerInfo.state && !selectedCountry.states.find(s => s.code === customerInfo.state)) {
        setCustomerInfo(prev => ({ ...prev, state: '' }));
      }
    }
  }, [customerInfo.country, printfulCountries]);

  const loadUserAddresses = async () => {
    try {
      const addresses = await addressAPI.getAddresses();
      setSavedAddresses(addresses.addresses || []);
      
      // Auto-select default shipping address if available
      const defaultShipping = addresses.addresses?.find((addr: Address) => 
        addr.is_default && (addr.address_type === 'shipping' || addr.address_type === 'both')
      );
      
      if (defaultShipping) {
        setSelectedAddressId(defaultShipping.id);
        setCustomerInfo(prev => ({
          ...prev,
          address1: defaultShipping.address1,
          address2: defaultShipping.address2 || '',
          city: defaultShipping.city,
          state: defaultShipping.state || '',
          zip: defaultShipping.zip,
          country: defaultShipping.country
        }));
        console.log('✅ Loaded default shipping address');
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id);
    setCustomerInfo(prev => ({
      ...prev,
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state || '',
      zip: address.zip,
      country: address.country
    }));
    setShowNewAddressForm(false);
    console.log('✅ Selected saved address:', address.id);
  };

  const handleNewAddress = () => {
    setSelectedAddressId(null);
    setCustomerInfo(prev => ({
      ...prev,
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }));
    setShowNewAddressForm(true);
    console.log('✅ Creating new address');
  };

  // Handle ZIP code changes with auto-fill
  const handleZipCodeChange = async (zipCode: string) => {
    // Update ZIP code immediately
    setCustomerInfo(prev => ({ ...prev, zip: zipCode }));
    
    // Auto-fill city and state for valid ZIP codes
    if (zipCode.length >= 5 && (customerInfo.country === 'US' || customerInfo.country === 'CA')) {
      setIsLoadingLocation(true);
      const locationData = await lookupZipCode(zipCode, customerInfo.country);
      
      if (locationData) {
        // Validate state against Printful states
        const validState = availableStates.find(s => s.code === locationData.state);
        
        setCustomerInfo(prev => ({
          ...prev,
          city: locationData.city,
          state: validState ? locationData.state : prev.state
        }));
        
        toast.success(`📍 Auto-filled: ${locationData.city}, ${locationData.state}`, {
          duration: 2000
        });
      }
      setIsLoadingLocation(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(summary.subtotal.replace('$', ''));
    const shipping = 5.99;
    const tax = subtotal * 0.08;
    return subtotal + shipping + tax;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      if (!loginInfo.email || !loginInfo.password) {
        toast.error('Please enter both email and password');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginInfo)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed');

      // Store auth info
      localStorage.setItem('token', result.tokens.accessToken);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Check for cart merge
      await checkCartMerge(result.tokens.accessToken, result.user);
      setShowLoginForm(false);

    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkCartMerge = async (token: string, userInfo: User) => {
    const guestCartItems = items;
    
    if (guestCartItems.length === 0) {
      toast.success('Logged in successfully!');
      fillUserInfo(userInfo);
      return;
    }

    try {
      const userCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let userCartCount = 0;
      if (userCartResponse.ok) {
        const userCart = await userCartResponse.json();
        userCartCount = userCart.items?.length || 0;
      }

      setCartMergeData({
        userCartCount,
        guestCartCount: guestCartItems.length,
        token,
        userInfo
      });
      setCurrentStep('cart-merge');

    } catch (error) {
      console.error('Cart check error:', error);
      toast.error('Login successful, but cart check failed');
    }
  };

  const fillUserInfo = (userInfo: User) => {
    if (userInfo.name) {
      setCustomerInfo(prev => ({
        ...prev,
        name: userInfo.name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || prev.phone
      }));
    }
  };

  /* const loadUserCartToGuestContext = async (token: string) => {
    try {
      const userCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userCartResponse.ok) {
        const userCart = await userCartResponse.json();
        
        // Add user cart items to guest cart context using addToCart
        if (userCart.items && userCart.items.length > 0) {
          console.log('🔄 Loading user cart items to guest context:', userCart.items.length);
          
          for (const item of userCart.items) {
            try {
              console.log('➕ Adding item to guest cart:', item.product_name);
              const success = await addToCart(item.variant_id, item.quantity);
              if (!success) {
                console.error('❌ Failed to add item:', item.product_name);
              }
            } catch (itemError) {
              console.error('❌ Error adding individual item:', itemError);
            }
          }
          
          console.log('✅ Finished loading user cart items');
        } else {
          console.log('ℹ️ No user cart items found');
        }
      }
    } catch (error) {
      console.error('❌ Error loading user cart to guest context:', error);
    }
  }; */

  const handleMergeConfirm = async () => {
    if (!cartMergeData) return;
    
    try {
      setLoading(true);
      
      // Add guest items to user cart
      for (const item of items) {
        await fetch(`${API_BASE_URL}/api/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cartMergeData.token}`
          },
          body: JSON.stringify({
            variantId: item.variant_id,
            quantity: item.quantity
          })
        });
      }

      // Clear guest cart
      await clearCart();
      
      // Small delay to ensure clear operation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Carts merged successfully! Redirecting to cart...');
      
      // Redirect to cart page and refresh
      window.location.href = '/cart';

    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge carts');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeCancel = async () => {
    if (cartMergeData) {
      await clearCart();
      
      // Small delay to ensure clear operation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Using your saved cart. Redirecting to cart...');
      
      // Redirect to cart page and refresh
      window.location.href = '/cart';
    }
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      if (!customerInfo.name || !customerInfo.email || !customerInfo.address1 || !customerInfo.city || !customerInfo.zip) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Save new address for logged-in users if they want to
      if (isLoggedInUser && saveNewAddress && showNewAddressForm) {
        try {
          const newAddress = await addressAPI.createAddress({
            name: customerInfo.name,
            address1: customerInfo.address1,
            address2: customerInfo.address2,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            country: customerInfo.country,
            phone: customerInfo.phone,
            address_type: 'shipping',
            is_default: savedAddresses.length === 0 // Make it default if it's the first address
          });
          console.log('✅ Saved new address:', newAddress.address?.id);
        } catch (addressError) {
          console.error('Failed to save address:', addressError);
          // Don't block checkout if address save fails
        }
      }

      if (wantsToSignup) {
        if (!signupInfo.password || !signupInfo.confirmPassword) {
          toast.error('Please fill in password fields to create account');
          return;
        }
        if (signupInfo.password !== signupInfo.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        if (signupInfo.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return;
        }
      }

      const sessionData = await unifiedCheckoutAPI.createGuestCheckout({
        email: customerInfo.email,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        shippingAddress: {
          name: customerInfo.name,
          address1: customerInfo.address1,
          address2: customerInfo.address2,
          city: customerInfo.city,
          state: customerInfo.state,
          zip: customerInfo.zip,
          country: customerInfo.country,
          phone: customerInfo.phone
        },
        cartItems: items.map(item => ({
          product_id: String(item.product_id),
          variant_id: String(item.variant_id),
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url || '',
          size: item.size,
          color: item.color,
          source: item.source || 'printful'
        }))
      });

      const orderResult = await unifiedCheckoutAPI.processCheckout({
        sessionToken: sessionData.session.session_token,
        paymentMethod: 'stripe',
        ...(wantsToSignup && {
          loginCredentials: {
            email: customerInfo.email,
            password: signupInfo.password
          }
        })
      });

      const totalAmount = calculateTotal();
      const paymentIntentResult = await unifiedCheckoutAPI.createStripePaymentIntent(
        totalAmount, 
        orderResult.order.orderNumber,
        customerInfo.email
      );

      if (!paymentIntentResult.success) {
        throw new Error('Failed to create payment intent');
      }

      setOrderData(orderResult.order);
      setClientSecret(paymentIntentResult.clientSecret);
      setCurrentStep('payment');
      
      if (wantsToSignup) {
        toast.success('Account created and order ready! Complete your payment to finish.');
      } else {
        toast.success('Order created! Please complete payment.');
      }

    } catch (error: unknown) {
      console.error('Order creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setCurrentStep('complete');
      await clearCart();
      toast.success('Payment successful! Order placed.');
    } catch (error) {
      console.error('Payment success handling error:', error);
    }
  };

  // Cart merge popup
  if (currentStep === 'cart-merge' && cartMergeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cart Items Found!</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Your account has {cartMergeData.userCartCount} saved items</strong>
              </p>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Guest cart has {cartMergeData.guestCartCount} items</strong>
              </p>
              <p className="text-sm text-blue-600">
                Would you like to merge both carts together?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMergeConfirm}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Merging...' : `Yes, Merge All ${cartMergeData.userCartCount + cartMergeData.guestCartCount} Items`}
              </button>
              
              <button
                onClick={handleMergeCancel}
                disabled={loading}
                className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                No, Use Only My Saved Cart ({cartMergeData.userCartCount} items)
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Merging will add guest items to your saved cart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start adding some products to your cart!</p>
          <div className="mt-6">
            <Link href="/products" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment step
  if (currentStep === 'payment' && orderData && clientSecret) {
    return <StripePaymentForm 
      orderData={orderData} 
      clientSecret={clientSecret} 
      onPaymentSuccess={handlePaymentSuccess}
      totalAmount={calculateTotal()}
      loading={loading}
      setLoading={setLoading}
    />;
  }

  // Completion step
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white shadow-sm rounded-lg p-8 max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">Thank you for your order. We&apos;ve received your payment and will process your order shortly.</p>
          
          {wantsToSignup && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                <strong>Account Created!</strong> Your account has been set up with your shipping information saved.
              </p>
            </div>
          )}
          
          {orderData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p><strong>Order Number:</strong> {orderData.orderNumber}</p>
              <p><strong>Total:</strong> ${calculateTotal().toFixed(2)}</p>
              <p><strong>Status:</strong> Payment Received</p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/products" className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout form
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          <Link href="/cart" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name *" value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                <input type="email" placeholder="Email Address *" value={customerInfo.email} onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                <div className="md:col-span-2">
                  <input type="tel" placeholder="Phone Number" value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              
              {!isLoggedInUser && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">Account Options</h3>
                    <button type="button" onClick={() => setShowLoginForm(!showLoginForm)} className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                      {showLoginForm ? 'Continue as guest' : 'Already have an account? Sign in'}
                    </button>
                  </div>

                  {showLoginForm ? (
                    <div className="space-y-4">
                      <input type="email" placeholder="Email Address" value={loginInfo.email} onChange={(e) => setLoginInfo({...loginInfo, email: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                      <input type="password" placeholder="Password" value={loginInfo.password} onChange={(e) => setLoginInfo({...loginInfo, password: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                      <button type="button" onClick={handleLogin} disabled={loading} className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                        {loading ? 'Signing in...' : 'Sign In & Continue'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center">
                        <input id="signup-checkbox" type="checkbox" checked={wantsToSignup} onChange={(e) => setWantsToSignup(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                        <label htmlFor="signup-checkbox" className="ml-2 block text-sm text-gray-900">Create an account to save this information for future orders</label>
                      </div>
                      
                      {wantsToSignup && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="password" placeholder="Password *" value={signupInfo.password} onChange={(e) => setSignupInfo({...signupInfo, password: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                          <input type="password" placeholder="Confirm Password *" value={signupInfo.confirmPassword} onChange={(e) => setSignupInfo({...signupInfo, confirmPassword: e.target.value})} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isLoggedInUser && (
                <div className="mt-6 border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 text-green-400">✓</div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Logged in as {user?.name || user?.email}
                        </p>
                        <p className="text-sm text-green-700">
                          Your information has been pre-filled. Just add your shipping address below.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                {isLoggedInUser && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleNewAddress}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses for Logged-in Users */}
              {isLoggedInUser && savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Choose a saved address:</p>
                  <div className="grid gap-3">
                    {savedAddresses.map((address: Address) => (
                      <div
                        key={address.id}
                        onClick={() => handleAddressSelect(address)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{address.name}</p>
                            <p className="text-sm text-gray-600">
                              {address.address1}
                              {address.address2 && `, ${address.address2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} {address.zip}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                            {address.is_default && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                                Default
                              </span>
                            )}
                          </div>
                          {selectedAddressId === address.id && (
                            <Check className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Form (for new addresses or guests) */}
              {(!isLoggedInUser || showNewAddressForm || savedAddresses.length === 0) && (
                <div>
                  {isLoggedInUser && showNewAddressForm && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <input
                          id="save-address"
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="save-address" className="ml-2 block text-sm text-gray-900">
                          Save this address for future orders
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <input type="text" placeholder="Address Line 1 *" value={customerInfo.address1} onChange={(e) => setCustomerInfo({ ...customerInfo, address1: e.target.value })} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                    <input type="text" placeholder="Address Line 2 (Optional)" value={customerInfo.address2} onChange={(e) => setCustomerInfo({ ...customerInfo, address2: e.target.value })} className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="City *" 
                          value={customerInfo.city} 
                          onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })} 
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                        {isLoadingLocation && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <select 
                        value={customerInfo.state} 
                        onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })} 
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select State</option>
                        {availableStates.map(state => (
                          <option key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="ZIP/Postal Code *" 
                          value={customerInfo.zip} 
                          onChange={(e) => handleZipCodeChange(e.target.value)} 
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
                          maxLength={customerInfo.country === 'CA' ? 7 : 5}
                        />
                        {isLoadingLocation && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      <select 
                        value={customerInfo.country} 
                        onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })} 
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {printfulCountries.length > 0 ? (
                          printfulCountries.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                <Package className="w-5 h-5 mr-2" />
                Order Summary
              </h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.size} • {item.color} • Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${item.total_price}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <p>Subtotal</p>
                  <p>{summary.subtotal}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>Shipping</p>
                  <p>$5.99</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>Tax (8%)</p>
                  <p>${(parseFloat(summary.subtotal.replace('$', '')) * 0.08).toFixed(2)}</p>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                  <p>Total</p>
                  <p>${calculateTotal().toFixed(2)}</p>
                </div>
              </div>
              
              <button onClick={handleCreateOrder} disabled={loading} className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Creating Order...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}