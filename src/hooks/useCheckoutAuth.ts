import { useState, useCallback } from 'react';
import { User, CustomerInfo } from '@/lib/checkout-types';
import { authAPI } from '@/lib/checkout-api';
import toast from 'react-hot-toast';

export const useCheckoutAuth = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginInfo, setLoginInfo] = useState({ email: '', password: '' });

  const handleLogin = useCallback(async (
    setLoading: (loading: boolean) => void,
    onLoginSuccess: (token: string, userInfo: User) => void
  ) => {
    try {
      setLoading(true);
      
      if (!loginInfo.email || !loginInfo.password) {
        toast.error('Please enter both email and password');
        return;
      }

      const result = await authAPI.login(loginInfo.email, loginInfo.password);

      localStorage.setItem('token', result.tokens.accessToken);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      await onLoginSuccess(result.tokens.accessToken, result.user);
      setShowLoginForm(false);

    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loginInfo]);

  const fillUserInfo = useCallback((userInfo: User, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => {
    if (userInfo.name) {
      updateCustomerInfo({
        name: userInfo.name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || ''
      });
    }
  }, []);

  return {
    showLoginForm,
    setShowLoginForm,
    loginInfo,
    setLoginInfo,
    handleLogin,
    fillUserInfo
  };
};