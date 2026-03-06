import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Trash2, Edit3, PlusCircle, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, 
  CheckCircle, HelpCircle, User, Youtube, Layout,
  Home, MapPin, DollarSign, Maximize2, Link, Map,
  FileText, Phone, Mail, Star, Award, ChevronDown,
  ChevronUp, Copy, Check, AlertCircle, Globe
} from 'lucide-react';

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#ffffff', '#dc2626', 
  '#ea580c', '#16a34a', '#2563eb', '#7c3aed'
];

const CATEGORIES = ["Apartments", "Residencies", "ROI Projects", "Lands"];
const AVAILABILITY_OPTIONS = ["Available", "Sold Out", "Coming Soon"];

// Cloudflare Configurations
const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
const PROJECTS_R2_URL = "https://pub-33ead4483c43462cbb3f1cc1746f0970.r2.dev";

const AdminProjects: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [, setUploading] = useState(false);
  const [, setInlineUploading] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    media: true,
    floorplans: true,
    advisor: true,
    amenities: true,
    faqs: true,
    tours: true
  });

  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const [formData, setFormData] = useState({
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
    images: [] as { src: string; alt: string; caption: string }[],
    floorPlans: [] as { image: string; name: string }[],
    amenities: [{ name: '' }],
    faqs: [{ question: '', answer: '' }],
    virtualTours: [] as any[],
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
      const imgTag = `\n<img src="${url}" alt="content" style="max-width:100%; height:auto; border-radius:12px; margin:15px 0; display:block;" />\n`;
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
      if (command === 'bold') formatted = `<strong>${selected}</strong>`;
      if (command === 'italic') formatted = `<em>${selected}</em>`;
      if (command === 'color') formatted = `<span style="color: ${value}">${selected}</span>`;
      const newContent = formData.description.substring(0, start) + formatted + formData.description.substring(end);
      setFormData(prev => ({ ...prev, description: newContent }));
    }
  };

  const handleArrayChange = (index: number, field: string, subField: string, value: string) => {
    const updatedArray = [...(formData as any)[field]];
    updatedArray[index][subField] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addField = (field: string) => {
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

  const removeField = (field: string, index: number) => {
    const updatedArray = (formData as any)[field].filter((_: any, i: number) => i !== index);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Home className="text-orange-600" size={32} />
                Project Management
              </h1>
              <p className="text-gray-500">Create and manage your property projects</p>
            </div>
            
            {/* Status Badge */}
            {editId && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-orange-200">
                  <Edit3 size={16} />
                  Editing Mode
                </span>
                <button
                  onClick={resetForm}
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
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Luxury Apartment Complex"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, heroTitle: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hero Title</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Main heading for project page"
                      value={formData.heroTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                    <select
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Availability</label>
                    <select
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    >
                      {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" /> Location *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="City, Area"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-400" /> Price
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="e.g. $500,000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Maximize2 size={14} className="text-gray-400" /> Area
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="e.g. 2,500 sq.ft"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Link size={14} className="text-gray-400" /> Brochure URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                        placeholder="https://example.com/brochure.pdf"
                        value={formData.brochureUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, brochureUrl: e.target.value }))}
                      />
                      {formData.brochureUrl && (
                        <button
                          type="button"
                          onClick={() => handleCopy(formData.brochureUrl, 'brochure')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          {copySuccess === 'brochure' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Map size={14} className="text-gray-400" /> Google Map Embed URL
                    </label>
                    <input
                      type="url"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Paste embed src from Google Maps"
                      value={formData.mapEmbedUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Media Gallery" 
              icon={<ImageIcon size={18} className="text-orange-600" />}
              section="media"
              color="orange"
            />
            
            {expandedSections.media && (
              <div className="p-6 space-y-6">
                {/* Main Image */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Main Cover Image</h4>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                    {formData.image ? (
                      <div className="relative group">
                        <img 
                          src={formData.image} 
                          className="w-full h-64 object-cover rounded-xl" 
                          alt="Main"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
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
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Gallery Images</h4>
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
                        className="hidden"
                        accept="image/*"
                        onChange={handleGalleryUpload}
                      />
                    </label>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={img.src} 
                              className="w-full h-full object-cover" 
                              alt={`Gallery ${idx + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description & Editor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Project Description" 
              icon={<FileText size={18} className="text-orange-600" />}
              section="basic"
              color="orange"
            />
            
            {expandedSections.basic && (
              <div className="p-6">
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-800 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Bold"
                  >
                    <Bold size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Italic"
                  >
                    <Italic size={18} />
                  </button>
                  <div className="w-px h-6 bg-gray-700 mx-1" />
                  <label className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer" title="Insert Image">
                    <ImageIcon size={18} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleInlineImageUpload}
                    />
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Text Color"
                    >
                      <Palette size={18} />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 grid grid-cols-5 gap-1 z-50">
                        {TEXT_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => { formatText('color', color); setShowColorPicker(false); }}
                            className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Textarea */}
                <textarea
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[300px] text-gray-700"
                  value={formData.description}
                  onChange={(e) => { handleCursorTrack(e); setFormData(prev => ({ ...prev, description: e.target.value })); }}
                  onSelect={handleCursorTrack}
                  placeholder="Write your project description here... HTML supported"
                  required
                />
                
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  You can use HTML tags for formatting. Images will be inserted at cursor position.
                </p>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Amenities" 
              icon={<CheckCircle size={18} className="text-orange-600" />}
              section="amenities"
              color="orange"
            />
            
            {expandedSections.amenities && (
              <div className="p-6">
                <div className="space-y-2">
                  {formData.amenities.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="e.g. Swimming Pool"
                        value={item.name}
                        onChange={(e) => handleArrayChange(idx, "amenities", "name", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeField("amenities", idx)}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addField("amenities")}
                  className="mt-4 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Amenity
                </button>
              </div>
            )}
          </div>

          {/* Floor Plans */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Floor Plans" 
              icon={<Layout size={18} className="text-orange-600" />}
              section="floorplans"
              color="orange"
            />
            
            {expandedSections.floorplans && (
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 mb-4">
                  <label className="flex flex-col items-center justify-center py-4 cursor-pointer">
                    <div className="p-3 bg-purple-50 rounded-full mb-2">
                      <PlusCircle size={24} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Add Floor Plan</span>
                    <span className="text-xs text-gray-400">Upload floor plan image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFloorPlanUpload}
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {formData.floorPlans.map((fp, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <img 
                        src={fp.image} 
                        className="w-20 h-20 object-cover rounded-lg" 
                        alt={`Floor plan ${idx + 1}`}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="Floor plan name (e.g. 3 Bedroom)"
                          value={fp.name}
                          onChange={(e) => handleArrayChange(idx, "floorPlans", "name", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFloorPlan(idx)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Advisor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Property Advisor" 
              icon={<User size={18} className="text-orange-600" />}
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
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="John Doe"
                      value={formData.propertyAdvisor.name}
                      onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Senior Property Consultant"
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
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="+94 XX XXX XXXX"
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
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="advisor@company.com"
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
                          alt="Avatar"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, avatar: ''}})}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors">
                        <ImageIcon size={18} className="text-gray-500" />
                        <span className="text-sm text-gray-600">Upload Avatar</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Frequently Asked Questions" 
              icon={<HelpCircle size={18} className="text-orange-600" />}
              section="faqs"
              color="orange"
            />
            
            {expandedSections.faqs && (
              <div className="p-6">
                <div className="space-y-4">
                  {formData.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <input
                          type="text"
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => handleArrayChange(idx, "faqs", "question", e.target.value)}
                        />
                        <textarea
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                          placeholder="Answer"
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleArrayChange(idx, "faqs", "answer", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeField("faqs", idx)}
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
                  onClick={() => addField("faqs")}
                  className="mt-4 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add FAQ
                </button>
              </div>
            )}
          </div>

          {/* Virtual Tours */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Virtual Tours" 
              icon={<Youtube size={18} className="text-orange-600" />}
              section="tours"
              color="orange"
            />
            
            {expandedSections.tours && (
              <div className="p-6">
                <div className="space-y-4">
                  {formData.virtualTours.map((tour, tourIdx) => (
                    <div key={tourIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <input
                          type="url"
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="YouTube URL"
                          value={tour.video || ""}
                          onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "video", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeField("virtualTours", tourIdx)}
                          className="text-red-500 text-xs hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove Tour
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addField("virtualTours")}
                  className="mt-4 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Virtual Tour
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {editId ? 'Updating Project...' : 'Publishing Project...'}
              </>
            ) : (
              <>
                {editId ? <Edit3 size={20} /> : <PlusCircle size={20} />}
                {editId ? 'Update Project' : 'Publish Project'}
              </>
            )}
          </button>
        </form>

        {/* Projects List */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Home size={20} className="text-orange-600" />
            Existing Projects ({projectsList.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={project.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={project.name}
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                  />
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold ${
                    project.availability === 'Available' ? 'bg-green-500 text-white' :
                    project.availability === 'Sold Out' ? 'bg-red-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {project.availability}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{project.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    <MapPin size={12} /> {project.location || 'Location TBD'}
                  </p>
                  
                  {/* Price & Area */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    {project.price && (
                      <span className="font-semibold text-orange-600">{project.price}</span>
                    )}
                    {project.area && (
                      <span className="text-gray-400 text-xs">{project.area}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this project?')) {
                          deleteDoc(doc(db, "projectDetails", project.id));
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

          {projectsList.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No projects yet. Create your first project above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;