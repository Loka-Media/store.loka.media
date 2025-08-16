import { Check } from 'lucide-react';
import { Address, CustomerInfo } from '@/lib/checkout-types';

interface SavedAddressListProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onAddressSelect: (address: Address, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => void;
  updateCustomerInfo: (updates: Partial<CustomerInfo>) => void;
}

export const SavedAddressList = ({ 
  addresses, 
  selectedAddressId, 
  onAddressSelect,
  updateCustomerInfo
}: SavedAddressListProps) => {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-400 mb-3">Choose a saved address:</p>
      <div className="grid gap-3">
        {addresses.map((address: Address) => (
          <div
            key={address.id}
            onClick={() => onAddressSelect(address, updateCustomerInfo)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedAddressId === address.id
                ? 'border-orange-500 bg-orange-900/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-white">{address.name}</p>
                <p className="text-sm text-gray-300">
                  {address.address1}
                  {address.address2 && `, ${address.address2}`}
                </p>
                <p className="text-sm text-gray-300">
                  {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-sm text-gray-300">{address.country}</p>
                {address.is_default && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-900/20 text-green-400 rounded-full mt-1">
                    Default
                  </span>
                )}
              </div>
              {selectedAddressId === address.id && (
                <Check className="w-5 h-5 text-orange-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};