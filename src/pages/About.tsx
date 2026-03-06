import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Save, Loader2, Phone, FileText, 
  CheckCircle, Trophy, Calendar, MessageCircle, 
  Facebook, Instagram, Linkedin, Music2, Image as ImageIcon,
  MapPin, Globe, Mail, Youtube, Twitter, Edit3,
  Eye, Copy, CheckCheck,
  AlertCircle, Sparkles, Building, Users, Target
} from 'lucide-react';

const AdminAboutForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [formData, setFormData] = useState({
    description: '',
    completedProjects: '',
    ongoingProjects: '',
    soldOutProjects: '',
    yearsOfTrust: '',
    phone: '',
    address: '',
    whatsapp: '',
    facebook: '',
    tiktok: '',
    instagram: '',
    linkedin: '',
    pinterest: '',
    youtube: '',
    twitter: '',
    email: '',
    mission: '',
    vision: '',
    coreValues: ['', '', '']
  });

  useEffect(() => {
    const docRef = doc(db, "settings", "aboutPage");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFormData(prev => ({
          ...prev,
          ...docSnap.data() as any,
          coreValues: docSnap.data()?.coreValues || ['', '', '']
        }));
      }
      setFetching(false);
    });
    return () => unsub();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "aboutPage"), formData, { merge: true });
      alert("Content updated successfully! ✅");
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (fetching) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading about page data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Building className="text-orange-600" size={32} />
                About Page Management
              </h1>
              <p className="text-gray-500">Manage your company information, stats, and social links</p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'edit' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit3 size={16} />
                Edit Content
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'preview' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye size={16} />
                Live Preview
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'edit' ? (
          /* EDIT MODE */
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* Company Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-orange-50 to-transparent border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-orange-600" />
                  Company Overview
                </h2>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Description
                </label>
                <textarea
                  rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Write a compelling description about your company..."
                />
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  This will appear on the about page hero section
                </p>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-orange-50 to-transparent border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Trophy size={20} className="text-orange-600" />
                  Company Statistics
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'completedProjects', label: 'Completed Projects', icon: <CheckCircle size={18} />, color: 'green' },
                    { key: 'ongoingProjects', label: 'Ongoing Projects', icon: <Loader2 size={18} />, color: 'blue' },
                    { key: 'soldOutProjects', label: 'Sold Out Projects', icon: <Trophy size={18} />, color: 'yellow' },
                    { key: 'yearsOfTrust', label: 'Years of Trust', icon: <Calendar size={18} />, color: 'purple' }
                  ].map((stat) => (
                    <div key={stat.key} className="relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                        {stat.label}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-orange-500 outline-none pr-8`}
                          value={(formData as any)[stat.key]}
                          onChange={(e) => setFormData({...formData, [stat.key]: e.target.value})}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-orange-50 to-transparent border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Phone size={20} className="text-orange-600" />
                  Contact Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">Phone Number</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+94 XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">Email Address</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">WhatsApp Number</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      placeholder="+94 XX XXX XXXX"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label className="text-xs font-medium text-gray-500">Full Address</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Main Street, City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-orange-50 to-transparent border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Globe size={20} className="text-orange-600" />
                  Social Media Presence
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'facebook', icon: <Facebook size={18} />, placeholder: 'Facebook URL', color: 'blue' },
                    { key: 'instagram', icon: <Instagram size={18} />, placeholder: 'Instagram URL', color: 'pink' },
                    { key: 'tiktok', icon: <Music2 size={18} />, placeholder: 'TikTok URL', color: 'gray' },
                    { key: 'linkedin', icon: <Linkedin size={18} />, placeholder: 'LinkedIn URL', color: 'blue' },
                    { key: 'youtube', icon: <Youtube size={18} />, placeholder: 'YouTube URL', color: 'red' },
                    { key: 'twitter', icon: <Twitter size={18} />, placeholder: 'Twitter URL', color: 'blue' },
                    { key: 'pinterest', icon: <ImageIcon size={18} />, placeholder: 'Pinterest URL', color: 'red' },
                  ].map((social) => (
                    <div key={social.key} className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {social.icon}
                      </div>
                      <input
                        type="url"
                        className="w-full pl-10 pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                        placeholder={social.placeholder}
                        value={(formData as any)[social.key] || ''}
                        onChange={(e) => setFormData({...formData, [social.key]: e.target.value})}
                      />
                      {(formData as any)[social.key] && (
                        <button
                          type="button"
                          onClick={() => handleCopy((formData as any)[social.key], social.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Copy link"
                        >
                          {copySuccess === social.key ? <CheckCheck size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Publish Changes
                </>
              )}
            </button>
          </form>
        ) : (
          /* PREVIEW MODE */
          <div className="space-y-6">
            
            {/* Stats Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={<CheckCircle className="text-green-600" size={24} />} 
                label="Completed Projects" 
                value={formData.completedProjects} 
                color="bg-gradient-to-br from-green-50 to-green-100/50" 
              />
              <StatCard 
                icon={<Loader2 className="text-blue-600" size={24} />} 
                label="Ongoing Projects" 
                value={formData.ongoingProjects} 
                color="bg-gradient-to-br from-blue-50 to-blue-100/50" 
              />
              <StatCard 
                icon={<Trophy className="text-yellow-600" size={24} />} 
                label="Sold Out Projects" 
                value={formData.soldOutProjects} 
                color="bg-gradient-to-br from-yellow-50 to-yellow-100/50" 
              />
              <StatCard 
                icon={<Calendar className="text-purple-600" size={24} />} 
                label="Years of Trust" 
                value={formData.yearsOfTrust} 
                color="bg-gradient-to-br from-purple-50 to-purple-100/50" 
              />
            </div>

            {/* Main Content Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    About Us
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 leading-relaxed">
                    {formData.description || 'No description added yet.'}
                  </p>
                  
                  {/* Mission & Vision Preview */}
                  {(formData.mission || formData.vision) && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                      {formData.mission && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Target size={16} className="text-orange-600" />
                            Our Mission
                          </h4>
                          <p className="text-sm text-gray-600">{formData.mission}</p>
                        </div>
                      )}
                      {formData.vision && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Sparkles size={16} className="text-orange-600" />
                            Our Vision
                          </h4>
                          <p className="text-sm text-gray-600">{formData.vision}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Core Values Preview */}
                  {formData.coreValues.some(v => v) && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                        <Users size={16} className="text-orange-600" />
                        Core Values
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.coreValues.filter(v => v).map((value, index) => (
                          <span key={index} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Social Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-br from-gray-900 to-gray-800 text-white">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone size={18} />
                    Get in Touch
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    {formData.phone && (
                      <div className="flex items-center gap-3 text-gray-600 group hover:text-orange-600 transition-colors">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                          <Phone size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm">{formData.phone}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-3 text-gray-600 group hover:text-orange-600 transition-colors">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                          <Mail size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm">{formData.email}</span>
                      </div>
                    )}
                    {formData.whatsapp && (
                      <div className="flex items-center gap-3 text-gray-600 group hover:text-orange-600 transition-colors">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                          <MessageCircle size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm">{formData.whatsapp}</span>
                      </div>
                    )}
                    {formData.address && (
                      <div className="flex items-center gap-3 text-gray-600 group hover:text-orange-600 transition-colors">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                          <MapPin size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm">{formData.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Follow Us</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.facebook && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors group">
                          <Facebook size={18} className="text-gray-600 group-hover:text-blue-600" />
                        </a>
                      )}
                      {formData.instagram && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-pink-100 transition-colors group">
                          <Instagram size={18} className="text-gray-600 group-hover:text-pink-600" />
                        </a>
                      )}
                      {formData.tiktok && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group">
                          <Music2 size={18} className="text-gray-600" />
                        </a>
                      )}
                      {formData.linkedin && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors group">
                          <Linkedin size={18} className="text-gray-600 group-hover:text-blue-700" />
                        </a>
                      )}
                      {formData.youtube && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-red-100 transition-colors group">
                          <Youtube size={18} className="text-gray-600 group-hover:text-red-600" />
                        </a>
                      )}
                      {formData.twitter && (
                        <a href="#" className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors group">
                          <Twitter size={18} className="text-gray-600 group-hover:text-blue-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`${color} p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value || '0'}+</p>
      </div>
    </div>
  </div>
);

export default AdminAboutForm;