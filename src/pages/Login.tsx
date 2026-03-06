// src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, Lock, Mail, LogIn, 
  Shield, Key, AlertCircle, Eye, EyeOff,
  CheckCircle, ArrowRight, Home, Users,
  Building, Award, MapPin
} from 'lucide-react';
import company from "../assets/img1_0_xyeveu (1) (1).jpg";
import logo from "../assets/odiliyalogo.png";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-orange-600 to-orange-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        
        {/* Animated Circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30">
              <img src={logo} alt="Odiliya Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-3xl font-bold">Odiliya</span>
          </div>

          {/* Main Image/Illustration */}
          <div className="relative mb-8">
            <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img 
                src={company}
                alt="Luxury Property"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Stats Cards */}
            <div className="absolute -top-4 -right-4 bg-white/20 backdrop-blur-lg rounded-xl p-3 border border-white/30 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Home size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Projects</p>
                  <p className="text-lg font-bold">50+</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white/20 backdrop-blur-lg rounded-xl p-3 border border-white/30 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Happy Clients</p>
                  <p className="text-lg font-bold">1000+</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-center mb-6">Manage Your Properties with Ease</h2>
            <div className="space-y-3">
              {[
                'Real-time project management',
                'Inquiry tracking system',
                'Gallery & media management',
                'SEO optimization tools'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Text */}
          <p className="absolute bottom-8 text-sm text-white/60">
            © 2024 Odiliya. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 p-3 bg-orange-50 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Building size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">Odiliya</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">Welcome Back</h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          {/* Desktop Welcome (hidden on mobile) */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Please sign in to continue to your dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header with decorative line */}
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Shield size={20} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Admin Login</h2>
                  <p className="text-xs text-gray-400">Secure access only</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="admin@odiliya.lk"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password & Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In to Dashboard
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                
              </form>
            </div>
          </div>

          {/* Mobile Footer */}
          <p className="lg:hidden text-center text-xs text-gray-400 mt-6">
            © 2024 Odiliya. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;