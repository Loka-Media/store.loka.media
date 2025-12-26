/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import GradientTitle from '@/components/ui/GradientTitle';
import StripePaymentForm from '@/components/StripePaymentForm';

import { useCheckoutState } from '@/hooks/useCheckoutState';
import { useAddressManagement } from '@/hooks/useAddressManagement';
import { useCheckoutAuth } from '@/hooks/useCheckoutAuth';
import { useCartMerge } from '@/hooks/useCartMerge';
import { useLocationLookup } from '@/hooks/useLocationLookup';
import { Address } from '@/lib/checkout-types';

import { CartMergeDialog } from '@/components/checkout/CartMergeDialog';
import { EmptyCartState } from '@/components/checkout/EmptyCartState';
import { CheckoutComplete } from '@/components/checkout/CheckoutComplete';
import { CustomerInformationForm } from '@/components/checkout/CustomerInformationForm';
import { ShippingAddressForm } from '@/components/checkout/ShippingAddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';

import { unifiedCheckoutAPI } from '@/lib/checkout-api';


export default function UnifiedCheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  
  // Use GuestCart for both authenticated and guest users (handles both cases)
  const { items, summary, clearCart } = useGuestCart();
  
  const checkoutState = useCheckoutState();
  const addressManagement = useAddressManagement();
  const checkoutAuth = useCheckoutAuth();
  const cartMerge = useCartMerge();
  const locationLookup = useLocationLookup();
  
  const isLoggedInUser = isAuthenticated;

  // Check if user is already logged in and pre-fill info
  useEffect(() => {
    if (isAuthenticated && user) {
      checkoutState.updateCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      console.log('✅ User already logged in, pre-filling info:', user.name);
      
      addressManagement.loadUserAddresses().then((defaultAddress) => {
        if (defaultAddress) {
          checkoutState.updateCustomerInfo({
            address1: defaultAddress.address1,
            address2: defaultAddress.address2 || '',
            city: defaultAddress.city,
            state: defaultAddress.state || '',
            zip: defaultAddress.zip,
            country: defaultAddress.country
          });
        }
      });
    } else {
      addressManagement.resetAddressState();
    }
  }, [isAuthenticated, user]);

  // Update available states when country changes
  useEffect(() => {
    locationLookup.updateAvailableStates(
      checkoutState.customerInfo.country, 
      checkoutState.customerInfo.state, 
      checkoutState.updateCustomerInfo
    );
  }, [checkoutState.customerInfo.country, locationLookup.printfulCountries]);

  // Fetch shipping rates when address information changes
  useEffect(() => {
    const { address1, city, state, zip, country } = checkoutState.customerInfo;
    if (address1 && city && state && zip && country && items.length > 0) {
      checkoutState.fetchShippingRates(items);
    }
  }, [
    checkoutState.customerInfo.address1,
    checkoutState.customerInfo.city,
    checkoutState.customerInfo.state,
    checkoutState.customerInfo.zip,
    checkoutState.customerInfo.country,
    items // Only depend on items and customerInfo address fields
  ]);

  // Create wrapper functions for hooks
  const handleAddressSelect = (address: Address) => {
    addressManagement.handleAddressSelect(address, checkoutState.updateCustomerInfo);
  };

  const handleNewAddress = () => {
    addressManagement.handleNewAddress(checkoutState.updateCustomerInfo);
  };

  const handleZipCodeChange = (zipCode: string) => {
    locationLookup.handleZipCodeChange(
      zipCode, 
      checkoutState.customerInfo.country, 
      checkoutState.updateCustomerInfo
    );
  };

  const handleLogin = () => {
    checkoutAuth.handleLogin(
      checkoutState.setLoading, 
      (token, userInfo) => {
        cartMerge.checkCartMerge(
          token, 
          userInfo, 
          items, 
          checkoutState.setCurrentStep, 
          (userInfo) => checkoutAuth.fillUserInfo(userInfo, checkoutState.updateCustomerInfo)
        );
      }
    );
  };

  const handleMergeConfirm = () => {
    cartMerge.handleMergeConfirm(items, clearCart, checkoutState.setLoading);
  };

  const handleMergeCancel = () => {
    cartMerge.handleMergeCancel(clearCart);
  };

  const handleCreateOrder = async () => {
    const { customerInfo, wantsToSignup, signupInfo, setLoading, setOrderData, setClientSecret, setCurrentStep } = checkoutState;
    
    try {
      setLoading(true);

      if (
        !customerInfo.name ||
        !customerInfo.email ||
        !customerInfo.address1 ||
        !customerInfo.city ||
        !customerInfo.zip
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Save new address for logged-in users if they want to
      if (isLoggedInUser) {
        await addressManagement.saveAddress(customerInfo);
      }

      if (wantsToSignup) {
        if (!signupInfo.password || !signupInfo.confirmPassword) {
          toast.error("Please fill in password fields to create account");
          return;
        }
        if (signupInfo.password !== signupInfo.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        if (signupInfo.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          return;
        }
      }

      let orderResult;

      if (isLoggedInUser && !wantsToSignup) {
        // Authenticated user checkout
        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error("Please login to continue");
          return;
        }

        orderResult = await unifiedCheckoutAPI.processAuthenticatedCheckout({
          paymentMethod: "stripe",
          shippingAddress: {
            name: customerInfo.name,
            address1: customerInfo.address1,
            address2: customerInfo.address2,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            country: customerInfo.country,
            phone: customerInfo.phone,
          },
          billingAddress: {
            name: customerInfo.name,
            address1: customerInfo.address1,
            address2: customerInfo.address2,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            country: customerInfo.country,
            phone: customerInfo.phone,
          },
          cartItems: items.map((item) => ({
            product_id: String(item.product_id),
            variant_id: String(item.variant_id),
            product_name: item.product_name,
            price: String(item.price),
            quantity: item.quantity,
            image_url: item.image_url || "",
            size: item.size,
            color: item.color,
            source: item.source || "printful",
          })),
          customerNotes: ""
        }, token);
      } else {
        // Guest checkout or user wants to signup
        const sessionData = await unifiedCheckoutAPI.createGuestCheckout({
          email: customerInfo.email,
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
          shippingAddress: {
            name: customerInfo.name,
            address1: customerInfo.address1,
            address2: customerInfo.address2,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            country: customerInfo.country,
            phone: customerInfo.phone,
          },
          cartItems: items.map((item) => ({
            product_id: String(item.product_id),
            variant_id: String(item.variant_id),
            product_name: item.product_name,
            price: String(item.price),
            quantity: item.quantity,
            image_url: item.image_url || "",
            size: item.size,
            color: item.color,
            source: item.source || "printful",
          })),
        });

        orderResult = await unifiedCheckoutAPI.processCheckout({
          sessionToken: sessionData.session.session_token,
          paymentMethod: "stripe",
          ...(wantsToSignup && {
            loginCredentials: {
              email: customerInfo.email,
              password: signupInfo.password,
            },
          }),
        });
      }

      const totalAmount = checkoutState.calculateTotal(summary.subtotal);
      const paymentIntentResult = await unifiedCheckoutAPI.createStripePaymentIntent(
        totalAmount, 
        orderResult.order.orderNumber,
        customerInfo.email
      );

      if (!paymentIntentResult.success) {
        throw new Error("Failed to create payment intent");
      }

      setOrderData(orderResult.order);
      setClientSecret(paymentIntentResult.clientSecret);
      setCurrentStep("payment");

      if (wantsToSignup) {
        toast.success(
          "Account created and order ready! Complete your payment to finish."
        );
      } else {
        toast.success("Order created! Please complete payment.");
      }
    } catch (error: unknown) {
      console.error("Order creation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create order";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      checkoutState.setCurrentStep('complete');
      await clearCart();
      toast.success("Payment successful! Order placed.");
    } catch (error) {
      console.error("Payment success handling error:", error);
    }
  };

  // Cart merge popup
  if (checkoutState.currentStep === 'cart-merge' && cartMerge.cartMergeData) {
    return (
      <CartMergeDialog
        cartMergeData={cartMerge.cartMergeData}
        loading={checkoutState.loading}
        onMergeConfirm={handleMergeConfirm}
        onMergeCancel={handleMergeCancel}
      />
    );
  }

  // Empty cart
  if (items.length === 0) {
    return <EmptyCartState />;
  }

  // Payment step
  if (checkoutState.currentStep === 'payment' && checkoutState.orderData && checkoutState.clientSecret) {
    return <StripePaymentForm 
      orderData={checkoutState.orderData} 
      clientSecret={checkoutState.clientSecret} 
      onPaymentSuccess={handlePaymentSuccess}
      totalAmount={checkoutState.calculateTotal(summary.subtotal)}
      loading={checkoutState.loading}
      setLoading={checkoutState.setLoading}
    />;
  }

  // Completion step
  if (checkoutState.currentStep === 'complete') {
    return (
      <CheckoutComplete
        orderData={checkoutState.orderData}
        wantsToSignup={checkoutState.wantsToSignup}
        calculateTotal={() => checkoutState.calculateTotal(summary.subtotal)}
      />
    );
  }

  // Main checkout form
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <GradientTitle text="Checkout" size="sm" />
          <Link href="/cart" className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-lg text-gray-300 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7">
            <CustomerInformationForm
              customerInfo={checkoutState.customerInfo}
              updateCustomerInfo={checkoutState.updateCustomerInfo}
              isLoggedInUser={isLoggedInUser}
              user={user}
              showLoginForm={checkoutAuth.showLoginForm}
              setShowLoginForm={checkoutAuth.setShowLoginForm}
              loginInfo={checkoutAuth.loginInfo}
              setLoginInfo={checkoutAuth.setLoginInfo}
              handleLogin={handleLogin}
              loading={checkoutState.loading}
              wantsToSignup={checkoutState.wantsToSignup}
              setWantsToSignup={checkoutState.setWantsToSignup}
              signupInfo={checkoutState.signupInfo}
              setSignupInfo={checkoutState.setSignupInfo}
            />

            <ShippingAddressForm
              isLoggedInUser={isLoggedInUser}
              savedAddresses={addressManagement.savedAddresses}
              selectedAddressId={addressManagement.selectedAddressId}
              showNewAddressForm={addressManagement.showNewAddressForm}
              setShowNewAddressForm={addressManagement.setShowNewAddressForm}
              setSelectedAddressId={addressManagement.setSelectedAddressId}
              onNewAddress={handleNewAddress}
              onAddressSelect={handleAddressSelect}
              saveNewAddress={addressManagement.saveNewAddress}
              setSaveNewAddress={addressManagement.setSaveNewAddress}
              customerInfo={checkoutState.customerInfo}
              updateCustomerInfo={checkoutState.updateCustomerInfo}
              printfulCountries={locationLookup.printfulCountries}
              availableStates={locationLookup.availableStates}
              isLoadingLocation={locationLookup.isLoadingLocation}
              handleZipCodeChange={handleZipCodeChange}
            />
          </div>

          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <OrderSummary
              items={items.map(item => ({
                ...item,
                total_price: String(item.total_price)
              }))}
              summary={summary}
              calculateTotal={() => checkoutState.calculateTotal(summary.subtotal)}
              onCreateOrder={handleCreateOrder}
              loading={checkoutState.loading}
              shippingCost={checkoutState.selectedShippingRate?.rate || 0} // Derived from selectedShippingRate
              shippingRates={checkoutState.shippingRates}
              selectedShippingRate={checkoutState.selectedShippingRate || null} // Use selectedShippingRate.id
              setSelectedShippingRate={checkoutState.setSelectedShippingRate} // Use setSelectedShippingRate
            />
          </div>
        </div>
      </div>
    </div>
  );
}
