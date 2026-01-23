'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Address, addressAPI } from '@/lib/api';
import { MapPin, Plus, Edit, Trash2, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import GradientTitle from '@/components/ui/GradientTitle';
import { useLocationLookup } from '@/hooks/useLocationLookup';
import { PrintfulCountry, PrintfulState } from '@/lib/checkout-types';
import { validateZipCode } from '@/lib/location-utils';

// Normalize state names to state codes
const normalizeStateName = (state: string | null | undefined): string => {
  if (!state) return '';

  const nameToCodeMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    // Canadian provinces
    'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB', 'new brunswick': 'NB',
    'newfoundland and labrador': 'NL', 'nova scotia': 'NS', 'ontario': 'ON',
    'prince edward island': 'PE', 'quebec': 'QC', 'saskatchewan': 'SK',
    'northwest territories': 'NT', 'nunavut': 'NU', 'yukon': 'YT'
  };

  const lowerState = state.toLowerCase().trim();

  // If already a code (2 letters, uppercase), return as-is
  if (state.length === 2 && state === state.toUpperCase()) {
    return state;
  }

  // Try to find in map
  return nameToCodeMap[lowerState] || state;
};

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const locationLookup = useLocationLookup();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);

  const [addressForm, setAddressForm] = useState<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    is_default: false,
    address_type: 'shipping'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (showAddressForm) {
      setIsFormVisible(true);
      setTimeout(() => setIsFormAnimating(true), 10);
    } else {
      setIsFormAnimating(false);
      setTimeout(() => setIsFormVisible(false), 200);
    }
  }, [showAddressForm]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressAPI.getAddresses();
      setAddresses(response.addresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAddressForm({
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
      is_default: false,
      address_type: 'shipping'
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const resetDeleteModal = () => {
    setAddressToDelete(null);
    setShowDeleteModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (
      !addressForm.name ||
      !addressForm.address1 ||
      !addressForm.city ||
      !addressForm.zip ||
      !addressForm.country ||
      !addressForm.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate state for countries that require it
    const countriesRequiringState = ['US', 'CA', 'AU', 'JP'];
    if (countriesRequiringState.includes(addressForm.country) && !addressForm.state) {
      toast.error(`State/Province is required for ${addressForm.country}`);
      return;
    }

    // Validate phone number
    const phoneDigits = addressForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      toast.error("Phone number must have at least 7 digits");
      return;
    }

    // Validate address format for country
    const zipValidation = validateZipCode(addressForm.zip, addressForm.country);
    if (!zipValidation.valid) {
      toast.error(zipValidation.message || "Invalid postal code format");
      return;
    }

    try {
      setLoading(true);

      // Normalize state before saving
      const normalizedAddressForm = {
        ...addressForm,
        state: normalizeStateName(addressForm.state)
      };

      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id!, normalizedAddressForm);
        toast.success('Address updated successfully');
      } else {
        await addressAPI.createAddress(normalizedAddressForm);
        toast.success('Address added successfully');
      }

      resetForm();
      await fetchAddresses();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save address';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setAddressForm({
      name: address.name,
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state || '',
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default || false,
      address_type: address.address_type || 'shipping'
    });
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    
    try {
      setLoading(true);
      await addressAPI.deleteAddress(addressToDelete.id!);
      toast.success('Address deleted successfully');
      await fetchAddresses();
      resetDeleteModal();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete address';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: number, addressType: 'shipping' | 'billing' | 'both') => {
    try {
      setLoading(true);
      await addressAPI.setDefaultAddress(addressId, addressType);
      toast.success('Default address updated');
      await fetchAddresses();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update default address';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[90vh] bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-black text-white">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <GradientTitle text="My Addresses" size="sm" />
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Manage your shipping and billing addresses ({addresses.length}/6 used)
            </p>
          </div>
          <button
            onClick={() => {
              if (addresses.length >= 6) {
                toast.error('Maximum 6 addresses allowed per user');
                return;
              }
              setShowAddressForm(true);
            }}
            disabled={addresses.length >= 6}
            className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
              addresses.length >= 6
                ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'text-white bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Add Address</span>
            <span className="sm:hidden">Add</span>
            {addresses.length >= 6 ? ' (Limit)' : ''}
          </button>
        </div>

        {loading && !showAddressForm ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold text-white">No addresses found</h3>
            <p className="mt-2 text-gray-400">Add your first address to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 p-4 sm:p-5 md:p-6 hover:border-orange-500/30 transition-all duration-200 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-white break-words">{address.name}</h3>
                      {address.is_default && (
                        <div className="flex items-center px-2.5 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full flex-shrink-0">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Default
                        </div>
                      )}
                      <div className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full capitalize flex-shrink-0">
                        {address.address_type}
                      </div>
                    </div>

                    <div className="text-gray-300 space-y-1">
                      <p className="text-sm sm:text-base break-words">{address.address1}</p>
                      {address.address2 && <p className="text-sm sm:text-base break-words">{address.address2}</p>}
                      <p className="text-sm sm:text-base break-words">{address.city}, {address.state} {address.zip}</p>
                      <p className="text-sm sm:text-base break-words">{address.country}</p>
                      {address.phone && <p className="text-sm sm:text-base break-words">{address.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 sm:p-3 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                      title="Edit address"
                    >
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(address)}
                      className="p-2 sm:p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {!address.is_default && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <button
                      onClick={() => handleSetDefault(address.id!, address.address_type || 'shipping')}
                      className="text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-200"
                    >
                      Set as default
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Address Form Modal */}
        {isFormVisible && (
          <div
            className={`fixed inset-0 bg-black/40 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-200 ${
              isFormAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={resetForm}
          >
            <div
              className={`w-full max-w-2xl sm:max-w-4xl mx-auto p-4 sm:p-6 border border-gray-700/50 rounded-lg bg-gray-900 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto transform transition-all duration-200 ${
                isFormAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {editingAddress ? 'Update your address information' : 'Add a new shipping or billing address'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-full transition-all duration-200 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    required
                  />

                  <input
                    type="tel"
                    placeholder="Phone (e.g. +1234567890) *"
                    value={addressForm.phone || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    required
                  />
                  {addressForm.phone && addressForm.phone.replace(/\D/g, '').length < 7 && (
                    <p className="text-xs text-red-400 mt-1">Phone must have at least 7 digits</p>
                  )}
                  {addressForm.phone && !addressForm.phone.startsWith('+') && addressForm.phone.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Tip: Include country code (e.g. +1 for US/Canada)
                    </p>
                  )}

                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={addressForm.address1}
                    onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.address2}
                    onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  />

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="City *"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      required
                    />
                    {locationLookup.isLoadingLocation && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {locationLookup.availableStates.length > 0 && (
                    <div>
                      <select
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        disabled={!addressForm.country || locationLookup.availableStates.length === 0}
                        required
                      >
                        <option value="">{addressForm.country ? 'Select State/Province *' : 'Select Country First'}</option>
                        {locationLookup.availableStates.map(state => (
                          <option key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                      {!addressForm.country && (
                        <p className="text-xs text-orange-400 mt-1">✱ Select country first</p>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        addressForm.country === 'CA' ? 'Postal Code (e.g. M5V 3A8) *' :
                        addressForm.country === 'IN' ? 'PIN Code (e.g. 110001) *' :
                        addressForm.country === 'CN' ? 'Postal Code (e.g. 100000) *' :
                        addressForm.country === 'BR' ? 'Postal Code (e.g. 01310-100) *' :
                        addressForm.country === 'JP' ? 'Postal Code (e.g. 100-0001) *' :
                        'ZIP/Postal Code *'
                      }
                      value={addressForm.zip}
                      onChange={(e) => locationLookup.handleZipCodeChange(
                        e.target.value,
                        addressForm.country,
                        (updates) => setAddressForm(prev => ({ ...prev, ...updates }))
                      )}
                      maxLength={
                        addressForm.country === 'CA' ? 7 :
                        addressForm.country === 'IN' ? 6 :
                        addressForm.country === 'CN' ? 6 :
                        addressForm.country === 'SG' ? 6 :
                        addressForm.country === 'BR' ? 9 :
                        addressForm.country === 'NL' ? 7 :
                        addressForm.country === 'PL' ? 6 :
                        addressForm.country === 'CZ' ? 6 :
                        addressForm.country === 'JP' ? 8 :
                        50
                      }
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      required
                    />
                    {locationLookup.isLoadingLocation && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                      </div>
                    )}
                    {addressForm.zip && addressForm.country && (
                      <div className="text-xs text-gray-400 mt-1">
                        {addressForm.country === 'CA' ? '6-7 characters (e.g. M5V 3A8)' :
                         addressForm.country === 'IN' ? '6 digits (e.g. 110001)' :
                         addressForm.country === 'CN' ? '6 digits (e.g. 100000)' :
                         addressForm.country === 'BR' ? '5+3 digits (e.g. 01310-100)' :
                         addressForm.country === 'JP' ? '3+4 digits (e.g. 100-0001)' :
                         addressForm.country === 'US' ? '5 digits (e.g. 90210)' :
                         'See format guide above'}
                      </div>
                    )}
                  </div>

                  <div>
                    <select
                      value={addressForm.country}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, country: e.target.value, state: '' });
                        locationLookup.updateAvailableStates(
                          e.target.value,
                          '',
                          (updates) => setAddressForm(prev => ({ ...prev, ...updates }))
                        );
                      }}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select Country *</option>
                      {locationLookup.printfulCountries.length > 0 ? (
                        locationLookup.printfulCountries.map(country => (
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
                    {!addressForm.country && (
                      <p className="text-xs text-orange-400 mt-1">✱ Required to validate address</p>
                    )}
                  </div>

                  <select
                    value={addressForm.address_type}
                    onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value as 'shipping' | 'billing' | 'both' })}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                    <option value="both">Both Shipping & Billing</option>
                  </select>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          addressForm.is_default
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-600 bg-gray-800 group-hover:border-orange-500'
                        }`}>
                          {addressForm.is_default && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="ml-3 text-sm text-gray-300 font-medium group-hover:text-white transition-colors duration-200">
                        Set as default {addressForm.address_type} address
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 sm:pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                  >
                    {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={resetDeleteModal}
          onConfirm={handleDeleteConfirm}
          title="Delete Address"
          itemName={addressToDelete?.name}
          itemPreview={addressToDelete ? (
            <>
              <p className="font-medium text-gray-300 mb-1">{addressToDelete.name}</p>
              <p>{addressToDelete.address1}</p>
              {addressToDelete.address2 && <p>{addressToDelete.address2}</p>}
              <p>{addressToDelete.city}, {addressToDelete.state} {addressToDelete.zip}</p>
            </>
          ) : undefined}
          isLoading={loading}
          confirmButtonText="Delete Address"
        />
      </div>
    </div>
  );
}