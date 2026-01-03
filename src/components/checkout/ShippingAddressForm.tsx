import { Plus } from 'lucide-react';
import { Address, CustomerInfo, PrintfulCountry, PrintfulState } from '@/lib/checkout-types';
import { SavedAddressList } from './SavedAddressList';

interface ShippingAddressFormProps {
  isLoggedInUser: boolean;
  savedAddresses: Address[];
  selectedAddressId: number | null;
  showNewAddressForm: boolean;
  setShowNewAddressForm: (show: boolean) => void;
  setSelectedAddressId: (id: number | null) => void;
  onNewAddress: () => void;
  onAddressSelect: (address: Address, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => void;
  saveNewAddress: boolean;
  setSaveNewAddress: (save: boolean) => void;
  customerInfo: CustomerInfo;
  updateCustomerInfo: (updates: Partial<CustomerInfo>) => void;
  printfulCountries: PrintfulCountry[];
  availableStates: PrintfulState[];
  isLoadingLocation: boolean;
  handleZipCodeChange: (zipCode: string) => void;
}

export const ShippingAddressForm = ({
  isLoggedInUser,
  savedAddresses,
  selectedAddressId,
  showNewAddressForm,
  setShowNewAddressForm,
  setSelectedAddressId,
  onNewAddress,
  onAddressSelect,
  saveNewAddress,
  setSaveNewAddress,
  customerInfo,
  updateCustomerInfo,
  printfulCountries,
  availableStates,
  isLoadingLocation,
  handleZipCodeChange
}: ShippingAddressFormProps) => {
  return (
    <div className="gradient-border-white-top rounded-xl overflow-hidden p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-lg sm:text-xl font-bold text-white block">Shipping Address</span>
          {isLoggedInUser && savedAddresses.length > 0 && !showNewAddressForm && (
            <p className="text-sm text-gray-400 font-medium mt-2">Select an existing address or create a new one</p>
          )}
        </div>
        {isLoggedInUser && savedAddresses.length > 0 && !showNewAddressForm && (
          <button
            type="button"
            onClick={onNewAddress}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-500 hover:text-orange-400 border border-orange-500/50 hover:border-orange-400/50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Address
          </button>
        )}
        {isLoggedInUser && savedAddresses.length > 0 && showNewAddressForm && (
          <button
            type="button"
            onClick={() => {
              setShowNewAddressForm(false);
              // If there's a default address, select it and populate the form
              const defaultAddress = savedAddresses.find(addr => 
                addr.is_default && (addr.address_type === 'shipping' || addr.address_type === 'both')
              ) || savedAddresses[0];
              
              if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                updateCustomerInfo({
                  address1: defaultAddress.address1,
                  address2: defaultAddress.address2 || '',
                  city: defaultAddress.city,
                  state: defaultAddress.state || '',
                  zip: defaultAddress.zip,
                  country: defaultAddress.country
                });
              }
            }}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-md transition-colors"
          >
            ← Back to Saved Addresses
          </button>
        )}
      </div>

      {/* Saved Addresses for Logged-in Users */}
      {isLoggedInUser && savedAddresses.length > 0 && !showNewAddressForm && (
        <SavedAddressList
          addresses={savedAddresses}
          selectedAddressId={selectedAddressId}
          onAddressSelect={onAddressSelect}
          updateCustomerInfo={updateCustomerInfo}
        />
      )}

      {/* Address Form (for new addresses or guests) */}
      {(!isLoggedInUser || showNewAddressForm || savedAddresses.length === 0) && (
        <div>
          {isLoggedInUser && (showNewAddressForm || savedAddresses.length === 0) && (
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="save-address"
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-800"
                />
                <label htmlFor="save-address" className="ml-2 block text-sm text-gray-300">
                  {savedAddresses.length === 0 
                    ? "Save this address for future orders (recommended)" 
                    : "Save this address for future orders"
                  }
                </label>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Address Line 1 *" 
              value={customerInfo.address1} 
              onChange={(e) => updateCustomerInfo({ address1: e.target.value })} 
              className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
            />
            <input 
              type="text" 
              placeholder="Address Line 2 (Optional)" 
              value={customerInfo.address2} 
              onChange={(e) => updateCustomerInfo({ address2: e.target.value })} 
              className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="City *"
                  value={customerInfo.city}
                  onChange={(e) => updateCustomerInfo({ city: e.target.value })}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
                />
                {isLoadingLocation && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
              {availableStates.length > 0 && (
              <div>
                <select
                  value={customerInfo.state}
                  onChange={(e) => updateCustomerInfo({ state: e.target.value })}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500"
                  disabled={!customerInfo.country || availableStates.length === 0}
                >
                  <option value="">{customerInfo.country ? 'Select State/Province' : 'Select Country First'}</option>
                  {availableStates.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
                {!customerInfo.country && (
                  <p className="text-xs text-orange-400 mt-1">✱ Select country first</p>
                )}
              </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={customerInfo.country === 'CA' ? 'Postal Code (e.g. M5V 3A8) *' : 'ZIP Code (e.g. 90210) *'}
                  value={customerInfo.zip}
                  onChange={(e) => handleZipCodeChange(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={customerInfo.country === 'CA' ? 7 : 5}
                />
                {isLoadingLocation && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                  </div>
                )}
                {customerInfo.zip && customerInfo.country && (
                  <div className="text-xs text-gray-400 mt-1">
                    {customerInfo.country === 'CA' ? '6-7 characters (e.g. M5V 3A8)' : '5 digits (e.g. 90210)'}
                  </div>
                )}
              </div>
              <div>
                <select
                  value={customerInfo.country}
                  onChange={(e) => {
                    updateCustomerInfo({ country: e.target.value, state: '' });
                  }}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Country *</option>
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
                {!customerInfo.country && (
                  <p className="text-xs text-orange-400 mt-1">✱ Required to validate address</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};