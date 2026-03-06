import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { 
  Loader2, Plus, Image as ImageIcon,
  UserCheck, Edit3, Trash2, X, Home,  
  PlusCircle, MessageCircleQuestion, FileText, Globe,
  MapPin, DollarSign, Phone, Mail, Copy, Check,
  ChevronDown, ChevronUp, AlertCircle, Layers,
  Calendar, Award, Star, Users
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
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advisor: true,
    media: true,
    amenities: true,
    faqs: true
  });
  
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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, icon, section, color = "orange" }: any) => (
    <div 
      className={`flex items-center justify-between p-4 bg-gradient-to-r from-${color}-50 to-transparent border-b border-gray-100 cursor-pointer hover:from-${color}-100 transition-colors`}
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <button className="p-1 hover:bg-white rounded-lg transition-colors">
        {expandedSections[section] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Layers className="text-orange-600" size={32} />
                Land Projects Management
              </h1>
              <p className="text-gray-500">Create and manage your land projects</p>
            </div>
            
            {/* Status Badge */}
            {editId && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-orange-200">
                  <Edit3 size={16} />
                  Editing Mode
                </span>
                <button
                  onClick={() => {
                    setEditId(null);
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
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Basic Information" 
              icon={<Home size={18} className="text-orange-600" />}
              section="basic"
              color="orange"
            />
            
            {expandedSections.basic && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Project Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Green Valley Land" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value, title: e.target.value})} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" /> Location *
                    </label>
                    <input 
                      type="text" 
                      placeholder="City, Area" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-400" /> Price
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. $50,000 per perch" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Availability</label>
                    <select 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.availability} 
                      onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    >
                      <option value="Available">Available</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Globe size={14} className="text-gray-400" /> Google Map Embed URL
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Paste the src link from Google Maps Embed iframe..." 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none pr-10" 
                      value={formData.mapEmbedUrl} 
                      onChange={(e) => setFormData({...formData, mapEmbedUrl: e.target.value})} 
                    />
                    {formData.mapEmbedUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.mapEmbedUrl, 'map')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                      >
                        {copySuccess === 'map' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <FileText size={14} className="text-gray-400" /> Description
                  </label>
                  <textarea 
                    placeholder="Enter detailed description of the land project..." 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[120px] resize-none" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Provide details about the land, surroundings, and key features
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Property Advisor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Property Advisor" 
              icon={<UserCheck size={18} className="text-orange-600" />}
              section="advisor"
              color="orange"
            />
            
            {expandedSections.advisor && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Advisor Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.propertyAdvisor.name} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Advisor Title</label>
                    <input 
                      type="text" 
                      placeholder="Senior Land Consultant" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.propertyAdvisor.title} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Phone size={14} className="text-gray-400" /> Phone
                    </label>
                    <input 
                      type="text" 
                      placeholder="+94 XX XXX XXXX" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.propertyAdvisor.phone} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Mail size={14} className="text-gray-400" /> Email
                    </label>
                    <input 
                      type="email" 
                      placeholder="advisor@company.com" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
                      value={formData.propertyAdvisor.email} 
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} 
                    />
                  </div>
                </div>

                {/* Avatar Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Advisor Avatar</label>
                  <div className="flex items-center gap-4">
                    {formData.propertyAdvisor.avatar ? (
                      <div className="relative">
                        <img 
                          src={formData.propertyAdvisor.avatar} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-200" 
                          alt="Advisor avatar"
                        />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, avatar: ""}})} 
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors">
                        <ImageIcon size={18} className="text-gray-500" />
                        <span className="text-sm text-gray-600">Upload Avatar</span>
                        <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                      </label>
                    )}
                    {uploading && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Main Cover Image" 
                icon={<ImageIcon size={18} className="text-orange-600" />}
                section="media"
                color="orange"
              />
              
              {expandedSections.media && (
                <div className="p-6">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {formData.image ? (
                      <div className="relative group">
                        <img 
                          src={formData.image} 
                          className="w-full h-48 object-cover rounded-xl" 
                          alt="Main cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, image: ""})} 
                            className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                        <div className="p-4 bg-orange-50 rounded-full mb-3">
                          <ImageIcon size={32} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 mb-1">Click to upload main image</span>
                        <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                        <input type="file" onChange={handleMainImageChange} className="hidden" accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Gallery Images" 
                icon={<PlusCircle size={18} className="text-orange-600" />}
                section="media"
                color="orange"
              />
              
              {expandedSections.media && (
                <div className="p-6">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    <label className="flex flex-col items-center justify-center py-4 cursor-pointer mb-4">
                      <div className="p-3 bg-green-50 rounded-full mb-2">
                        <PlusCircle size={24} className="text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Add Gallery Images</span>
                      <span className="text-xs text-gray-400">Select multiple images</span>
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleGalleryUpload} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </label>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                        {formData.images.map((img, i) => (
                          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={img.src} 
                              className="h-full w-full object-cover" 
                              alt={img.alt || `Gallery image ${i + 1}`}
                            />
                            <button 
                              type="button" 
                              onClick={() => removeGalleryImage(i)} 
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {uploading && (
                      <div className="flex items-center justify-center gap-2 text-orange-600 mt-4">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Uploading images...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amenities & FAQs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Amenities" 
                icon={<Award size={18} className="text-orange-600" />}
                section="amenities"
                color="orange"
              />
              
              {expandedSections.amenities && (
                <div className="p-6">
                  <div className="space-y-2">
                    {formData.amenities.map((amt, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. 24/7 Security" 
                          className="flex-1 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                          value={amt.name} 
                          onChange={(e) => {
                            const newAmt = [...formData.amenities];
                            newAmt[i].name = e.target.value;
                            setFormData({...formData, amenities: newAmt});
                          }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newAmt = formData.amenities.filter((_, index) => index !== i);
                            setFormData({...formData, amenities: newAmt});
                          }} 
                          className="p-3 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, amenities: [...formData.amenities, {name: ""}]})} 
                    className="mt-4 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Amenity
                  </button>
                </div>
              )}
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="FAQs" 
                icon={<MessageCircleQuestion size={18} className="text-orange-600" />}
                section="faqs"
                color="orange"
              />
              
              {expandedSections.faqs && (
                <div className="p-6">
                  <div className="space-y-4">
                    {formData.faqs.map((faq, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            placeholder="Question" 
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                            value={faq.question} 
                            onChange={(e) => {
                              const newFaq = [...formData.faqs];
                              newFaq[i].question = e.target.value;
                              setFormData({...formData, faqs: newFaq});
                            }} 
                          />
                          <textarea 
                            placeholder="Answer" 
                            rows={2}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none" 
                            value={faq.answer} 
                            onChange={(e) => {
                              const newFaq = [...formData.faqs];
                              newFaq[i].answer = e.target.value;
                              setFormData({...formData, faqs: newFaq});
                            }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newFaq = formData.faqs.filter((_, index) => index !== i);
                              setFormData({...formData, faqs: newFaq});
                            }} 
                            className="text-red-500 text-xs hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove FAQ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, faqs: [...formData.faqs, {question: "", answer: ""}]})} 
                    className="mt-4 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add FAQ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || uploading} 
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {editId ? "Updating Project..." : "Publishing Project..."}
              </>
            ) : (
              <>
                {editId ? <Edit3 size={20} /> : <PlusCircle size={20} />}
                {editId ? "Update Project" : "Publish Project"}
              </>
            )}
          </button>
        </form>

        {/* Existing Land Projects List */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Layers size={20} className="text-orange-600" />
            Existing Land Projects ({landsList.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {landsList.map((land) => (
              <div key={land.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                {/* Land Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={land.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt={land.name}
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'} 
                  />
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold ${
                    land.availability === 'Available' ? 'bg-green-500 text-white' :
                    land.availability === 'Sold Out' ? 'bg-red-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {land.availability}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{land.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <MapPin size={12} /> {land.location || 'Location TBD'}
                  </p>
                  
                  {/* Price */}
                  {land.price && (
                    <div className="mb-3">
                      <span className="font-semibold text-orange-600">{land.price}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        setEditId(land.id); 
                        setFormData(land); 
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }} 
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      onClick={async () => {
                        if(confirm("Are you sure you want to delete this project?")) {
                          await deleteDoc(doc(db,"landProjects",land.id));
                        }
                      }} 
                      className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {landsList.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Layers size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No land projects yet. Create your first project above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLand;