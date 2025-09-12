import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ACCESS_CONTROL_CONFIG } from '@/config/access-control';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const routeConfig = ACCESS_CONTROL_CONFIG['/products'];

  return (
    <ProtectedRoute
      allowedRoles={routeConfig.allowedRoles}
      requiresAuth={routeConfig.requiresAuth}
      bypassEnabled={routeConfig.bypassEnabled}
      redirectTo={routeConfig.redirectTo}
      unauthorizedComponent={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-gray-400 mb-4">This area is only accessible to creators and administrators.</p>
            <a href="/auth/login" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors">
              Sign In
            </a>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {children}
      </div>
    </ProtectedRoute>
  );
}