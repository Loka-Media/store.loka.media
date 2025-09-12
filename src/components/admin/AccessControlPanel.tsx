'use client';

import { useState, useEffect } from 'react';
import { AccessControlManager, ACCESS_CONTROL_CONFIG } from '@/config/access-control';
import { AccessControlHelpers } from '@/utils/access-control-helpers';

interface RouteConfigDisplay {
  path: string;
  isPublic: boolean;
  allowedRoles: string[];
  requiresAuth: boolean;
}

export default function AccessControlPanel() {
  const [routes, setRoutes] = useState<RouteConfigDisplay[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    refreshRouteData();
  }, []);

  const refreshRouteData = () => {
    const routeData = Object.entries(ACCESS_CONTROL_CONFIG).map(([path, config]) => ({
      path,
      isPublic: config.bypassEnabled,
      allowedRoles: config.allowedRoles,
      requiresAuth: config.requiresAuth
    }));
    setRoutes(routeData);
    
    // Check if emergency mode is active (all routes bypassed)
    const allBypassed = routeData.every(route => route.isPublic);
    setEmergencyMode(allBypassed);
  };

  const toggleRouteAccess = (routePath: string, currentStatus: boolean) => {
    AccessControlManager.toggleBypass(routePath, !currentStatus);
    refreshRouteData();
  };

  const handleEmergencyToggle = () => {
    if (emergencyMode) {
      AccessControlHelpers.disableEmergencyAccess();
    } else {
      AccessControlHelpers.enableEmergencyAccess();
    }
    refreshRouteData();
  };

  const handleProductsQuickToggle = () => {
    const productsRoute = routes.find(r => r.path === '/products');
    if (productsRoute?.isPublic) {
      AccessControlHelpers.disableProductsPublicAccess();
    } else {
      AccessControlHelpers.enableProductsPublicAccess();
    }
    refreshRouteData();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Access Control Panel</h2>
      
      {/* Emergency Controls */}
      <div className="mb-8 p-4 border-2 border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800">Emergency Access Control</h3>
            <p className="text-red-600 text-sm">
              {emergencyMode 
                ? '🚨 Emergency mode active - All routes are publicly accessible'
                : '🔐 Normal access controls are active'
              }
            </p>
          </div>
          <button
            onClick={handleEmergencyToggle}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              emergencyMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {emergencyMode ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Products Page Access</span>
            <button
              onClick={handleProductsQuickToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                routes.find(r => r.path === '/products')?.isPublic
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {routes.find(r => r.path === '/products')?.isPublic ? 'Public' : 'Restricted'}
            </button>
          </div>
        </div>
      </div>

      {/* Route Configuration Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Route</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Public Access</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Requires Auth</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Allowed Roles</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.path} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                  {route.path}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    route.isPublic
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {route.isPublic ? '✓ Yes' : '✗ No'}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    route.requiresAuth
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {route.requiresAuth ? '✓ Yes' : '✗ No'}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {route.allowedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {route.allowedRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Everyone</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    onClick={() => toggleRouteAccess(route.path, route.isPublic)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      route.isPublic
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {route.isPublic ? 'Restrict' : 'Allow Public'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Public Access:</strong> When enabled, allows anyone to access the route regardless of authentication</li>
          <li>• <strong>Requires Auth:</strong> When enabled, users must be logged in to access the route</li>
          <li>• <strong>Allowed Roles:</strong> Specific user roles that can access the route (when auth is required)</li>
          <li>• <strong>Emergency Mode:</strong> Bypasses all restrictions - use only for maintenance or emergencies</li>
        </ul>
      </div>
    </div>
  );
}