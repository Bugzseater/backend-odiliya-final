import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || 'unknown page';

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full text-center relative">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600/20 rounded-3xl blur-xl"></div>
            <div className="relative p-6 bg-[#1A1A24] rounded-3xl border border-red-600/30">
              <AlertTriangle size={64} className="text-red-500" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3">
          Access Denied
        </h1>
        
        <p className="text-[#8B8B98] mb-4">
          You don't have permission to access this page.
        </p>
        
        <div className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530] mb-8">
          <p className="text-sm text-[#8B8B98]">
            Attempted to access:{' '}
            <span className="font-mono text-red-500 bg-red-600/10 px-2 py-1 rounded-lg">
              {from}
            </span>
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-600/25"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;