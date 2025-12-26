'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { ArrowLeft, Save, User, Phone, Mail, AtSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import CreativeLoader from '@/components/CreativeLoader';
import GradientTitle from '@/components/ui/GradientTitle';

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
      <div className="min-h-screen bg-black">
        <CreativeLoader variant="default" message="Loading profile editor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-6 sm:pb-8 pt-6 sm:pt-8">
            <GradientTitle text="Edit Profile" size="lg" />
            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
              Update your personal information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current User Info Card */}
        <div className="gradient-border-white-top p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            {/* Avatar & Username/Email */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-white/20 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              {/* Name & Username */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h2>
                <p className="text-xs sm:text-sm text-orange-400 font-medium mt-1">@{user?.username}</p>
              </div>
            </div>

            {/* Email & Warning */}
            <div className="flex-1">
              <div className="flex items-center bg-white/5 border border-white/20 rounded-lg px-4 py-2 mb-3">
                <Mail className="w-4 h-4 mr-2 text-white/70" />
                <span className="text-white/80 text-xs sm:text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-400 font-medium">Email and username cannot be changed. Contact support if you need assistance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="gradient-border-white-top p-6 sm:p-8 mb-8">
          <div className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="flex items-center text-base font-bold text-white mb-3">
                <AtSign className="w-4 h-4 mr-2 text-white/70" />
                Username
              </label>
              <input
                type="text"
                id="username"
                value={user?.username}
                disabled
                className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base cursor-not-allowed opacity-60"
                placeholder="Username"
              />
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="flex items-center text-base font-bold text-white mb-3">
                <User className="w-4 h-4 mr-2 text-white/70" />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
                placeholder="Enter your full name"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="flex items-center text-base font-bold text-white mb-3">
                <Phone className="w-4 h-4 mr-2 text-white/70" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
              <Link
                href="/profile"
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-white/70 hover:text-white border border-white/20 rounded-lg font-bold hover:bg-white/5 transition-all text-xs sm:text-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Account Settings */}
        <div className="gradient-border-white-top p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Account Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Account Type Card */}
            <div className="gradient-border-white-top p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">Account Type</p>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">Your Current Account Role</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                  user.role === 'creator'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Email Verification Card */}
            <div className="gradient-border-white-top p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">Email Certification</p>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">Your Email Verification Status</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                  user.isVerified
                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                }`}>
                  {user.isVerified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}