// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || 'unknown page';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-2xl">
            <Shield size={48} className="text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Access Denied
        </h1>
        
        <p className="text-slate-600 mb-4">
          You don't have permission to access this page.
        </p>
        
        <p className="text-sm text-slate-400 mb-8">
          Attempted to access: <span className="font-mono text-red-500">{from}</span>
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;