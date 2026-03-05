import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { 
  Loader2, Plus, Image as ImageIcon,
  UserCheck, Edit3, Trash2, X, Home,  
  PlusCircle, MessageCircleQuestion, FileText, Globe,
  MapPin, DollarSign, CheckCircle, Star,
  Phone, Mail, User, Layers,
  Eye, Save, Upload, Briefcase, Shield
} from "lucide-react";

// Define types for better type safety
interface GalleryImage {
  src: string;
  alt: string;
}

interface PropertyAdvisor {
  name: string;
  title: string;
  phone: string;
  email: string;
  avatar: string;
}

interface Amenity {
  name: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface LandFormData {
  name: string;
  title: string;
  location: string;
  price: string;
  availability: string;
  description: string;
  mapEmbedUrl: string;
  image: string;
  propertyAdvisor: PropertyAdvisor;
  amenities: Amenity[];
  faqs: FAQ[];
  images: GalleryImage[];
}

interface LandProject extends LandFormData {
  id: string;
}

const AddLand = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [landsList, setLandsList] = useState<LandProject[]>([]); 
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  
  // --- Cloudflare Configurations ---
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const LANDS_R2_URL = "https://pub-b71da939312c4b00a5ab8f97f5ea5f37.r2.dev"; 
  // ---------------------------------

