import { Plus } from 'lucide-react';
import { Address, CustomerInfo, PrintfulCountry, PrintfulState } from '@/lib/checkout-types';
import { SavedAddressList } from './SavedAddressList';

interface ShippingAddressFormProps {
  isLoggedInUser: boolean;
  savedAddresses: Address[];
  selectedAddressId: number | null;
  showNewAddressForm: boolean;
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
    <div className="bg-gray-900 border border-gray-800 shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Shipping Address</h2>
        {isLoggedInUser && savedAddresses.length > 0 && (
          <button
            type="button"
            onClick={onNewAddress}
            className="inline-flex items-center text-sm text-orange-500 hover:text-orange-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Address
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
          {isLoggedInUser && showNewAddressForm && (
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
                  Save this address for future orders
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
              <select 
                value={customerInfo.state} 
                onChange={(e) => updateCustomerInfo({ state: e.target.value })} 
                className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500"
                disabled={!customerInfo.country || availableStates.length === 0}
              >
                <option value="">{customerInfo.country ? 'Select State' : 'Select Country First'}</option>
                {availableStates.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name} ({state.code})
                  </option>
                ))}
              </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ZIP/Postal Code *" 
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
              </div>
              <select 
                value={customerInfo.country} 
                onChange={(e) => updateCustomerInfo({ country: e.target.value })} 
                className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500"
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
  );
};