'use client';

import { useState } from 'react';
import { useGuestCart } from '@/contexts/GuestCartContext';
import Link from 'next/link';
import { ShoppingCart, CreditCard, MapPin, Package, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import StripePaymentForm from '@/components/StripePaymentForm';

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3003';

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
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'complete'>('info');
  const [orderData, setOrderData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showCartMergePopup, setShowCartMergePopup] = useState(false);
  const [cartMergeData, setCartMergeData] = useState<{
    userCartCount: number;
    guestCartCount: number;
    token: string;
    userInfo: any;
  } | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });
  const [wantsToSignup, setWantsToSignup] = useState(false);
  const [signupInfo, setSignupInfo] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });

  // If cart is empty, show empty state
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

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store auth info
      localStorage.setItem('token', result.tokens.accessToken);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Check if user has existing cart items and show merge popup
      await checkAndShowCartMergePopup(result.tokens.accessToken, result.user);
      
      setShowLoginForm(false);

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const checkAndShowCartMergePopup = async (token: string, userInfo: any) => {
    try {
      const guestCartItems = items;
      console.log('🛒 Guest cart items:', guestCartItems.length, guestCartItems);
      
      if (guestCartItems.length === 0) {
        // No guest cart items, just pre-fill user info and show success
        console.log('✅ No guest cart items, just filling user info');
        toast.success('Logged in successfully!');
        if (userInfo.name) {
          setCustomerInfo(prev => ({
            ...prev,
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone || prev.phone
          }));
        }
        return;
      }

      // Check user's existing cart
      console.log('🔍 Checking user cart with token:', token);
      const userCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 User cart response status:', userCartResponse.status);
      let userCartCount = 0;
      if (userCartResponse.ok) {
        const userCart = await userCartResponse.json();
        userCartCount = userCart.items?.length || 0;
        console.log('🛍️ User cart items count:', userCartCount, userCart.items);
      }

      console.log('🎯 Setting cart merge data:', {
        userCartCount,
        guestCartCount: guestCartItems.length,
        showPopup: true
      });

      // Set cart merge data and show popup
      setCartMergeData({
        userCartCount,
        guestCartCount: guestCartItems.length,
        token,
        userInfo
      });
      setShowCartMergePopup(true);

      console.log('✅ Cart merge popup should be showing now');

    } catch (error) {
      console.error('❌ Error checking cart merge:', error);
      toast.error('Login successful, but cart check failed');
    }
  };

  const handleCartMergeConfirm = async () => {
    if (!cartMergeData) return;
    
    try {
      setLoading(true);
      await mergeGuestCartWithUserCart(cartMergeData.token);
      
      // Pre-fill customer info
      if (cartMergeData.userInfo.name) {
        setCustomerInfo(prev => ({
          ...prev,
          name: cartMergeData.userInfo.name,
          email: cartMergeData.userInfo.email,
          phone: cartMergeData.userInfo.phone || prev.phone
        }));
      }
      
      toast.success('Carts merged successfully! You can now continue with checkout.');
      setShowCartMergePopup(false);
      setCartMergeData(null);
    } catch (error) {
      console.error('Cart merge error:', error);
      toast.error('Failed to merge carts');
    } finally {
      setLoading(false);
    }
  };

  const handleCartMergeCancel = () => {
    // User chose not to merge - just clear guest cart and use user's cart
    if (cartMergeData) {
      clearCart();
      if (cartMergeData.userInfo.name) {
        setCustomerInfo(prev => ({
          ...prev,
          name: cartMergeData.userInfo.name,
          email: cartMergeData.userInfo.email,
          phone: cartMergeData.userInfo.phone || prev.phone
        }));
      }
      toast.success('Guest cart cleared. Using your saved cart.');
    }
    setShowCartMergePopup(false);
    setCartMergeData(null);
  };

  const mergeGuestCartWithUserCart = async (token: string) => {
    try {
      // Get current guest cart
      const guestCartItems = items;
      
      if (guestCartItems.length === 0) return;

      // Add guest cart items to user cart
      for (const item of guestCartItems) {
        try {
          await fetch(`${API_BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              variantId: item.variant_id,
              quantity: item.quantity
            })
          });
        } catch (itemError) {
          console.error('Error adding item to user cart:', itemError);
        }
      }

      // Clear guest cart after successful merge
      await clearCart();
      
    } catch (error) {
      console.error('Error merging carts:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);

      // Validate customer info
      if (!customerInfo.name || !customerInfo.email || !customerInfo.address1 || !customerInfo.city || !customerInfo.zip) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate signup info if user wants to create account
      if (wantsToSignup) {
        if (!signupInfo.password || !signupInfo.confirmPassword) {
          toast.error('Please fill in password fields to create account');
          setLoading(false);
          return;
        }
        if (signupInfo.password !== signupInfo.confirmPassword) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        if (signupInfo.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
      }

      // Create guest checkout session
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
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url,
          size: item.size,
          color: item.color,
          source: item.source || 'printful'
        }))
      });

      // Process the order
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

      // Create Stripe payment intent
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

    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to create order');
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

  // Render customer information form
  if (currentStep === 'info') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <Link
              href="/cart"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Link>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            {/* Customer Information Form */}
            <div className="lg:col-span-7">
              <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Customer Information
                </h2>
                
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
                
                {/* Login/Signup Options */}
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">Account Options</h3>
                    <button
                      type="button"
                      onClick={() => setShowLoginForm(!showLoginForm)}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      {showLoginForm ? 'Continue as guest' : 'Already have an account? Sign in'}
                    </button>
                  </div>

                  {showLoginForm ? (
                    // Login Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={loginInfo.email}
                          onChange={(e) => setLoginInfo({...loginInfo, email: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={loginInfo.password}
                          onChange={(e) => setLoginInfo({...loginInfo, password: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your password"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? 'Signing in...' : 'Sign In & Continue'}
                      </button>
                      <p className="text-sm text-gray-600 text-center">
                        When you sign in, items in this cart will be added to your saved cart.
                      </p>
                    </div>
                  ) : (
                    // Signup Option
                    <div>
                      <div className="flex items-center">
                        <input
                          id="signup-checkbox"
                          type="checkbox"
                          checked={wantsToSignup}
                          onChange={(e) => setWantsToSignup(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="signup-checkbox" className="ml-2 block text-sm text-gray-900">
                          Create an account to save this information for future orders
                        </label>
                      </div>
                  
                      {wantsToSignup && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Password *
                            </label>
                            <input
                              type="password"
                              value={signupInfo.password}
                              onChange={(e) => setSignupInfo({...signupInfo, password: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter a password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm Password *
                            </label>
                            <input
                              type="password"
                              value={signupInfo.confirmPassword}
                              onChange={(e) => setSignupInfo({...signupInfo, confirmPassword: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Confirm your password"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">
                              By creating an account, your shipping and billing information will be saved for future orders.
                              Next time you shop, you'll only need to sign in!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={customerInfo.address1}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address1: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={customerInfo.address2}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address2: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="State"
                      value={customerInfo.state}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={customerInfo.zip}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    
                    <select
                      value={customerInfo.country}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
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
                        <p className="text-xs text-gray-500">
                          {item.size} • {item.color} • Qty: {item.quantity}
                        </p>
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
                
                <button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Order...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Stripe payment step
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

  // Render completion step
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white shadow-sm rounded-lg p-8 max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We've received your payment and will process your order shortly.
          </p>
          
          {wantsToSignup && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                <strong>Account Created!</strong> Your account has been set up with your shipping information saved. 
                Next time you shop, just sign in with <strong>{customerInfo.email}</strong> and your details will be ready!
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
            <Link
              href="/products"
              className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="block w-full bg-white text-indigo-600 border border-indigo-600 py-3 px-4 rounded-md hover:bg-indigo-50"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log popup state
  console.log('🎭 Popup state:', { showCartMergePopup, cartMergeData: !!cartMergeData });

  // Cart Merge Popup
  if (showCartMergePopup && cartMergeData) {
    console.log('🎯 Rendering cart merge popup');
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cart Items Found!
              </h3>
              
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCartMergeConfirm}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Merging...
                    </>
                  ) : (
                    `Yes, Merge All ${cartMergeData.userCartCount + cartMergeData.guestCartCount} Items`
                  )}
                </button>
                
                <button
                  onClick={handleCartMergeCancel}
                  disabled={loading}
                  className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  No, Use Only My Saved Cart ({cartMergeData.userCartCount} items)
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Merging will add guest items to your saved cart. Your information will be pre-filled.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}