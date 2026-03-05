import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Save, Loader2, Phone, FileText, 
  CheckCircle,  MessageCircle, 
  Facebook, Instagram, Linkedin, Music2, Image as ImageIcon,
  Edit3, Eye, MapPin, Smartphone, Link2,
  Award,
  TrendingUp, Shield, 
} from 'lucide-react';

// Define the type for form data
interface FormData {
  description: string;
  completedProjects: string;
  ongoingProjects: string;
  soldOutProjects: string;
  yearsOfTrust: string;
  phone: string;
  address: string;
  whatsapp: string;
  facebook: string;
  tiktok: string;
  instagram: string;
  linkedin: string;
  pinterest: string;
  twitter?: string;
  youtube?: string;
  github?: string;
}

// Define props type for StatCard
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  iconColor: string;
  borderColor: string;
}

const AdminAboutForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activePreview, setActivePreview] = useState<'form' | 'preview'>('form');
  const [formData, setFormData] = useState<FormData>({
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
    pinterest: ''
  });

  useEffect(() => {
    const docRef = doc(db, "settings", "aboutPage");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as FormData;
        setFormData(data);
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
      alert("දත්ත සාර්ථකව Update විය! ✅");
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (fetching) return (
    <div className="flex justify-center items-center min-h-100">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full"></div>
        <Loader2 className="animate-spin text-blue-500 relative z-10" size={48} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with View Toggle */}
      <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-orange-600/20 to-red-600/20 rounded-2xl border border-orange-600/30">
            <FileText className="text-orange-500" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">About Page Manager</h1>
            <p className="text-[#8B8B98] mt-1">Edit and preview about page content in real-time</p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-[#1A1A24] p-1.5 rounded-2xl border border-[#252530]">
          <button
            onClick={() => setActivePreview('form')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activePreview === 'form' 
                ? 'bg-linear-to-r from-orange-600 to-red-600 text-white shadow-lg' 
                : 'text-[#8B8B98] hover:text-white'
            }`}
          >
            <Edit3 size={18} /> Edit Form
          </button>
          <button
            onClick={() => setActivePreview('preview')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activePreview === 'preview' 
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-[#8B8B98] hover:text-white'
            }`}
          >
            <Eye size={18} /> Live Preview
          </button>
        </div>
      </div>

      {activePreview === 'form' ? (
        /* EDIT FORM SECTION - DARK THEME */
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#252530]">
            <div className="p-2 bg-orange-600/20 rounded-xl">
              <FileText className="text-orange-500" size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Dashboard Content</h2>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#8B8B98] mb-3 uppercase tracking-wider">
                About Description
              </label>
              <textarea
                className="w-full p-5 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-orange-600/50 outline-none transition-all"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Write a compelling description about your company..."
              />
            </div>

            {/* Stats Grid */}
            <div>
              <h3 className="text-sm font-semibold text-[#8B8B98] mb-4 uppercase tracking-wider">
                Key Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'completedProjects' as const, icon: <CheckCircle size={16} />, label: 'Completed Projects' },
                  { key: 'ongoingProjects' as const, icon: <TrendingUp size={16} />, label: 'Ongoing Projects' },
                  { key: 'soldOutProjects' as const, icon: <Award size={16} />, label: 'Sold Out Projects' },
                  { key: 'yearsOfTrust' as const, icon: <Shield size={16} />, label: 'Years of Trust' }
                ].map(({ key, icon, label }) => (
                  <div key={key} className="bg-[#1A1A24] p-5 rounded-2xl border border-[#252530] group hover:border-orange-600/50 transition-all">
                    <label className="text-[10px] font-bold text-[#8B8B98] uppercase mb-2 flex items-center gap-1">
                      {icon}
                      {label}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-transparent text-2xl font-bold text-white border-b border-[#252530] focus:border-orange-600 outline-none py-2 transition-all"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Social Links */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div className="space-y-5">
                <h4 className="font-bold text-white text-base flex items-center gap-2 border-l-4 border-orange-600 pl-3">
                  <Phone size={18} className="text-orange-500" /> Contact & Primary
                </h4>
                <div className="space-y-4">
                  {[
                    { icon: <Smartphone size={18} />, placeholder: "Phone Number", key: 'phone' as const },
                    { icon: <MapPin size={18} />, placeholder: "Address", key: 'address' as const },
                    { icon: <MessageCircle size={18} />, placeholder: "WhatsApp Number", key: 'whatsapp' as const }
                  ].map((field) => (
                    <div key={field.key} className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-orange-500 transition-colors">
                        {field.icon}
                      </div>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-orange-600/50 outline-none transition-all"
                        value={formData[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-5">
                <h4 className="font-bold text-white text-base flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  <Link2 size={18} className="text-blue-500" /> Social Media Links
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Facebook size={18} />, placeholder: "Facebook URL", key: 'facebook' as const },
                    { icon: <Instagram size={18} />, placeholder: "Instagram URL", key: 'instagram' as const },
                    { icon: <Music2 size={18} />, placeholder: "TikTok URL", key: 'tiktok' as const },
                    { icon: <Linkedin size={18} />, placeholder: "LinkedIn URL", key: 'linkedin' as const },
                    { icon: <ImageIcon size={18} />, placeholder: "Pinterest URL", key: 'pinterest' as const }
                  ].map((field) => (
                    <div key={field.key} className="relative group col-span-2 md:col-span-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors">
                        {field.icon}
                      </div>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        className="w-full pl-10 pr-3 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all text-sm"
                        value={formData[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex items-center justify-center gap-3 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-5 rounded-2xl font-bold transition-all shadow-lg shadow-orange-600/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Save & Publish Changes
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* LIVE PREVIEW SECTION - DARK THEME */
        <div className="space-y-8">
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-8 pb-6 border-b border-[#252530]">
              <div className="p-2 bg-blue-600/20 rounded-xl">
                <Eye size={20} className="text-blue-500" />
              </div>
              Live Preview
            </h3>

            {/* Stats Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <StatCard 
                icon={<CheckCircle size={24} />} 
                label="Completed" 
                value={formData.completedProjects} 
                color="from-green-600/20 to-green-600/5" 
                iconColor="text-green-500"
                borderColor="border-green-600/30"
              />
              <StatCard 
                icon={<TrendingUp size={24} />} 
                label="Ongoing" 
                value={formData.ongoingProjects} 
                color="from-blue-600/20 to-blue-600/5" 
                iconColor="text-blue-500"
                borderColor="border-blue-600/30"
              />
              <StatCard 
                icon={<Award size={24} />} 
                label="Sold Out" 
                value={formData.soldOutProjects} 
                color="from-yellow-600/20 to-yellow-600/5" 
                iconColor="text-yellow-500"
                borderColor="border-yellow-600/30"
              />
              <StatCard 
                icon={<Shield size={24} />} 
                label="Years Trust" 
                value={formData.yearsOfTrust} 
                color="from-purple-600/20 to-purple-600/5" 
                iconColor="text-purple-500"
                borderColor="border-purple-600/30"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description Preview */}
              <div className="lg:col-span-2 bg-linear-to-br from-[#1A1A24] to-[#13131A] p-8 rounded-3xl border border-[#252530] shadow-xl">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 bg-linear-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <span className="text-xs font-bold text-[#8B8B98] uppercase tracking-widest">About Description</span>
                </div>
                <p className="text-[#E0E0E0] text-base leading-relaxed">
                  "{formData.description || 'No description provided yet...'}"
                </p>
                {!formData.description && (
                  <p className="text-[#4A4A5A] italic mt-3">Add a description in the edit form</p>
                )}
              </div>

              {/* Contact & Social Preview */}
              <div className="bg-linear-to-br from-[#0A0A0F] to-[#13131A] p-8 rounded-3xl border border-[#252530] shadow-xl space-y-8">
                {/* Contact Section */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-6 bg-linear-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    <span className="text-xs font-bold text-[#8B8B98] uppercase tracking-[0.2em]">Contact Info</span>
                  </div>
                  <div className="space-y-4">
                    {formData.phone ? (
                      <p className="text-sm flex items-center gap-3 text-[#E0E0E0] bg-[#1A1A24] p-3 rounded-xl border border-[#252530]">
                        <Smartphone size={16} className="text-blue-500" />
                        {formData.phone}
                      </p>
                    ) : (
                      <p className="text-sm text-[#4A4A5A] italic">No phone number added</p>
                    )}
                    {formData.address ? (
                      <p className="text-sm flex items-center gap-3 text-[#E0E0E0] bg-[#1A1A24] p-3 rounded-xl border border-[#252530]">
                        <MapPin size={16} className="text-purple-500" />
                        {formData.address}
                      </p>
                    ) : (
                      <p className="text-sm text-[#4A4A5A] italic">No address added</p>
                    )}
                    {formData.whatsapp ? (
                      <p className="text-sm flex items-center gap-3 text-[#E0E0E0] bg-[#1A1A24] p-3 rounded-xl border border-[#252530]">
                        <MessageCircle size={16} className="text-green-500" />
                        {formData.whatsapp}
                      </p>
                    ) : (
                      <p className="text-sm text-[#4A4A5A] italic">No WhatsApp number added</p>
                    )}
                  </div>
                </div>

                {/* Social Presence */}
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-6 bg-linear-to-b from-pink-500 to-orange-500 rounded-full"></div>
                    <span className="text-xs font-bold text-[#8B8B98] uppercase tracking-[0.2em]">Social Media</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formData.facebook && (
                      <div className="group relative">
                        <div className="p-3 bg-[#1A1A24] rounded-xl border border-[#252530] group-hover:border-blue-600/50 transition-all">
                          <Facebook size={20} className="text-blue-500" />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1A1A24] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap border border-[#252530]">
                          Facebook
                        </span>
                      </div>
                    )}
                    {formData.instagram && (
                      <div className="group relative">
                        <div className="p-3 bg-[#1A1A24] rounded-xl border border-[#252530] group-hover:border-pink-600/50 transition-all">
                          <Instagram size={20} className="text-pink-500" />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1A1A24] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-all border border-[#252530]">
                          Instagram
                        </span>
                      </div>
                    )}
                    {formData.tiktok && (
                      <div className="group relative">
                        <div className="p-3 bg-[#1A1A24] rounded-xl border border-[#252530] group-hover:border-white/50 transition-all">
                          <Music2 size={20} className="text-white" />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1A1A24] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-all border border-[#252530]">
                          TikTok
                        </span>
                      </div>
                    )}
                    {formData.linkedin && (
                      <div className="group relative">
                        <div className="p-3 bg-[#1A1A24] rounded-xl border border-[#252530] group-hover:border-blue-600/50 transition-all">
                          <Linkedin size={20} className="text-blue-400" />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1A1A24] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-all border border-[#252530]">
                          LinkedIn
                        </span>
                      </div>
                    )}
                    {formData.pinterest && (
                      <div className="group relative">
                        <div className="p-3 bg-[#1A1A24] rounded-xl border border-[#252530] group-hover:border-red-600/50 transition-all">
                          <ImageIcon size={20} className="text-red-500" />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1A1A24] text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-all border border-[#252530]">
                          Pinterest
                        </span>
                      </div>
                    )}
                    {!formData.facebook && !formData.instagram && !formData.tiktok && 
                     !formData.linkedin && !formData.pinterest && (
                      <p className="text-[#4A4A5A] text-sm italic">No social links added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated StatCard for dark theme with proper typing
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, iconColor, borderColor }) => (
  <div className={`bg-linear-to-br ${color} p-6 rounded-3xl border ${borderColor} shadow-xl hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center gap-4">
      <div className={`p-4 bg-[#1A1A24] rounded-2xl border ${borderColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-xs font-medium text-[#8B8B98] uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-white mt-1">{value || '0'}+</p>
      </div>
    </div>
  </div>
);

export default AdminAboutForm;