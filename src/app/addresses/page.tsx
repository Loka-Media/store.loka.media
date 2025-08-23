'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Address, addressAPI } from '@/lib/api';
import { MapPin, Plus, Edit, Trash2, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
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
    country: 'US',
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
      country: 'US',
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
    
    try {
      setLoading(true);
      
      if (editingAddress) {
        await addressAPI.updateAddress(editingAddress.id!, addressForm);
        toast.success('Address updated successfully');
      } else {
        await addressAPI.createAddress(addressForm);
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
    <div className="min-h-[90vh] bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <MapPin className="w-7 h-7 mr-3 text-orange-500" />
              My Addresses
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
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
            className={`inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-lg transition-all duration-200 ${
              addresses.length >= 6
                ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                : 'text-black bg-orange-500 hover:bg-orange-400 hover:shadow-orange-500/25'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address {addresses.length >= 6 ? '(Limit Reached)' : ''}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address.id} className="bg-gray-900 rounded-xl shadow-xl border border-gray-700 p-6 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-white">{address.name}</h3>
                      {address.is_default && (
                        <div className="flex items-center px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Default
                        </div>
                      )}
                      <div className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-medium rounded-full capitalize border border-gray-600">
                        {address.address_type}
                      </div>
                    </div>
                    
                    <div className="text-gray-300 space-y-1">
                      <p className="text-base">{address.address1}</p>
                      {address.address2 && <p className="text-base">{address.address2}</p>}
                      <p className="text-base">{address.city}, {address.state} {address.zip}</p>
                      <p className="text-base">{address.country}</p>
                      {address.phone && <p className="text-base">{address.phone}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-3 text-gray-400 hover:text-orange-400 hover:bg-gray-800 rounded-lg transition-all duration-200"
                      title="Edit address"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(address)}
                      className="p-3 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all duration-200"
                      title="Delete address"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {!address.is_default && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
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
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-all duration-200 ${
              isFormAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={resetForm}
          >
            <div 
              className={`w-full max-w-4xl mx-auto p-6 border border-orange-500/20 shadow-2xl rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 max-h-[70vh] overflow-y-auto transform transition-all duration-200 ${
                isFormAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {editingAddress ? 'Update your address information' : 'Add a new shipping or billing address'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-white hover:bg-orange-500/20 rounded-full transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                    required
                  />
                  
                  <input
                    type="tel"
                    placeholder="Phone (Optional)"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  />
                  
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={addressForm.address1}
                    onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.address2}
                    onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  />

                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  />

                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={addressForm.zip}
                    onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                    required
                  />
                  
                  <select
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>

                  <select
                    value={addressForm.address_type}
                    onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value as 'shipping' | 'billing' | 'both' })}
                    className="w-full p-3 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-200"
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                    <option value="both">Both Shipping & Billing</option>
                  </select>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-xl hover:border-orange-500/50 hover:from-orange-500/15 hover:to-orange-600/15 transition-all duration-200 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={addressForm.is_default}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          addressForm.is_default 
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500' 
                            : 'border-gray-500 bg-gray-800 group-hover:border-orange-400'
                        }`}>
                          {addressForm.is_default && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="ml-3 text-sm text-orange-200 font-medium group-hover:text-orange-100 transition-colors duration-200">
                        Set as default {addressForm.address_type} address
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 text-sm font-semibold text-gray-300 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl hover:from-gray-700 hover:to-gray-600 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 text-sm font-semibold text-black bg-gradient-to-r from-orange-500 to-orange-600 border border-transparent rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-orange-500/30 transform hover:scale-105"
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