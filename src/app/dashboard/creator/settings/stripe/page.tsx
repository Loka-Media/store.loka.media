'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, Lock, DollarSign, Edit2, Trash2, X } from 'lucide-react';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';
import GradientTitle from '@/components/ui/GradientTitle';
import { api } from '@/lib/auth';

interface BankDetails {
  id?: number;
  account_holder_name: string;
  account_holder_email: string;
  account_number: string;
  routing_number: string;
  swift_code?: string;
  iban?: string;
  account_type: 'checking' | 'savings';
  bank_name: string;
  bank_country: string;
  account_holder_dob: string;
  account_holder_address: string;
  account_holder_city: string;
  account_holder_state: string;
  account_holder_zip: string;
  account_holder_country: string;
  tax_id_type: 'ssn' | 'ein' | 'other';
  tax_id: string;
  business_name?: string;
  is_business: boolean;
  currency: string;
  created_at?: string;
  verified_at?: string;
}

function PayoutSettingsPageContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [showSensitiveFields, setShowSensitiveFields] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [hasDetails, setHasDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    account_holder_name: '',
    account_holder_email: '',
    account_number: '',
    routing_number: '',
    swift_code: '',
    iban: '',
    account_type: 'checking',
    bank_name: '',
    bank_country: 'US',
    account_holder_dob: '',
    account_holder_address: '',
    account_holder_city: '',
    account_holder_state: '',
    account_holder_zip: '',
    account_holder_country: 'US',
    tax_id_type: 'ssn',
    tax_id: '',
    business_name: '',
    is_business: false,
    currency: 'USD',
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/creator/payout/bank-details');
      if (response.data?.data) {
        setBankDetails(response.data.data);
        setIsBusiness(response.data.data.is_business);
        setHasDetails(true);
      } else {
        setHasDetails(false);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setHasDetails(false);
      } else {
        console.error('Error fetching bank details:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...bankDetails,
        is_business: isBusiness,
      };

      await api.post('/api/creator/payout/bank-details', payload);
      toast.success('Bank details saved successfully');
      await fetchBankDetails();
    } catch (error: any) {
      console.error('Error saving bank details:', error);
      toast.error(error?.response?.data?.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!bankDetails.account_holder_name.trim()) {
      toast.error('Account holder name is required');
      return false;
    }
    if (!bankDetails.account_holder_email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!bankDetails.account_number.trim()) {
      toast.error('Account number is required');
      return false;
    }
    if (!bankDetails.bank_name.trim()) {
      toast.error('Bank name is required');
      return false;
    }
    if (!bankDetails.account_holder_address.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!bankDetails.account_holder_city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!bankDetails.account_holder_zip.trim()) {
      toast.error('ZIP/Postal code is required');
      return false;
    }
    if (!bankDetails.tax_id.trim()) {
      toast.error('Tax ID is required');
      return false;
    }
    if (isBusiness && !bankDetails.business_name?.trim()) {
      toast.error('Business name is required for business accounts');
      return false;
    }
    return true;
  };

  const handleRemoveBankDetails = async () => {
    try {
      setIsRemoving(true);
      await api.delete('/api/creator/payout/bank-details');
      toast.success('Bank details removed successfully');
      setShowRemoveConfirm(false);
      setHasDetails(false);
      setBankDetails({
        account_holder_name: '',
        account_holder_email: '',
        account_number: '',
        routing_number: '',
        swift_code: '',
        iban: '',
        account_type: 'checking',
        bank_name: '',
        bank_country: 'US',
        account_holder_dob: '',
        account_holder_address: '',
        account_holder_city: '',
        account_holder_state: '',
        account_holder_zip: '',
        account_holder_country: 'US',
        tax_id_type: 'ssn',
        tax_id: '',
        business_name: '',
        is_business: false,
        currency: 'USD',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error removing bank details:', error);
      toast.error(error?.response?.data?.message || 'Failed to remove bank details');
    } finally {
      setIsRemoving(false);
    }
  };

  const isInternational = bankDetails.bank_country !== 'US';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-400">Loading payout settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <GradientTitle text="Payout Settings" size="sm" className="mb-2" />
          <p className="text-sm text-gray-400">Add your bank details to receive payouts</p>
        </div>

        {/* Info Alert */}
        <div className="mb-6 gradient-border-white-top rounded-lg p-4 sm:p-6 bg-blue-900/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">Bank details are fully encrypted</p>
              <p className="text-xs text-blue-300/70">
                We use AES-256 encryption to protect your sensitive information. Your data is never shared with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* PREVIEW STATE - Show when details exist and not editing */}
        {!isEditing && hasDetails ? (
          <div className="space-y-6">
            {/* Verification Status */}
            {bankDetails.verified_at && (
              <div className="mb-6 gradient-border-white-top rounded-lg p-4 sm:p-6 bg-green-900/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-300 font-medium">
                      ✓ Verified on {new Date(bankDetails.verified_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details Preview Card */}
            <div className="gradient-border-white-bottom rounded-lg p-6 sm:p-8 bg-gray-800/50 border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Account Holder Section */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Account Holder</p>
                  <p className="text-lg font-semibold text-white mb-4">{bankDetails.account_holder_name}</p>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-gray-300 mb-4">{bankDetails.account_holder_email}</p>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Account Type</p>
                  <p className="text-sm text-gray-300 capitalize">{bankDetails.account_type}</p>
                </div>

                {/* Bank Section */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bank Name</p>
                  <p className="text-lg font-semibold text-white mb-4">{bankDetails.bank_name}</p>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Account Number</p>
                  <p className="text-sm text-gray-300 font-mono mb-4">••••••••{bankDetails.account_number.slice(-4)}</p>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Country</p>
                  <p className="text-sm text-gray-300">{bankDetails.bank_country}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* EMPTY STATE - Show when no details and not editing */}
        {!isEditing && !hasDetails ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center mb-6">
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-white font-bold text-xl mb-2">No Bank Account Connected</p>
            <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
              Connect your bank account to start receiving payouts for your creator earnings.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/20"
            >
              Link Bank Account
            </button>
          </div>
        ) : null}

        {/* FORM MODAL - Show when editing */}
        {isEditing ? (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
                <div className="text-xl font-bold text-white">
                  {hasDetails ? 'Edit Bank Details' : 'Link Bank Account'}
                </div>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowSensitiveFields(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type Selection - Creative */}
          <div className="gradient-border-white-bottom rounded-lg p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50">
            <div className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">1</span>
              Account Type
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    checked={!isBusiness}
                    onChange={() => setIsBusiness(false)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  {!isBusiness && (
                    <div className="absolute inset-0 border-2 border-orange-400 rounded-full pointer-events-none -m-1"></div>
                  )}
                </div>
                <span className="text-gray-300 group-hover:text-orange-400 transition-colors">Personal Account</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    checked={isBusiness}
                    onChange={() => setIsBusiness(true)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  {isBusiness && (
                    <div className="absolute inset-0 border-2 border-orange-400 rounded-full pointer-events-none -m-1"></div>
                  )}
                </div>
                <span className="text-gray-300 group-hover:text-orange-400 transition-colors">Business Account</span>
              </label>
            </div>
          </div>

          {/* Account Holder Information */}
          <div className="gradient-border-white-bottom rounded-lg p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 space-y-4">
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">2</span>
              Account Holder Information
            </div>

            {isBusiness && (
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Business Name *</label>
                <input
                  type="text"
                  name="business_name"
                  value={bankDetails.business_name || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="Your business name"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={bankDetails.account_holder_name}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  name="account_holder_email"
                  value={bankDetails.account_holder_email}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Date of Birth *</label>
                <input
                  type="date"
                  name="account_holder_dob"
                  value={bankDetails.account_holder_dob}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Nationality/Country *</label>
                <input
                  type="text"
                  name="account_holder_country"
                  value={bankDetails.account_holder_country}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="gradient-border-white-bottom rounded-lg p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 space-y-4">
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">3</span>
              Address Information
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Street Address *</label>
              <input
                type="text"
                name="account_holder_address"
                value={bankDetails.account_holder_address}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">City *</label>
                <input
                  type="text"
                  name="account_holder_city"
                  value={bankDetails.account_holder_city}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">State/Province</label>
                <input
                  type="text"
                  name="account_holder_state"
                  value={bankDetails.account_holder_state}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">ZIP/Postal Code *</label>
                <input
                  type="text"
                  name="account_holder_zip"
                  value={bankDetails.account_holder_zip}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="gradient-border-white-bottom rounded-lg p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 space-y-4">
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">4</span>
              Bank Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Bank Country *</label>
                <select
                  name="bank_country"
                  value={bankDetails.bank_country}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="IN">India</option>
                  <option value="MX">Mexico</option>
                  <option value="BR">Brazil</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Currency *</label>
                <select
                  name="currency"
                  value={bankDetails.currency}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="MXN">MXN - Mexican Peso</option>
                  <option value="BRL">BRL - Brazilian Real</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Bank Name *</label>
              <input
                type="text"
                name="bank_name"
                value={bankDetails.bank_name}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                placeholder="Chase Bank, Bank of America, etc."
              />
            </div>

            {!isInternational ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide flex items-center justify-between">
                    <span>Routing Number *</span>
                    <button
                      type="button"
                      onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                      className="text-gray-400 hover:text-orange-400 transition-colors"
                    >
                      {showSensitiveFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </label>
                  <input
                    type={showSensitiveFields ? 'text' : 'password'}
                    name="routing_number"
                    value={bankDetails.routing_number}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                    placeholder="000000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Account Number *</label>
                  <input
                    type={showSensitiveFields ? 'text' : 'password'}
                    name="account_number"
                    value={bankDetails.account_number}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                    placeholder="•••••••••••••••••"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">IBAN</label>
                  <input
                    type="text"
                    name="iban"
                    value={bankDetails.iban || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                    placeholder="DE89370400440532013000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">SWIFT Code</label>
                  <input
                    type="text"
                    name="swift_code"
                    value={bankDetails.swift_code || ''}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                    placeholder="DEUTDEDBBER"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Account Type *</label>
              <select
                name="account_type"
                value={bankDetails.account_type}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>

          {/* Tax Information */}
          <div className="gradient-border-white-bottom rounded-lg p-4 sm:p-6 bg-gray-800/50 border border-gray-700/50 space-y-4">
            <div className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">5</span>
              Tax Information
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Tax ID Type *</label>
              <select
                name="tax_id_type"
                value={bankDetails.tax_id_type}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
              >
                <option value="ssn">Social Security Number (SSN)</option>
                <option value="ein">Employer Identification Number (EIN)</option>
                <option value="other">Other Tax ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>Tax ID *</span>
                <button
                  type="button"
                  onClick={() => setShowSensitiveFields(!showSensitiveFields)}
                  className="text-gray-400 hover:text-orange-400 transition-colors"
                >
                  {showSensitiveFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </label>
              <input
                type={showSensitiveFields ? 'text' : 'password'}
                name="tax_id"
                value={bankDetails.tax_id}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                placeholder={bankDetails.tax_id_type === 'ssn' ? '•••-••-••••' : 'XX-XXXXXXX'}
              />
            </div>
          </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-orange-500/20"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Bank Details'}
                  </button>

                  {/* Security Notice */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-orange-400" />
                      AES-256 Encrypted • Bank-Level Security • PCI-DSS Compliant
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {/* REMOVE CONFIRMATION MODAL */}
        {showRemoveConfirm ? (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg border border-red-500/30 w-full max-w-sm">
              {/* Header */}
              <div className="bg-red-900/20 border-b border-red-500/30 p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Remove Bank Account?</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    This action cannot be undone. You'll need to add a new bank account to receive payouts.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm text-gray-300">
                  Account: <span className="font-semibold text-white">{bankDetails.account_holder_name}</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Bank: <span className="font-semibold text-white">{bankDetails.bank_name}</span>
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700 p-6 flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={isRemoving}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveBankDetails}
                  disabled={isRemoving}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PayoutSettingsPage() {
  return (
    <CreatorProtectedRoute>
      <PayoutSettingsPageContent />
    </CreatorProtectedRoute>
  );
}
