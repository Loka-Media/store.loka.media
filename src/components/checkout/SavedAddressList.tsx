import { Check, AlertTriangle } from 'lucide-react';
import { Address, CustomerInfo } from '@/lib/checkout-types';
import { PrintfulCountry } from '@/lib/shipping-compatibility';
import { getRegionName } from '@/lib/shipping-compatibility';

interface SavedAddressListProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onAddressSelect: (address: Address, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => void;
  updateCustomerInfo: (updates: Partial<CustomerInfo>) => void;
  printfulCountries?: PrintfulCountry[];
}

export const SavedAddressList = ({
  addresses,
  selectedAddressId,
  onAddressSelect,
  updateCustomerInfo,
  printfulCountries = []
}: SavedAddressListProps) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-400 mb-3">Choose a saved address:</p>
      <div className="grid gap-3">
        {addresses.map((address: Address) => {
          const hasIncompatibleItems = address.cart_compatibility &&
            !address.cart_compatibility.is_fully_compatible;

          return (
            <div
              key={address.id}
              onClick={() => onAddressSelect(address, updateCustomerInfo)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAddressId === address.id
                  ? 'border-orange-500 bg-orange-900/20'
                  : hasIncompatibleItems
                  ? 'border-yellow-600/50 hover:border-yellow-500/70 bg-yellow-900/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{address.name}</p>
                    {hasIncompatibleItems && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-900/30 text-yellow-400 rounded-full">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {address.cart_compatibility!.incompatible_items_count} {address.cart_compatibility!.incompatible_items_count === 1 ? 'item' : 'items'} can't ship here
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">
                    {address.address1}
                    {address.address2 && `, ${address.address2}`}
                  </p>
                  <p className="text-sm text-gray-300">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  <p className="text-sm text-gray-300">{address.country}</p>

                  {/* Compatibility warnings */}
                  {hasIncompatibleItems && address.cart_compatibility!.incompatible_items.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-md">
                      <p className="text-xs font-medium text-yellow-400 mb-1">Items that can't ship to this address:</p>
                      <ul className="space-y-1">
                        {address.cart_compatibility!.incompatible_items.map((item) => (
                          <li key={item.id} className="text-xs text-gray-300">
                            <span className="font-medium">{item.product_name}</span>
                            {item.available_regions && item.available_regions.length > 0 && printfulCountries.length > 0 && (
                              <span className="text-gray-400">
                                {' '}(Ships to: {item.available_regions.map(r => getRegionName(r, printfulCountries)).join(', ')})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {address.is_default && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-900/20 text-green-400 rounded-full mt-2">
                      Default
                    </span>
                  )}
                </div>
                {selectedAddressId === address.id && (
                  <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};