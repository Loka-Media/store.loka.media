'use client';

import { useEffect, useState } from 'react';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  formatPrice, 
  Address, 
  addressAPI
} from '@/lib/api';
import { 
  CreditCard, 
  MapPin, 
  Package, 
  ArrowLeft, 
  Plus, 
  Check, 
  ShoppingCart, 
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3001';

// Unified checkout API
const unifiedCheckoutAPI = {
  createGuestCheckout: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/guest/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create guest checkout');
    return response.json();
  },

  processCheckout: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to process checkout');
    return response.json();
  },

  getOrderStatus: async (orderNumber: string, email?: string) => {
    const url = `${API_BASE_URL}/api/unified-checkout/order/${orderNumber}/status${email ? `?email=${email}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get order status');
    return response.json();
  },

  createPayPalOrder: async (amount: number, orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), orderNumber })
    });
    if (!response.ok) throw new Error('Failed to create PayPal order');
    return response.json();
  },

  capturePayPalPayment: async (paypalOrderId: string, orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/paypal/capture-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paypalOrderId, orderNumber })
    });
    if (!response.ok) throw new Error('Failed to capture PayPal payment');
    return response.json();
  }
};

type CheckoutStep = 'shipping' | 'payment' | 'review' | 'login' | 'complete';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export default function UnifiedCheckoutPage() {
  const { items, summary, clearCart } = useGuestCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [loading, setLoading] = useState(false);
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  
  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormType, setAddressFormType] = useState<'shipping' | 'billing'>('shipping');
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    is_default: false,
    address_type: 'shipping'
  });

  // Payment and login
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [guestCheckoutSession, setGuestCheckoutSession] = useState<any>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // Load addresses if user is authenticated
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, router]);

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getAddresses();
      setAddresses(response.addresses);
      
      const defaultShipping = response.addresses.find((addr: Address) => 
        addr.is_default && (addr.address_type === 'shipping' || addr.address_type === 'both')
      );
      const defaultBilling = response.addresses.find((addr: Address) => 
        addr.is_default && (addr.address_type === 'billing' || addr.address_type === 'both')
      );
      
      if (defaultShipping) setSelectedShippingAddress(defaultShipping);
      if (defaultBilling) setSelectedBillingAddress(defaultBilling);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  // Check if cart has mixed products
  const hasMixedProducts = () => {
    if (!items || items.length === 0) return false;
    
    const shopifyItems = items.filter(item => 
      item.shopify_variant_id || (item as { source?: string }).source === 'shopify'
    );
    const printfulItems = items.filter(item => 
      !item.shopify_variant_id && (item as { source?: string }).source !== 'shopify'
    );
    
    return shopifyItems.length > 0 && printfulItems.length > 0;
  };

  const handleAddAddress = async () => {
    try {
      setLoading(true);
      await addressAPI.createAddress({
        ...newAddress,
        address_type: addressFormType
      });
      
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setNewAddress({
        name: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        is_default: false,
        address_type: 'shipping'
      });
      await fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 'shipping') {
      if (!selectedShippingAddress && !isAuthenticated) {
        // For guest users, validate shipping info
        if (!newAddress.name || !newAddress.address1 || !newAddress.city || !newAddress.zip) {
          toast.error('Please fill in all required shipping information');
          return;
        }
        if (!customerInfo.name || !customerInfo.email) {
          toast.error('Please fill in your contact information');
          return;
        }
      } else if (!selectedShippingAddress && isAuthenticated) {
        toast.error('Please select a shipping address');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setCurrentStep('login');
    } else if (currentStep === 'login') {
      await processOrder();
    }
  };

  const processOrder = async () => {
    try {
      setLoading(true);

      let checkoutData: any;
      let totalAmount: number;

      if (isAuthenticated) {
        // Authenticated user checkout
        if (!selectedShippingAddress) {
          toast.error('Please select a shipping address');
          return;
        }

        const subtotal = parseFloat(summary.subtotal.replace('$', ''));
        const shipping = 5.99;
        const tax = subtotal * 0.08;
        totalAmount = subtotal + shipping + tax;

        checkoutData = {
          shippingAddress: selectedShippingAddress,
          billingAddress: useSameAddress ? selectedShippingAddress : selectedBillingAddress,
          paymentMethod,
          customerNotes: ''
        };

      } else {
        // Guest checkout flow
        if (!customerInfo.name || !customerInfo.email || !newAddress.address1 || !newAddress.city || !newAddress.zip) {
          toast.error('Please fill in all required information');
          return;
        }

        if (!guestCheckoutSession) {
          // Create guest session first
          const sessionData = await unifiedCheckoutAPI.createGuestCheckout({
            email: customerInfo.email,
            customerInfo,
            shippingAddress: {
              name: newAddress.name || customerInfo.name,
              address1: newAddress.address1,
              address2: newAddress.address2,
              city: newAddress.city,
              state: newAddress.state,
              zip: newAddress.zip,
              country: newAddress.country,
              phone: newAddress.phone || customerInfo.phone
            },
            billingAddress: useSameAddress ? undefined : {
              // Billing address logic if needed
            },
            cartItems: items.map(item => ({
              product_id: item.id,
              variant_id: item.variant_id,
              product_name: item.product_name,
              price: item.price,
              quantity: item.quantity,
              image_url: item.image_url || item.thumbnail_url,
              size: item.size,
              color: item.color,
              source: (item as { source?: string }).source || 'printful'
            }))
          });

          setGuestCheckoutSession(sessionData.session);
          totalAmount = parseFloat(sessionData.summary.total.replace('$', ''));
        } else {
          const subtotal = parseFloat(summary.subtotal.replace('$', ''));
          const shipping = 5.99;
          const tax = subtotal * 0.08;
          totalAmount = subtotal + shipping + tax;
        }

        checkoutData = {
          sessionToken: guestCheckoutSession?.session_token,
          paymentMethod,
          customerNotes: ''
        };

        // Add login credentials if provided
        if (showLoginForm && loginCredentials.email && loginCredentials.password) {
          checkoutData.loginCredentials = loginCredentials;
        }
      }

      // Create order in our system first (with pending payment)
      const orderResult = await unifiedCheckoutAPI.processCheckout(checkoutData);
      
      // Store order number for PayPal integration
      setCurrentOrderNumber(orderResult.order.orderNumber);
      setCompletedOrder(orderResult.order);

      if (paymentMethod === 'paypal') {
        // PayPal payment will be handled by PayPal buttons
        // Don't set complete step yet, wait for payment
        toast.success('Order created! Please complete payment with PayPal.');
      } else {
        // Other payment methods or demo mode
        setCurrentStep('complete');
        await clearCart();
      }

    } catch (error: any) {
      console.error('Process order error:', error);
      toast.error(error.message || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const renderShippingStep = () => (
    <div className="space-y-6">
      {/* Customer Information (for guest users) */}
      {!isAuthenticated && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Shipping Address
          </h3>
          {isAuthenticated && (
            <button
              onClick={() => {
                if (addresses.length >= 6) {
                  toast.error('Maximum 6 addresses allowed per user');
                  return;
                }
                setAddressFormType('shipping');
                setShowAddressForm(true);
              }}
              disabled={addresses.length >= 6}
              className={`text-sm font-medium flex items-center ${
                addresses.length >= 6
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-500'
              }`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New {addresses.length >= 6 ? '(Limit: 6)' : ''}
            </button>
          )}
        </div>

        {isAuthenticated ? (
          // Authenticated users select from saved addresses
          addresses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No addresses found. Please add a shipping address.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.filter(addr => addr.address_type === 'shipping' || addr.address_type === 'both').map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedShippingAddress?.id === address.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedShippingAddress(address)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{address.name}</p>
                      <p className="text-gray-600">{address.address1}</p>
                      {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                      {address.phone && <p className="text-gray-600">{address.phone}</p>}
                    </div>
                    {selectedShippingAddress?.id === address.id && (
                      <Check className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Guest users enter address details
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <input
              type="text"
              placeholder="Address Line 1"
              value={newAddress.address1}
              onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={newAddress.address2}
              onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <input
                type="text"
                placeholder="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="ZIP Code"
                value={newAddress.zip}
                onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <select
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
            
            <input
              type="tel"
              placeholder="Phone (Optional)"
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2" />
        Payment Method
      </h3>
      
      <div className="space-y-4">
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            value="paypal"
            checked={paymentMethod === 'paypal'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">PayPal</span>
            <span className="inline-block ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Sandbox Mode</span>
            <p className="text-xs text-gray-500 mt-1">Real PayPal integration - Safe for development testing</p>
          </div>
        </label>

        {hasMixedProducts() && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <ShoppingCart className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Mixed Cart Detected</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your cart contains both Shopify and Printful products. All payments will be processed through our unified system.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Review</h3>
        
        {/* Order Summary */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                <Image
                  src={item.image_url || item.thumbnail_url || '/placeholder-product.svg'}
                  alt={item.product_name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product_name}
                </p>
                <p className="text-sm text-gray-500">
                  {item.size} • {item.color}
                </p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatPrice(item.total_price)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-600">Subtotal</dt>
            <dd className="text-sm font-medium text-gray-900">{formatPrice(summary.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-600">Shipping</dt>
            <dd className="text-sm font-medium text-gray-900">$5.99</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-600">Tax</dt>
            <dd className="text-sm font-medium text-gray-900">
              ${(parseFloat(summary.subtotal.replace('$', '')) * 0.08).toFixed(2)}
            </dd>
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <dt className="text-base font-medium text-gray-900">Total</dt>
            <dd className="text-base font-medium text-gray-900">
              ${(parseFloat(summary.subtotal.replace('$', '')) + 5.99 + (parseFloat(summary.subtotal.replace('$', '')) * 0.08)).toFixed(2)}
            </dd>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Demo Payment System</p>
            <p className="text-xs text-blue-700 mt-1">
              This is a demonstration checkout system. No real payments will be processed. 
              Your order will be stored for admin review and processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoginStep = () => {
    const totalAmount = parseFloat(summary.subtotal.replace('$', '')) + 5.99 + (parseFloat(summary.subtotal.replace('$', '')) * 0.08);

    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Complete Your Order
          </h3>
          
          <p className="text-gray-600 mb-6">
            Complete your order with PayPal, or sign in / create an account for faster future checkouts.
          </p>

          <div className="space-y-4">
            {/* PayPal Payment Section */}
            {paymentMethod === 'paypal' && !completedOrder && (
              <div className="space-y-4">
                <button
                  onClick={() => processOrder()}
                  disabled={loading}
                  className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Creating Order...
                    </>
                  ) : (
                    'Create Order & Pay with PayPal'
                  )}
                </button>
              </div>
            )}

            {/* PayPal Buttons - Show after order is created */}
            {completedOrder && currentOrderNumber && paymentMethod === 'paypal' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Order Created:</strong> {completedOrder.orderNumber}<br/>
                    <strong>Total:</strong> ${totalAmount.toFixed(2)}<br/>
                    Please complete payment below:
                  </p>
                </div>
                
                {isPending ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading PayPal...</p>
                  </div>
                ) : isRejected ? (
                  <div className="text-center py-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">PayPal failed to load. Please refresh the page.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <PayPalButtons
                      style={{
                        layout: 'vertical',
                        color: 'blue',
                        shape: 'rect',
                        label: 'paypal',
                        height: 45
                      }}
                      createOrder={async (data, actions) => {
                        try {
                          console.log('Creating PayPal order for amount:', totalAmount);
                          const result = await unifiedCheckoutAPI.createPayPalOrder(totalAmount, currentOrderNumber);
                          console.log('PayPal order created:', result.paypalOrderId);
                          return result.paypalOrderId;
                        } catch (error) {
                          console.error('PayPal createOrder error:', error);
                          toast.error('Failed to create PayPal order');
                          throw error;
                        }
                      }}
                      onApprove={async (data, actions) => {
                        try {
                          console.log('PayPal payment approved:', data.orderID);
                          setLoading(true);
                          
                          const result = await unifiedCheckoutAPI.capturePayPalPayment(data.orderID, currentOrderNumber);
                          console.log('PayPal payment captured:', result);
                          
                          toast.success('Payment successful!');
                          setCurrentStep('complete');
                          await clearCart();
                          
                        } catch (error: any) {
                          console.error('PayPal onApprove error:', error);
                          toast.error('Payment failed: ' + (error.message || 'Unknown error'));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onError={(error) => {
                        console.error('PayPal error:', error);
                        toast.error('PayPal payment failed. Please try again.');
                      }}
                      onCancel={(data) => {
                        console.log('PayPal payment cancelled:', data);
                        toast('Payment cancelled. You can try again.');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Non-PayPal payment methods */}
            {paymentMethod !== 'paypal' && (
              <button
                onClick={() => processOrder()}
                disabled={loading}
                className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Processing Order...
                  </>
                ) : (
                  'Continue as Guest'
                )}
              </button>
            )}

          {/* Or divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Login/Register Form */}
          {!showLoginForm ? (
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In or Create Account
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsNewUser(false)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                    !isNewUser 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsNewUser(true)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                    isNewUser 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your email"
                    />
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                      className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your password"
                    />
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isNewUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Confirm your password"
                      />
                      <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => processOrder()}
                    disabled={loading || !loginCredentials.email || !loginCredentials.password || (isNewUser && loginCredentials.password !== confirmPassword)}
                    className="flex-1 bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `${isNewUser ? 'Create Account &' : 'Sign In &'} Complete Order`}
                  </button>
                  
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. We've received your payment and will process your order shortly.
        </p>
        
        {completedOrder && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-left space-y-2">
              <p><strong>Order Number:</strong> {completedOrder.orderNumber}</p>
              <p><strong>Order Type:</strong> {completedOrder.orderType}</p>
              <p><strong>Total:</strong> ${completedOrder.total}</p>
              <p><strong>Status:</strong> {completedOrder.status}</p>
              <p><strong>Payment ID:</strong> {completedOrder.paymentId}</p>
            </div>
          </div>
        )}

        <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your payment is being verified by our admin team</li>
            <li>• You'll receive an email confirmation shortly</li>
            <li>• Admin will process and fulfill your order</li>
            <li>• You'll be notified when items are shipped</li>
          </ul>
        </div>

        <div className="flex space-x-4 justify-center">
          <Link
            href="/products"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping
          </Link>
          
          {completedOrder && (
            <button
              onClick={() => router.push(`/orders/${completedOrder.id}`)}
              className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors"
            >
              View Order
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start adding some products to your cart!</p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStep === 'complete' ? 'Order Complete' : 'Checkout'}
            </h1>
            {currentStep !== 'complete' && (
              <p className="text-gray-600 mt-1">
                Step {['shipping', 'payment', 'review', 'login'].indexOf(currentStep) + 1} of 4
              </p>
            )}
          </div>
          {currentStep !== 'complete' && (
            <Link
              href="/cart"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
          )}
        </div>

        {currentStep !== 'complete' && (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            {/* Checkout Form */}
            <div className="lg:col-span-7">
              {currentStep === 'shipping' && renderShippingStep()}
              {currentStep === 'payment' && renderPaymentStep()}
              {currentStep === 'review' && renderReviewStep()}
              {currentStep === 'login' && renderLoginStep()}
            </div>

            {/* Order Summary Sidebar */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-4 py-6 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Summary
                  </h2>
                  
                  <div className="mt-6 space-y-4">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 border border-gray-200 rounded-md overflow-hidden">
                          <Image
                            src={item.image_url || item.thumbnail_url || '/placeholder-product.svg'}
                            alt={item.product_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.size} • {item.color} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {items.length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Subtotal</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatPrice(summary.subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Shipping</dt>
                      <dd className="text-sm font-medium text-gray-900">$5.99</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Tax (8%)</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        ${(parseFloat(summary.subtotal.replace('$', '')) * 0.08).toFixed(2)}
                      </dd>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-gray-900">Total</dt>
                      <dd className="text-base font-medium text-gray-900">
                        ${(parseFloat(summary.subtotal.replace('$', '')) + 5.99 + (parseFloat(summary.subtotal.replace('$', '')) * 0.08)).toFixed(2)}
                      </dd>
                    </div>
                  </div>

                  {currentStep !== 'login' && (
                    <div className="mt-6">
                      <button
                        onClick={handleNextStep}
                        disabled={loading}
                        className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processing...' : 
                         currentStep === 'shipping' ? 'Continue to Payment' :
                         currentStep === 'payment' ? 'Review Order' :
                         currentStep === 'review' ? 'Complete Order' : 'Continue'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && renderCompleteStep()}

        {/* Add Address Modal */}
        {showAddressForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add {addressFormType === 'shipping' ? 'Shipping' : 'Billing'} Address
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={newAddress.address1}
                    onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={newAddress.address2}
                    onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    
                    <select
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="Phone (Optional)"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Set as default {addressFormType} address
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAddress}
                    disabled={loading || !newAddress.name || !newAddress.address1 || !newAddress.city || !newAddress.zip}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Address'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
}