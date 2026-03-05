import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, LogIn,Shield } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-linear-to-br from-[#1A1A24] to-[#0D0D14] p-5 rounded-3xl border border-[#252530] shadow-2xl">
                <Shield size={40} className="text-blue-500" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ODILIYA
            </span>
          </h1>
          <p className="text-[#8B8B98]">Welcome back to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#13131A] rounded-3xl shadow-2xl p-8 border border-[#252530] backdrop-blur-xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Sign In
            </h2>
            <p className="text-[#8B8B98] text-sm">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#8B8B98] mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#8B8B98] mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-xl">
                <p className="text-red-500 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>

            {/* Additional Info */}
            <p className="text-center text-xs text-[#4A4A5A] mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;