  const [formData, setFormData] = useState<LandFormData>({
    name: "",
    title: "",
    location: "",
    price: "",
    availability: "Available",
    description: "",
    mapEmbedUrl: "",
    image: "", 
    propertyAdvisor: { 
      name: "", 
      title: "", 
      phone: "", 
      email: "", 
      avatar: "" 
    },
    amenities: [{ name: "" }],
    faqs: [{ question: "", answer: "" }],
    images: [] 
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "landProjects")), (snapshot) => {
      const lands = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as LandProject));
      setLandsList(lands);
    });
    return () => unsub();
  }, []);

  const uploadToR2 = async (file: File): Promise<string> => {
    const fileName = `lands/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const response = await fetch(`${WORKER_URL}/${fileName}`, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    if (!response.ok) throw new Error("Cloudflare upload failed");
    return `${LANDS_R2_URL}/${fileName}`;
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert("Main image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(file => uploadToR2(file));
      const urls = await Promise.all(uploadPromises);
      const newImages: GalleryImage[] = urls.map(url => ({ 
        src: url, 
        alt: formData.name || 'Gallery image' 
      }));
      
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...newImages] 
      }));
    } catch (error) {
      alert("Gallery upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file);
      setFormData(prev => ({ 
        ...prev, 
        propertyAdvisor: { ...prev.propertyAdvisor, avatar: url } 
      }));
    } catch (error) {
      alert("Avatar upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean up empty amenities and FAQs before saving
      const cleanData = {
        ...formData,
        amenities: formData.amenities.filter(a => a.name.trim() !== ""),
        faqs: formData.faqs.filter(f => f.question.trim() !== "" && f.answer.trim() !== "")
      };

      if (editId) {
        await updateDoc(doc(db, "landProjects", editId), cleanData);
        alert("Updated! ✅");
      } else {
        await addDoc(collection(db, "landProjects"), cleanData);
        alert("Published! ✅");
      }
      
      // Reset form after successful submission
      setFormData({
        name: "",
        title: "",
        location: "",
        price: "",
        availability: "Available",
        description: "",
        mapEmbedUrl: "",
        image: "",
        propertyAdvisor: { name: "", title: "", phone: "", email: "", avatar: "" },
        amenities: [{ name: "" }],
        faqs: [{ question: "", answer: "" }],
        images: []
      });
      setEditId(null);
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-emerald-600/20 to-green-600/20 rounded-2xl border border-emerald-600/30">
                <Home className="text-emerald-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {editId ? 'Edit Land Project' : 'Create Land Project'}
                </h1>
                <p className="text-[#8B8B98] mt-1">
                  {editId ? 'Update existing land project' : 'Add new land development project'}
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-[#1A1A24] p-1.5 rounded-2xl border border-[#252530]">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'form' 
                    ? 'bg-linear-to-r from-emerald-600 to-green-600 text-white shadow-lg' 
                    : 'text-[#8B8B98] hover:text-white'
                }`}
              >
                <Layers size={18} /> Editor
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'list' 
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-[#8B8B98] hover:text-white'
                }`}
              >
                <Eye size={18} /> View Projects
              </button>
            </div>
          </div>

          {editId && (
            <div className="mt-6 p-4 bg-blue-600/10 rounded-2xl border border-blue-600/30">
              <p className="text-blue-400 flex items-center gap-2">
                <Edit3 size={16} />
                Editing: <span className="font-bold text-white">{formData.name}</span>
              </p>
            </div>
          )}
        </div>

        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Basic Information & Map Link */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-linear-to-b from-emerald-500 to-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Home size={20} className="text-emerald-500" /> Basic Details & Map Location
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Project Name */}
                <div className="relative group md:col-span-2">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Project Name" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-emerald-600/50 outline-none transition-all"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value, title: e.target.value})} 
                    required 
                  />
                </div>

                {/* Location */}
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Location (City)" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-emerald-600/50 outline-none transition-all"
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  />
                </div>

                {/* Price */}
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Price Info" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-emerald-600/50 outline-none transition-all"
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  />
                </div>

                {/* Availability */}
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white focus:ring-2 focus:ring-emerald-600/50 outline-none transition-all appearance-none"
                    value={formData.availability} 
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  >
                    <option value="Available" className="bg-[#1A1A24] text-green-400">🟢 Available</option>
                    <option value="Sold Out" className="bg-[#1A1A24] text-red-400">🔴 Sold Out</option>
                  </select>
                </div>

                {/* Map Embed URL */}
                <div className="relative group md:col-span-2">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Google Map Embed Link (iframe src)" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-emerald-600/50 outline-none transition-all"
                    value={formData.mapEmbedUrl} 
                    onChange={(e) => setFormData({...formData, mapEmbedUrl: e.target.value})} 
                  />
                </div>

                {/* Description */}
                <div className="relative group md:col-span-2">
                  <FileText className="absolute left-4 top-5 text-[#8B8B98] group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <textarea 
                    placeholder="Enter detailed description of the land project..." 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-emerald-600/50 outline-none min-h-30 transition-all"
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* 2. Property Advisor */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-blue-500" /> Property Advisor
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Advisor Name" 
                      className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                      value={formData.propertyAdvisor.name} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})} 
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Phone" 
                      className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                      value={formData.propertyAdvisor.phone} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Advisor Title" 
                      className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                      value={formData.propertyAdvisor.title} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}})} 
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      placeholder="Advisor Email" 
                      className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                      value={formData.propertyAdvisor.email} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} 
                    />
                  </div>
                </div>

                {/* Avatar Upload */}
                <div className="md:col-span-2">
                  <div className="bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl p-6 hover:border-blue-600/50 transition-all">
                    <p className="text-sm text-[#8B8B98] mb-4 flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-500" />
                      Advisor Photo
                    </p>
                    <div className="flex flex-col items-center">
                      <input 
                        type="file" 
                        onChange={handleAvatarUpload} 
                        className="text-sm text-[#8B8B98] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-600/20 file:text-blue-500 hover:file:bg-blue-600/30 cursor-pointer"
                        accept="image/*" 
                      />
                      {formData.propertyAdvisor.avatar && (
                        <div className="relative mt-4">
                          <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50"></div>
                          <img 
                            src={formData.propertyAdvisor.avatar} 
                            className="relative w-20 h-20 rounded-full object-cover border-2 border-blue-600/50" 
                            alt="Advisor avatar"
                          />
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, avatar: ""}})} 
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-all shadow-lg"
                          >
                            <X size={12}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Media (Main & Gallery) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Cover Image */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-500" /> Main Cover Image
                  </h3>
                </div>

                {!formData.image ? (
                  <label className="flex flex-col items-center justify-center h-48 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-purple-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group">
                    <input type="file" onChange={handleMainImageChange} className="hidden" accept="image/*" />
                    <Upload size={32} className="text-[#8B8B98] group-hover:text-purple-500 mb-2" />
                    <p className="text-sm text-[#8B8B98] group-hover:text-white">Click to upload cover image</p>
                  </label>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
                    <img 
                      src={formData.image} 
                      className="relative w-full h-48 object-cover rounded-2xl border border-[#252530]"
                      alt="Main cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, image: ""})} 
                        className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-all shadow-lg"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-orange-500 to-red-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PlusCircle size={20} className="text-orange-500" /> Gallery Images
                  </h3>
                </div>

                <label className="flex items-center justify-center h-24 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-orange-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group mb-4">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleGalleryUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div className="flex items-center gap-2">
                    <Upload size={20} className="text-[#8B8B98] group-hover:text-orange-500" />
                    <span className="text-sm text-[#8B8B98] group-hover:text-white">Click to upload multiple images</span>
                  </div>
                </label>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <div className="absolute inset-0 bg-linear-to-r from-orange-600 to-red-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <img 
                          src={img.src} 
                          className="relative w-full h-full object-cover rounded-xl border border-[#252530]"
                          alt={img.alt || `Gallery ${i + 1}`}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeGalleryImage(i)} 
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-xl hover:bg-red-700 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Amenities & FAQs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Amenities */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" /> Amenities
                  </h3>
                </div>

                <div className="space-y-3">
                  {formData.amenities.map((amt, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="relative group flex-1">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-green-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          placeholder="e.g. 24/7 Security" 
                          className="w-full pl-10 pr-3 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-green-600/50 outline-none transition-all"
                          value={amt.name} 
                          onChange={(e) => {
                            const newAmt = [...formData.amenities];
                            newAmt[i].name = e.target.value;
                            setFormData({...formData, amenities: newAmt});
                          }} 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, amenities: [...formData.amenities, {name: ""}]})} 
                        className="px-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-green-500 hover:bg-green-600/20 transition-all"
                      >
                        <Plus size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageCircleQuestion size={20} className="text-yellow-500" /> Frequently Asked Questions
                  </h3>
                </div>

                <div className="space-y-4">
                  {formData.faqs.map((faq, i) => (
                    <div key={i} className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530] space-y-3">
                      <div className="relative group">
                        <MessageCircleQuestion className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-yellow-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          placeholder="Question" 
                          className="w-full pl-10 pr-3 py-3 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-yellow-600/50 outline-none transition-all"
                          value={faq.question} 
                          onChange={(e) => {
                            const newFaq = [...formData.faqs];
                            newFaq[i].question = e.target.value;
                            setFormData({...formData, faqs: newFaq});
                          }} 
                        />
                      </div>
                      <div className="relative group">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-yellow-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          placeholder="Answer" 
                          className="w-full pl-10 pr-3 py-3 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-yellow-600/50 outline-none transition-all"
                          value={faq.answer} 
                          onChange={(e) => {
                            const newFaq = [...formData.faqs];
                            newFaq[i].answer = e.target.value;
                            setFormData({...formData, faqs: newFaq});
                          }} 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, faqs: [...formData.faqs, {question: "", answer: ""}]})} 
                        className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> Add another FAQ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || uploading} 
              className="w-full py-6 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 shadow-xl shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={22} />
                  {editId ? "Updating Project..." : "Publishing Project..."}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save size={22} />
                  {editId ? "Update Project" : "Publish Project"}
                </div>
              )}
            </button>
          </form>
        ) : (
          /* Existing Land Projects List */
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-white">Existing Land Projects</h2>
              <div className="ml-auto px-4 py-2 bg-[#1A1A24] rounded-xl border border-[#252530]">
                <span className="text-[#8B8B98] text-sm">Total: </span>
                <span className="text-white font-bold">{landsList.length}</span>
              </div>
            </div>

            {landsList.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
                  <Home size={32} className="text-[#8B8B98]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                <p className="text-[#8B8B98]">Create your first land project</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landsList.map((land) => (
                  <div 
                    key={land.id} 
                    className="group bg-[#1A1A24] rounded-3xl border border-[#252530] hover:border-emerald-600/50 transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={land.image || 'https://via.placeholder.com/300'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={land.name}
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300'} 
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#1A1A24] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-xs font-bold ${
                        land.availability === 'Available' 
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                          : 'bg-red-600/20 text-red-400 border border-red-600/30'
                      }`}>
                        {land.availability}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="font-bold text-white text-lg mb-2">{land.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-[#8B8B98] mb-4">
                        <MapPin size={14} className="text-emerald-500" />
                        {land.location || 'No location'}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                        <button 
                          onClick={() => {
                            setEditId(land.id); 
                            setFormData(land); 
                            setActiveTab('form');
                            window.scrollTo({top: 0, behavior: 'smooth'});
                          }} 
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-500 rounded-xl hover:bg-blue-600/30 transition-all"
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button 
                          onClick={async () => {
                            if(confirm("Are you sure you want to delete this project?")) {
                              await deleteDoc(doc(db,"landProjects",land.id));
                            }
                          }} 
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-all"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddLand;