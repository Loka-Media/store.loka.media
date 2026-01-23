/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
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
import { useInventoryCheck } from '@/hooks/useInventoryCheck';
import { Address } from '@/lib/checkout-types';

import { CartMergeDialog } from '@/components/checkout/CartMergeDialog';
import { EmptyCartState } from '@/components/checkout/EmptyCartState';
import { CheckoutComplete } from '@/components/checkout/CheckoutComplete';
import { CustomerInformationForm } from '@/components/checkout/CustomerInformationForm';
import { ShippingAddressForm } from '@/components/checkout/ShippingAddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import InventoryErrorDialog from '@/components/checkout/InventoryErrorDialog';

import { unifiedCheckoutAPI } from '@/lib/checkout-api';
import { validateZipCode } from '@/lib/location-utils';
import { checkShippingCompatibility, formatIncompatibilityMessage, type IncompatibleItem } from '@/lib/shipping-compatibility';


export default function UnifiedCheckoutPage() {
  const { user, isAuthenticated } = useAuth();

  // Use GuestCart for both authenticated and guest users (handles both cases)
  const { items, summary, clearCart, removeFromCart } = useGuestCart();

  // State for inventory error dialog
  const [inventoryError, setInventoryError] = useState<{ unavailable_items: any[] } | null>(null);
  const [incompatibleItems, setIncompatibleItems] = useState<IncompatibleItem[]>([]);

  const checkoutState = useCheckoutState();
  const addressManagement = useAddressManagement();
  const checkoutAuth = useCheckoutAuth();
  const cartMerge = useCartMerge();
  const locationLookup = useLocationLookup();
  const inventoryCheck = useInventoryCheck();

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
          console.log('✅ Default address cart compatibility:', defaultAddress.cart_compatibility);

          if (defaultAddress.cart_compatibility && !defaultAddress.cart_compatibility.is_fully_compatible) {
            console.warn('⚠️ Default address has incompatible items:', defaultAddress.cart_compatibility.incompatible_items);
          }

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
  }, [isAuthenticated, user, items]);

  // Update available states when country changes
  useEffect(() => {
    locationLookup.updateAvailableStates(
      checkoutState.customerInfo.country, 
      checkoutState.customerInfo.state, 
      checkoutState.updateCustomerInfo
    );
  }, [checkoutState.customerInfo.country, locationLookup.printfulCountries]);

  // Check compatibility and fetch shipping rates when address changes
  useEffect(() => {
    const { address1, city, state, zip, country } = checkoutState.customerInfo;

    if (!country || items.length === 0 || locationLookup.printfulCountries.length === 0) {
      setIncompatibleItems([]);
      return;
    }

    // First, check if cart items can ship to selected country
    const incompatible = checkShippingCompatibility(
      items,
      country,
      locationLookup.printfulCountries
    );
    setIncompatibleItems(incompatible);

    if (incompatible.length > 0) {
      // Don't fetch shipping rates if items are incompatible with selected region
      const message = formatIncompatibilityMessage(incompatible, locationLookup.printfulCountries);
      console.log('❌ Cannot fetch shipping rates - incompatible items:', message);
      toast.error(message, { duration: 6000 });
      checkoutState.setShippingRates([]);
      checkoutState.setSelectedShippingRate(null);
      return;
    }

    // If compatible, check if we have all required address fields
    const countriesRequiringState = ['US', 'CA', 'AU', 'JP'];
    const stateRequired = countriesRequiringState.includes(country);

    const hasRequiredFields = address1 && city && zip && country &&
      (!stateRequired || state);

    if (hasRequiredFields) {
      console.log('✅ All items compatible. Fetching shipping rates for:', { address1, city, state, zip, country });
      checkoutState.fetchShippingRates(items);
    }
  }, [
    checkoutState.customerInfo.address1,
    checkoutState.customerInfo.city,
    checkoutState.customerInfo.state,
    checkoutState.customerInfo.zip,
    checkoutState.customerInfo.country,
    items,
    locationLookup.printfulCountries
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

      // Check for incompatible items
      if (incompatibleItems.length > 0) {
        const message = formatIncompatibilityMessage(incompatibleItems, locationLookup.printfulCountries);
        toast.error(message);
        setLoading(false);
        return;
      }

      // Validate all required fields
      if (
        !customerInfo.name ||
        !customerInfo.email ||
        !customerInfo.phone ||
        !customerInfo.address1 ||
        !customerInfo.city ||
        !customerInfo.zip ||
        !customerInfo.country
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate phone number
      const phoneDigits = customerInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        toast.error("Phone number must have at least 7 digits");
        return;
      }

      // Validate state for countries that require it (US, CA, AU, JP)
      const countriesRequiringState = ['US', 'CA', 'AU', 'JP'];
      if (countriesRequiringState.includes(customerInfo.country) && !customerInfo.state) {
        toast.error(`State/Province is required for ${customerInfo.country}`);
        return;
      }

      // Validate address format for country
      const zipValidation = validateZipCode(customerInfo.zip, customerInfo.country);
      if (!zipValidation.valid) {
        toast.error(zipValidation.message || "Invalid postal code format");
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

      console.log('✅ [CHECKOUT] Order created successfully, creating payment intent...');

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
    } catch (error: unknown) {
      console.error("❌ [CHECKOUT] Order creation error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        // Check if it's an inventory error with unavailable items
        const err = error as any;
        if (err.isInventoryError && err.unavailable_items) {
          setInventoryError({ unavailable_items: err.unavailable_items });
        } else if (error.message.includes('not available for your shipping region') ||
                   error.message.includes('cannot be shipped')) {
          toast.error(error.message, { duration: 6000 });
        } else if (error.message.includes('Items Unavailable') ||
                   error.message.includes('no longer available')) {
          // Generic inventory error without structured data
          toast.error(error.message, { duration: 6000 });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to create order");
      }
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

  const handleRemoveUnavailableItems = async (variantIds: number[]) => {
    try {
      // Remove each unavailable item from cart
      for (const variantId of variantIds) {
        const variantIdStr = String(variantId);
        const item = items.find(i =>
          i.printful_variant_id === variantIdStr ||
          String(i.variant_id) === variantIdStr
        );
        if (item) {
          await removeFromCart(item.id);
        }
      }
      toast.success("Unavailable items removed from cart");
      setInventoryError(null);
    } catch (error) {
      console.error("Failed to remove unavailable items:", error);
      toast.error("Failed to remove items. Please try manually.");
    }
  };

  const handleCloseInventoryError = () => {
    setInventoryError(null);
  };

  const handleCheckAvailability = async () => {
    const result = await inventoryCheck.checkAvailability(items as any);
    if (!result.available) {
      toast.error(result.message || 'Some items may not be available', { duration: 4000 });
    } else {
      toast.success(result.message || 'All items are available', { duration: 3000 });
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
            {incompatibleItems.length > 0 && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-300 mb-2">Shipping Restriction</h3>
                    <p className="text-sm text-red-200 mb-3">
                      {formatIncompatibilityMessage(incompatibleItems, locationLookup.printfulCountries)}
                    </p>
                    <div className="space-y-2">
                      {incompatibleItems.map((incomp) => (
                        <div key={incomp.item.id} className="flex items-center justify-between bg-red-500/20 rounded px-3 py-2">
                          <span className="text-sm text-white">{incomp.item.product_name}</span>
                          <button
                            onClick={() => removeFromCart(incomp.item.id)}
                            className="text-xs text-red-300 hover:text-red-200 underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <OrderSummary
              items={items.map(item => ({
                ...item,
                total_price: String(item.total_price)
              }))}
              summary={summary}
              calculateTotal={() => checkoutState.calculateTotal(summary.subtotal)}
              onCreateOrder={handleCreateOrder}
              loading={checkoutState.loading || incompatibleItems.length > 0}
              shippingCost={checkoutState.selectedShippingRate?.rate || 0}
              shippingRates={checkoutState.shippingRates}
              selectedShippingRate={checkoutState.selectedShippingRate || null}
              setSelectedShippingRate={checkoutState.setSelectedShippingRate}
              taxAmount={checkoutState.taxAmount}
              availabilityCheck={inventoryCheck.lastCheck}
              onCheckAvailability={handleCheckAvailability}
              checkingAvailability={inventoryCheck.checking}
            />
          </div>
        </div>
      </div>

      {/* Inventory Error Dialog */}
      {inventoryError && inventoryError.unavailable_items && (
        <InventoryErrorDialog
          unavailableItems={inventoryError.unavailable_items}
          onClose={handleCloseInventoryError}
          onRemoveItems={handleRemoveUnavailableItems}
        />
      )}
    </div>
  );
}
