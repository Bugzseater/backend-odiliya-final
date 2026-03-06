// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, ArrowLeft, AlertTriangle, 
  Lock, Home, LogOut, HelpCircle,
  XCircle, AlertCircle
} from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || 'unknown page';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none"></div>
      
      <div className="max-w-md w-full relative">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
          
          <div className="p-8 text-center">
            {/* Warning Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-pulse opacity-30"></div>
                
                {/* Main icon container */}
                <div className="relative p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
                  <Shield size={56} className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                <AlertCircle size={12} />
                403 FORBIDDEN
              </span>
            </div>

            {/* Main Message */}
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
            </p>

            {/* Attempted Access Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <AlertTriangle size={14} className="text-orange-500" />
                <span>Attempted to access:</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 font-mono text-sm">
                <code className="text-red-600 break-all">{from}</code>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/25 group"
              >
                <Home size={18} className="group-hover:scale-110 transition-transform" />
                Return to Dashboard
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Go Back
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <HelpCircle size={14} />
                <span>Need help? Contact your system administrator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Odiliya. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;