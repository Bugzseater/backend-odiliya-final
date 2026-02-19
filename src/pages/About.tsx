import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Save, Loader2,  Phone,  FileText, 
  CheckCircle, Clock, Trophy, Calendar, MessageCircle, 
  Facebook, Instagram, Linkedin, Music2, Image as ImageIcon 
} from 'lucide-react';

const AdminAboutForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    pinterest: ''
  });

  useEffect(() => {
    const docRef = doc(db, "settings", "aboutPage");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFormData(docSnap.data() as any);
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

  if (fetching) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-10">
      {/* 1. EDIT FORM SECTION */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <FileText className="text-orange-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Edit Dashboard Content</h2>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">About Description</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['completedProjects', 'ongoingProjects', 'soldOutProjects', 'yearsOfTrust'].map((key) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold"
                  value={(formData as any)[key]}
                  onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                />
              </div>
            ))}
          </div>

          {/* Contact & Social Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm border-l-4 border-orange-500 pl-2">Contact & Primary</h4>
              <input type="text" placeholder="Phone Number" className="w-full p-3 border rounded-xl text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <input type="text" placeholder="Address" className="w-full p-3 border rounded-xl text-sm" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <input type="text" placeholder="WhatsApp Number" className="w-full p-3 border rounded-xl text-sm" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} />
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm border-l-4 border-blue-500 pl-2">Social Media Links</h4>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Facebook URL" className="p-3 border rounded-xl text-sm" value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} />
                <input type="text" placeholder="Instagram URL" className="p-3 border rounded-xl text-sm" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} />
                <input type="text" placeholder="TikTok URL" className="p-3 border rounded-xl text-sm" value={formData.tiktok} onChange={(e) => setFormData({...formData, tiktok: e.target.value})} />
                <input type="text" placeholder="LinkedIn URL" className="p-3 border rounded-xl text-sm" value={formData.linkedin} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} />
                <input type="text" placeholder="Pinterest URL" className="col-span-2 p-3 border rounded-xl text-sm" value={formData.pinterest} onChange={(e) => setFormData({...formData, pinterest: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Save & Publish Changes
          </button>
        </form>
      </div>

      {/* 2. LIVE PREVIEW SECTION */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" /> Live Data Preview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<CheckCircle className="text-green-500" />} label="Completed" value={formData.completedProjects} color="bg-green-50" />
          <StatCard icon={<Loader2 className="text-blue-500" />} label="Ongoing" value={formData.ongoingProjects} color="bg-blue-50" />
          <StatCard icon={<Trophy className="text-yellow-600" />} label="Sold Out" value={formData.soldOutProjects} color="bg-yellow-50" />
          <StatCard icon={<Calendar className="text-purple-500" />} label="Years Trust" value={formData.yearsOfTrust} color="bg-purple-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description Preview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">About Text</span>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">"{formData.description}"</p>
          </div>

          {/* Social & Contact Preview */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Contact</span>
              <div className="mt-3 space-y-2">
                <p className="text-sm flex items-center gap-2"><Phone size={14} className="text-blue-400"/> {formData.phone}</p>
                <p className="text-sm flex items-center gap-2"><MessageCircle size={14} className="text-green-400"/> {formData.whatsapp}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Social Presence</span>
              <div className="mt-4 flex flex-wrap gap-3">
                {formData.facebook && <Facebook size={18} className="text-blue-500" />}
                {formData.instagram && <Instagram size={18} className="text-pink-500" />}
                {formData.tiktok && <Music2 size={18} className="text-white" />}
                {formData.linkedin && <Linkedin size={18} className="text-blue-400" />}
                {formData.pinterest && <ImageIcon size={18} className="text-red-500" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`${color} p-5 rounded-2xl border border-white shadow-sm flex items-center gap-4`}>
    <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}+</p>
    </div>
  </div>
);

export default AdminAboutForm;