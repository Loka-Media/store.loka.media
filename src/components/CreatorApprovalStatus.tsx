'use client';

import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatorApprovalStatus() {
  const { user } = useAuth();

  if (!user || user.role !== 'user' || !user.creatorStatus) {
    return null;
  }

  const getStatusConfig = () => {
    switch (user.creatorStatus) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Creator Application Under Review',
          message: 'Your creator application is being reviewed by our admin team. You will receive an email notification once a decision is made.',
          bgColor: 'bg-yellow-900/30',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          textColor: 'text-yellow-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Creator Application Approved!',
          message: 'Congratulations! Your creator application has been approved. Please refresh the page to access your creator dashboard.',
          bgColor: 'bg-green-900/30',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-400',
          textColor: 'text-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Creator Application Not Approved',
          message: 'Unfortunately, your creator application was not approved at this time. You can continue using the platform as a regular user.',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          textColor: 'text-red-200'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const { icon: Icon, title, message, bgColor, borderColor, iconColor, textColor } = config;

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className={`${bgColor} border ${borderColor} rounded-lg p-6`}>
        <div className="flex items-start">
          <Icon className={`w-6 h-6 ${iconColor} mt-1 mr-4 flex-shrink-0`} />
          <div>
            <h3 className={`text-lg font-semibold ${iconColor} mb-2`}>
              {title}
            </h3>
            <p className={`${textColor} leading-relaxed`}>
              {message}
            </p>
            {user.creatorStatus === 'approved' && (
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Access Creator Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}