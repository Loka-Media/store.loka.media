'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { ArrowLeft, Save, User, Phone, Mail, AtSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      
      await userAPI.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim()
      });

      toast.success('Profile updated successfully!');
      
      // Refresh user data in context
      await refreshUser();
      
      // Redirect back to profile
      router.push('/profile');
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 border-4 border-black rounded-full p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-black">Edit Profile</h1>
            <p className="text-gray-800 font-bold mt-2 text-lg">Update your personal information</p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 bg-white border-4 border-black text-black font-extrabold rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Current Info Display */}
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-black rounded-2xl p-6 mb-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <h3 className="text-lg font-extrabold text-black mb-4">Current Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center bg-white border-2 border-black rounded-lg px-3 py-2 font-bold text-black">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-extrabold">Email:</span>
                  <span className="ml-2">{user.email}</span>
                </div>
                <div className="flex items-center bg-white border-2 border-black rounded-lg px-3 py-2 font-bold text-black">
                  <AtSign className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="font-extrabold">Username:</span>
                  <span className="ml-2">@{user.username}</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-700 mt-4 bg-yellow-100 border-2 border-black rounded-lg px-3 py-2">
                ⚠️ Email and username cannot be changed. Contact support if you need assistance.
              </p>
            </div>

            {/* Editable Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="flex items-center text-base font-extrabold text-black mb-3">
                  <div className="bg-purple-300 border-2 border-black rounded-lg p-2 mr-2">
                    <User className="w-4 h-4 text-black" />
                  </div>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-yellow-50 border-4 border-black rounded-xl font-bold text-black placeholder-gray-600 focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="flex items-center text-base font-extrabold text-black mb-3">
                  <div className="bg-green-300 border-2 border-black rounded-lg p-2 mr-2">
                    <Phone className="w-4 h-4 text-black" />
                  </div>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-yellow-50 border-4 border-black rounded-xl font-bold text-black placeholder-gray-600 focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                  placeholder="Enter your phone number"
                />
                <p className="text-sm font-bold text-gray-700 mt-2 bg-blue-100 border-2 border-black rounded-lg px-3 py-2">
                  📞 Include country code (e.g., +1234567890)
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t-4 border-black">
              <Link
                href="/profile"
                className="px-6 py-3 font-extrabold text-black bg-white border-4 border-black rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 border-4 border-black text-white font-extrabold rounded-xl hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Settings */}
        <div className="mt-8 bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-yellow-200 to-orange-200 border-b-4 border-black">
            <h3 className="text-2xl font-extrabold text-black">Account Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between py-4 border-b-4 border-black">
              <div>
                <p className="text-base font-extrabold text-black">Account Type</p>
                <p className="text-sm font-bold text-gray-700">Your current account role</p>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold bg-purple-300 text-black border-2 border-black capitalize">
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-base font-extrabold text-black">Email Verification</p>
                <p className="text-sm font-bold text-gray-700">Your email verification status</p>
              </div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-extrabold border-2 border-black ${
                user.isVerified
                  ? 'bg-green-300 text-black'
                  : 'bg-yellow-300 text-black'
              }`}>
                {user.isVerified ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}