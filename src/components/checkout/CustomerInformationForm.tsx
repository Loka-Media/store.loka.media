import { MapPin } from 'lucide-react';
import { CustomerInfo, User } from '@/lib/checkout-types';

interface CustomerInformationFormProps {
  customerInfo: CustomerInfo;
  updateCustomerInfo: (updates: Partial<CustomerInfo>) => void;
  isLoggedInUser: boolean;
  user: User | null;
  showLoginForm: boolean;
  setShowLoginForm: (show: boolean) => void;
  loginInfo: { email: string; password: string };
  setLoginInfo: (info: { email: string; password: string }) => void;
  handleLogin: () => void;
  loading: boolean;
  wantsToSignup: boolean;
  setWantsToSignup: (wants: boolean) => void;
  signupInfo: { password: string; confirmPassword: string };
  setSignupInfo: (info: { password: string; confirmPassword: string }) => void;
}

export const CustomerInformationForm = ({
  customerInfo,
  updateCustomerInfo,
  isLoggedInUser,
  user,
  showLoginForm,
  setShowLoginForm,
  loginInfo,
  setLoginInfo,
  handleLogin,
  loading,
  wantsToSignup,
  setWantsToSignup,
  signupInfo,
  setSignupInfo
}: CustomerInformationFormProps) => {
  return (
    <div className="bg-gray-900 border border-gray-800 shadow-sm rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-white mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Customer Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="Full Name *" 
          value={customerInfo.name} 
          onChange={(e) => updateCustomerInfo({name: e.target.value})} 
          className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
        />
        <input 
          type="email" 
          placeholder="Email Address *" 
          value={customerInfo.email} 
          onChange={(e) => updateCustomerInfo({email: e.target.value})} 
          className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
        />
        <div className="md:col-span-2">
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={customerInfo.phone} 
            onChange={(e) => updateCustomerInfo({phone: e.target.value})} 
            className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
          />
        </div>
      </div>
      
      {!isLoggedInUser && (
        <div className="mt-6 border-t border-gray-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-white">Account Options</h3>
            <button 
              type="button" 
              onClick={() => setShowLoginForm(!showLoginForm)} 
              className="text-orange-500 hover:text-orange-400 text-sm font-medium"
            >
              {showLoginForm ? 'Continue as guest' : 'Already have an account? Sign in'}
            </button>
          </div>

          {showLoginForm ? (
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={loginInfo.email} 
                onChange={(e) => setLoginInfo({...loginInfo, email: e.target.value})} 
                className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginInfo.password} 
                onChange={(e) => setLoginInfo({...loginInfo, password: e.target.value})} 
                className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
              />
              <button 
                type="button" 
                onClick={handleLogin} 
                disabled={loading} 
                className="w-full bg-orange-500 text-black py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In & Continue'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center">
                <input 
                  id="signup-checkbox" 
                  type="checkbox" 
                  checked={wantsToSignup} 
                  onChange={(e) => setWantsToSignup(e.target.checked)} 
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-800" 
                />
                <label htmlFor="signup-checkbox" className="ml-2 block text-sm text-gray-300">
                  Create an account to save this information for future orders
                </label>
              </div>
              
              {wantsToSignup && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="password" 
                    placeholder="Password *" 
                    value={signupInfo.password} 
                    onChange={(e) => setSignupInfo({...signupInfo, password: e.target.value})} 
                    className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm Password *" 
                    value={signupInfo.confirmPassword} 
                    onChange={(e) => setSignupInfo({...signupInfo, confirmPassword: e.target.value})} 
                    className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500" 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isLoggedInUser && (
        <div className="mt-6 border-t border-gray-800 pt-6">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-green-400">✓</div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-400">
                  Logged in as {user?.name || user?.email}
                </p>
                <p className="text-sm text-green-300">
                  Your information has been pre-filled. Just add your shipping address below.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};