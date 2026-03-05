import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Trash2, Edit3, PlusCircle, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, CheckCircle, HelpCircle, User, Youtube, Layout,
  Save, MapPin, DollarSign, Home, FileText, Link, Briefcase,
  Phone, Mail, Star,  Clock, Eye, Upload,
  Layers, Building, Map, Tag, Sparkles, Download
} from 'lucide-react';

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#ffffff', 
  '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed',
  '#9333ea', '#db2777', '#0891b2', '#84cc16', '#f97316'
];

const CATEGORIES = ["Apartments", "Residencies", "ROI Projects", "Lands"];
const AVAILABILITY_OPTIONS = ["Available", "Sold Out", "Coming Soon"];

// Cloudflare Configurations
const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
const PROJECTS_R2_URL = "https://pub-33ead4483c43462cbb3f1cc1746f0970.r2.dev";

// Types
interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface FloorPlan {
  image: string;
  name: string;
}

interface Amenity {
  name: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface VirtualTour {
  video: string;
  description?: string;
  thumbnail?: string;
  poster?: string;
  duration?: string;
  details?: { text: string }[];
}

interface PropertyAdvisor {
  name: string;
  title: string;
  phone: string;
  email: string;
  avatar: string;
}

interface ProjectFormData {
  name: string;
  heroTitle: string;
  category: string;
  location: string;
  price: string;
  area: string;
  availability: string;
  brochureUrl: string;
  mapEmbedUrl: string;
  description: string;
  image: string;
  images: GalleryImage[];
  floorPlans: FloorPlan[];
  amenities: Amenity[];
  faqs: FAQ[];
  virtualTours: VirtualTour[];
  propertyAdvisor: PropertyAdvisor;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  createdAt?: any;
  updatedAt?: any;
}

const AdminProjects: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'list'>('editor');

  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    heroTitle: '',
    category: 'Apartments',
    location: '',
    price: '',
    area: '',
    availability: 'Available',
    brochureUrl: '',
    mapEmbedUrl: '',
    description: '',
    image: '',
    images: [],
    floorPlans: [],
    amenities: [{ name: '' }],
    faqs: [{ question: '', answer: '' }],
    virtualTours: [],
    propertyAdvisor: {
      name: '',
      title: '',
      phone: '',
      email: '',
      avatar: ''
    },
    fontFamily: 'inherit',
    fontSize: '16px',
    textColor: '#000000',
    createdAt: null,
    updatedAt: null
  });

  useEffect(() => {
    const q = query(collection(db, "projectDetails"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setProjectsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleCursorTrack = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    cursorPosRef.current = {
      start: t.selectionStart,
      end: t.selectionEnd,
    };
  };

  const uploadToR2 = async (file: File, folder: string) => {
    const fileName = `projects/${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const response = await fetch(`${WORKER_URL}/${fileName}`, {
      method: 'PUT',
      body: file,
      headers: { 
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
    if (!response.ok) throw new Error("R2 upload failed");
    return `${PROJECTS_R2_URL}/${fileName}`;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file, "main");
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert("Main image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadToR2(file, "gallery"));
      const urls = await Promise.all(uploadPromises);
      const newImages = urls.map(url => ({ 
        src: url, 
        alt: formData.name,
        caption: ""
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
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file, "floorplans");
      setFormData(prev => ({
        ...prev,
        floorPlans: [...prev.floorPlans, { image: url, name: "" }]
      }));
    } catch (error) {
      alert("Floor plan upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const removeFloorPlan = (index: number) => {
    setFormData(prev => ({
      ...prev,
      floorPlans: prev.floorPlans.filter((_, i) => i !== index)
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file, "advisors");
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

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    try {
      const url = await uploadToR2(file, "content");
      const start = cursorPosRef.current.start;
      const end = cursorPosRef.current.end;
      const imgTag = `\n<img src="${url}" alt="content" class="rounded-2xl max-w-full h-auto my-4 shadow-xl border border-[#252530]" />\n`;
      setFormData(prev => ({
        ...prev,
        description: prev.description.substring(0, start) + imgTag + prev.description.substring(end),
      }));
      e.target.value = '';
    } catch (error) {
      alert("Inline image upload failed!");
    } finally {
      setInlineUploading(false);
    }
  };

  const formatText = (command: string, value?: string) => {
    const start = cursorPosRef.current.start;
    const end = cursorPosRef.current.end;
    const selected = formData.description.substring(start, end);
    if (selected) {
      let formatted = '';
      if (command === 'bold') formatted = `<strong class="font-bold">${selected}</strong>`;
      if (command === 'italic') formatted = `<em class="italic">${selected}</em>`;
      if (command === 'color') formatted = `<span style="color: ${value}">${selected}</span>`;
      const newContent = formData.description.substring(0, start) + formatted + formData.description.substring(end);
      setFormData(prev => ({ ...prev, description: newContent }));
      
      if (contentRef.current) {
        contentRef.current.focus();
      }
    }
  };

  const handleArrayChange = (index: number, field: keyof ProjectFormData, subField: string, value: string) => {
    const updatedArray = [...(formData[field] as any[])];
    updatedArray[index][subField] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addField = (field: keyof ProjectFormData) => {
    if (field === "faqs") {
      setFormData({ ...formData, [field]: [...formData.faqs, { question: "", answer: "" }] });
    } else if (field === "amenities") {
      setFormData({ ...formData, [field]: [...formData.amenities, { name: "" }] });
    } else if (field === "virtualTours") {
      setFormData({ 
        ...formData, 
        [field]: [...formData.virtualTours, 
          { video: "", description: "", thumbnail: "", poster: "", duration: "", details: [{ text: "" }] }
        ] 
      });
    }
  };

  const removeField = (field: keyof ProjectFormData, index: number) => {
    const updatedArray = (formData[field] as any[]).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanData = {
        ...formData,
        amenities: formData.amenities.filter(a => a.name?.trim() !== ""),
        faqs: formData.faqs.filter(f => f.question?.trim() !== "" && f.answer?.trim() !== ""),
        updatedAt: serverTimestamp()
      };
      if (editId) {
        await updateDoc(doc(db, "projectDetails", editId), cleanData);
        alert("Project Updated! ✨");
      } else {
        await addDoc(collection(db, "projectDetails"), { ...cleanData, createdAt: serverTimestamp() });
        alert("Project Published! ✅");
      }
      resetForm();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', heroTitle: '', category: 'Apartments', location: '', price: '', area: '',
      availability: 'Available', brochureUrl: '', mapEmbedUrl: '', description: '',
      image: '', images: [], floorPlans: [], amenities: [{ name: '' }], faqs: [{ question: '', answer: '' }],
      virtualTours: [], propertyAdvisor: { name: '', title: '', phone: '', email: '', avatar: '' },
      fontFamily: 'inherit', fontSize: '16px', textColor: '#000000', createdAt: null, updatedAt: null
    });
    setEditId(null);
  };

  const handleEdit = (project: any) => {
    setEditId(project.id);
    setFormData({ ...project, floorPlans: project.floorPlans || [] });
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-600/30">
                <Building className="text-blue-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {editId ? 'Edit Project' : 'Create New Project'}
                </h1>
                <p className="text-[#8B8B98] mt-1">
                  {editId ? 'Update existing project details' : 'Add a new real estate project'}
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-[#1A1A24] p-1.5 rounded-2xl border border-[#252530]">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'editor' 
                    ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                    : 'text-[#8B8B98] hover:text-white'
                }`}
              >
                <Edit3 size={18} /> Editor
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'list' 
                    ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
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

        {activeTab === 'editor' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Home size={20} className="text-blue-500" /> Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Project Name */}
                <div className="relative group md:col-span-2">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Project Name *" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, heroTitle: e.target.value }))} 
                    required 
                  />
                </div>

                {/* Hero Title */}
                <div className="relative group md:col-span-2">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Hero Title" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.heroTitle} 
                    onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))} 
                  />
                </div>

                {/* Category & Availability */}
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#1A1A24]">{cat}</option>)}
                  </select>
                </div>

                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <select 
                    value={formData.availability} 
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))} 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white focus:ring-2 focus:ring-blue-600/50 outline-none transition-all appearance-none"
                  >
                    {AVAILABILITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-[#1A1A24]">
                        {opt === 'Available' ? '🟢 ' : opt === 'Sold Out' ? '🔴 ' : '🟡 '}{opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location, Price, Area */}
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Location" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.location} 
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} 
                    required 
                  />
                </div>

                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Price" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.price} 
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} 
                  />
                </div>

                <div className="relative group">
                  <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Area (sq.ft)" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.area} 
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} 
                  />
                </div>

                {/* Brochure URL */}
                <div className="relative group md:col-span-2">
                  <Download className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="url" 
                    placeholder="Brochure URL (PDF link)" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.brochureUrl} 
                    onChange={(e) => setFormData(prev => ({ ...prev, brochureUrl: e.target.value }))} 
                  />
                </div>

                {/* Map Embed URL */}
                <div className="relative group md:col-span-2">
                  <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="url" 
                    placeholder="Google Map Embed URL" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.mapEmbedUrl} 
                    onChange={(e) => setFormData(prev => ({ ...prev, mapEmbedUrl: e.target.value }))} 
                  />
                </div>
              </div>
            </div>

            {/* Main Image & Gallery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Image */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-500" /> Main Cover Image
                  </h3>
                </div>

                {!formData.image ? (
                  <label className="flex flex-col items-center justify-center h-48 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-purple-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group">
                    <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
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
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))} 
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
                  <div className="w-1 h-8 bg-linear-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Layers size={20} className="text-green-500" /> Gallery Images
                  </h3>
                </div>

                <label className="flex items-center justify-center h-24 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-green-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group mb-4">
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleGalleryUpload} 
                  />
                  <div className="flex items-center gap-2">
                    <Upload size={20} className="text-[#8B8B98] group-hover:text-green-500" />
                    <span className="text-sm text-[#8B8B98] group-hover:text-white">Click to upload multiple images</span>
                  </div>
                </label>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <div className="absolute inset-0 bg-linear-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <img 
                          src={img.src} 
                          className="relative w-full h-full object-cover rounded-xl border border-[#252530]" 
                          alt={img.alt || `Gallery ${idx + 1}`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeGalleryImage(idx)} 
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-xl hover:bg-red-700 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Floor Plans */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-linear-to-b from-orange-500 to-red-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Layout size={20} className="text-orange-500" /> Floor Plans
                </h3>
              </div>

              <label className="flex items-center justify-center h-24 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-orange-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group mb-4">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFloorPlanUpload} 
                />
                <div className="flex items-center gap-2">
                  <PlusCircle size={20} className="text-[#8B8B98] group-hover:text-orange-500" />
                  <span className="text-sm text-[#8B8B98] group-hover:text-white">Add Floor Plan</span>
                </div>
              </label>

              <div className="space-y-3">
                {formData.floorPlans.map((fp, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#1A1A24] p-3 rounded-2xl border border-[#252530] group hover:border-orange-600/50 transition-all">
                    <img src={fp.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                    <input 
                      type="text" 
                      placeholder="Floor Plan Name (e.g. 1 BEDROOM)" 
                      className="flex-1 p-3 text-sm bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-orange-600/50 outline-none transition-all"
                      value={fp.name} 
                      onChange={(e) => handleArrayChange(idx, "floorPlans", "name", e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeFloorPlan(idx)} 
                      className="p-2 text-red-500 hover:bg-red-600/20 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Advisor */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User size={20} className="text-blue-500" /> Property Advisor
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Phone Number" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.propertyAdvisor.phone} 
                    onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} 
                  />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    value={formData.propertyAdvisor.email} 
                    onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} 
                  />
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
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Editor */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-linear-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText size={20} className="text-yellow-500" /> Description
                </h3>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#1A1A24] rounded-2xl border border-[#252530]">
                <button 
                  type="button" 
                  onClick={() => formatText('bold')} 
                  className="p-2.5 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white"
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button 
                  type="button" 
                  onClick={() => formatText('italic')} 
                  className="p-2.5 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white"
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowColorPicker(!showColorPicker)} 
                    className="p-2.5 hover:bg-[#252530] rounded-xl transition-all flex items-center gap-1 text-[#8B8B98] hover:text-white"
                    title="Text Color"
                  >
                    <Palette size={18} />
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-[#1A1A24] shadow-2xl rounded-2xl border border-[#252530] grid grid-cols-5 gap-2 z-50">
                      {TEXT_COLORS.map(color => (
                        <button 
                          key={color} 
                          type="button" 
                          onClick={() => { formatText('color', color); setShowColorPicker(false); }} 
                          className="w-8 h-8 rounded-xl border-2 border-transparent hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-8 w-px bg-[#252530] mx-1" />

                <label className="p-2.5 hover:bg-[#252530] rounded-xl transition-all cursor-pointer flex items-center gap-2 text-[#8B8B98] hover:text-blue-500">
                  <ImageIcon size={18} />
                  <span className="text-sm font-medium">
                    {inlineUploading ? 'Uploading...' : 'Add Image'}
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleInlineImageUpload} 
                    disabled={inlineUploading} 
                  />
                </label>

                {inlineUploading && (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>

              <textarea
                ref={contentRef}
                className="w-full p-5 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-yellow-600/50 outline-none min-h-80 font-mono text-sm leading-relaxed resize-y"
                value={formData.description}
                onChange={(e) => { handleCursorTrack(e); setFormData(prev => ({ ...prev, description: e.target.value })); }}
                onSelect={handleCursorTrack}
                placeholder="Write your project description here... HTML tags supported for formatting"
                required
              />
            </div>

            {/* Amenities & FAQs */}
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
                  {formData.amenities.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="relative group flex-1">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-green-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleArrayChange(idx, "amenities", "name", e.target.value)} 
                          className="w-full pl-10 pr-3 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-green-600/50 outline-none transition-all"
                          placeholder="e.g. 24/7 Security"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeField("amenities", idx)} 
                        className="px-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-red-500 hover:bg-red-600/20 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => addField("amenities")} 
                    className="w-full py-3 bg-[#1A1A24] border border-dashed border-[#252530] rounded-xl text-green-500 hover:bg-green-600/10 hover:border-green-600/50 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={18} /> Add Amenity
                  </button>
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-linear-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <HelpCircle size={20} className="text-yellow-500" /> FAQs
                  </h3>
                </div>

                <div className="space-y-4">
                  {formData.faqs.map((faq, idx) => (
                    <div key={idx} className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530] space-y-3">
                      <div className="relative group">
                        <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-yellow-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          value={faq.question} 
                          onChange={(e) => handleArrayChange(idx, "faqs", "question", e.target.value)} 
                          className="w-full pl-10 pr-3 py-3 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-yellow-600/50 outline-none transition-all"
                          placeholder="Question"
                        />
                      </div>
                      <div className="relative group">
                        <FileText className="absolute left-3 top-4 text-[#8B8B98] group-focus-within:text-yellow-500 transition-colors" size={16} />
                        <textarea 
                          value={faq.answer} 
                          onChange={(e) => handleArrayChange(idx, "faqs", "answer", e.target.value)} 
                          className="w-full pl-10 pr-3 py-3 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-yellow-600/50 outline-none transition-all"
                          placeholder="Answer"
                          rows={2}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeField("faqs", idx)} 
                        className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <X size={14} /> Remove FAQ
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => addField("faqs")} 
                    className="w-full py-3 bg-[#1A1A24] border border-dashed border-[#252530] rounded-xl text-yellow-500 hover:bg-yellow-600/10 hover:border-yellow-600/50 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={18} /> Add FAQ
                  </button>
                </div>
              </div>
            </div>

            {/* Virtual Tours */}
            <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Youtube size={20} className="text-purple-500" /> Virtual Tours
                </h3>
              </div>

              <div className="space-y-4">
                {formData.virtualTours.map((tour, tourIdx) => (
                  <div key={tourIdx} className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530]">
                    <div className="relative group">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-purple-500 transition-colors" size={16} />
                      <input 
                        type="url" 
                        value={tour.video || ""} 
                        onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "video", e.target.value)} 
                        className="w-full pl-10 pr-3 py-3 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none transition-all"
                        placeholder="YouTube URL"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeField("virtualTours", tourIdx)} 
                      className="mt-2 text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X size={14} /> Remove Tour
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addField("virtualTours")} 
                  className="w-full py-3 bg-[#1A1A24] border border-dashed border-[#252530] rounded-xl text-purple-500 hover:bg-purple-600/10 hover:border-purple-600/50 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={18} /> Add Virtual Tour
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || uploading || inlineUploading} 
              className="w-full py-6 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 shadow-xl shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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
          /* Projects List View */
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-white">All Projects</h2>
              <div className="ml-auto px-4 py-2 bg-[#1A1A24] rounded-xl border border-[#252530]">
                <span className="text-[#8B8B98] text-sm">Total: </span>
                <span className="text-white font-bold">{projectsList.length}</span>
              </div>
            </div>

            {projectsList.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
                  <Building size={32} className="text-[#8B8B98]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                <p className="text-[#8B8B98]">Create your first project</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsList.map((project) => (
                  <div 
                    key={project.id} 
                    className="group bg-[#1A1A24] rounded-3xl border border-[#252530] hover:border-blue-600/50 transition-all duration-300 overflow-hidden"
                  >
                    {project.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={project.image} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={project.name} 
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-[#1A1A24] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-xl text-xs font-bold ${
                          project.availability === 'Available' 
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                            : project.availability === 'Sold Out'
                            ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                            : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                        }`}>
                          {project.availability}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h4 className="font-bold text-white text-lg mb-2 line-clamp-1">{project.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-[#8B8B98] mb-2">
                        <MapPin size={14} className="text-blue-500" />
                        {project.location || 'No location'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#8B8B98] mb-4">
                        <DollarSign size={14} className="text-green-500" />
                        {project.price || 'Price not set'}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                        <button 
                          onClick={() => handleEdit(project)} 
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-500 rounded-xl hover:bg-blue-600/30 transition-all"
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this project?")) {
                              deleteDoc(doc(db, "projectDetails", project.id));
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

export default AdminProjects;