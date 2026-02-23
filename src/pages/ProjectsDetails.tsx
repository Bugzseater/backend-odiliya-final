import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Trash2, Edit3, PlusCircle, Home, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, MapPin, DollarSign, Square, 
  CheckCircle, HelpCircle, User, Youtube, Globe, FileText
} from 'lucide-react';

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#ffffff', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'
];

const CATEGORIES = ["Apartments", "Residencies", "ROI Projects", "Lands"];
const AVAILABILITY_OPTIONS = ["Available", "Sold Out", "Coming Soon"];

const AdminProjects: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Cursor position save කරන්න ref
  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    heroTitle: '',
    category: 'Apartments',
    location: '',
    price: '',
    area: '',
    availability: 'Available',
    brochureUrl: '',
    mapEmbedUrl: '',
    
    // Content
    description: '',
    
    // Images
    image: '',
    images: [],
    
    // Arrays
    amenities: [{ name: '' }],
    faqs: [{ question: '', answer: '' }],
    virtualTours: [],
    
    // Property Advisor
    propertyAdvisor: {
      name: '',
      title: '',
      phone: '',
      email: '',
      avatar: ''
    },
    
    // Styling
    fontFamily: 'inherit',
    fontSize: '16px',
    textColor: '#000000',
    
    // Timestamps
    createdAt: null,
    updatedAt: null
  });

  // Fetch projects
  useEffect(() => {
    const q = query(collection(db, "projectDetails"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setProjectsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Cursor position track කරන handler
  const handleCursorTrack = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    cursorPosRef.current = {
      start: t.selectionStart,
      end: t.selectionEnd,
    };
  };

  // ========== IMAGE UPLOADS ==========
  const uploadImage = async (file: File, path: string) => {
    const storageRef = ref(storage, `projects/${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Main Image Upload
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "main");
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert("Main image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // Gallery Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file, "gallery"));
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

  // Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "advisors");
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

  // Tour Thumbnail Upload
  const handleTourThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, tourIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "tours");
      const updatedTours = [...formData.virtualTours];
      updatedTours[tourIndex].thumbnail = url;
      updatedTours[tourIndex].poster = url;
      setFormData({ ...formData, virtualTours: updatedTours });
    } catch (error) {
      alert("Tour thumbnail upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // Inline Image Upload (to description)
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    try {
      const url = await uploadImage(file, "content");
      const start = cursorPosRef.current.start;
      const end = cursorPosRef.current.end;

      const imgTag = `\n<img src="${url}" alt="content" style="max-width:100%; height:auto; border-radius:12px; margin:15px 0; display:block;" />\n`;

      setFormData(prev => ({
        ...prev,
        description: prev.description.substring(0, start) + imgTag + prev.description.substring(end),
      }));

      e.target.value = '';
      const newPos = start + imgTag.length;
      cursorPosRef.current = { start: newPos, end: newPos };

    } catch (error) {
      alert("Inline image upload failed!");
    } finally {
      setInlineUploading(false);
    }
  };

  // ========== TEXT FORMATTING ==========
  const formatText = (command: string, value?: string) => {
    const start = cursorPosRef.current.start;
    const end = cursorPosRef.current.end;
    const selected = formData.description.substring(start, end);

    if (selected) {
      let formatted = '';
      if (command === 'bold') formatted = `<strong>${selected}</strong>`;
      if (command === 'italic') formatted = `<em>${selected}</em>`;
      if (command === 'color') formatted = `<span style="color: ${value}">${selected}</span>`;
      if (command === 'list') formatted = `<ul>\n<li>${selected}</li>\n</ul>`;

      const newContent = formData.description.substring(0, start) + formatted + formData.description.substring(end);
      setFormData(prev => ({ ...prev, description: newContent }));

      const newPos = start + formatted.length;
      cursorPosRef.current = { start: newPos, end: newPos };
    }
  };

  // ========== ARRAY FIELD HANDLERS ==========
  const handleArrayChange = (index: number, field: string, subField: string, value: string) => {
    const updatedArray = [...formData[field]];
    updatedArray[index][subField] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addField = (field: string) => {
    if (field === "faqs") {
      setFormData({ ...formData, [field]: [...formData[field], { question: "", answer: "" }] });
    } else if (field === "amenities") {
      setFormData({ ...formData, [field]: [...formData[field], { name: "" }] });
    } else if (field === "virtualTours") {
      setFormData({ 
        ...formData, 
        [field]: [...formData[field], 
          { 
            video: "", 
            description: "", 
            thumbnail: "", 
            poster: "", 
            duration: "", 
            details: [{ text: "" }] 
          }
        ] 
      });
    }
  };

  const removeField = (field: string, index: number) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addTourDetail = (tourIndex: number) => {
    const updatedTours = [...formData.virtualTours];
    updatedTours[tourIndex].details.push({ text: "" });
    setFormData({ ...formData, virtualTours: updatedTours });
  };

  const removeTourDetail = (tourIndex: number, detailIndex: number) => {
    const updatedTours = [...formData.virtualTours];
    updatedTours[tourIndex].details = updatedTours[tourIndex].details.filter((_, i) => i !== detailIndex);
    setFormData({ ...formData, virtualTours: updatedTours });
  };

  // ========== SUBMIT ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean data
      const cleanData = {
        ...formData,
        amenities: formData.amenities.filter(a => a.name?.trim() !== ""),
        faqs: formData.faqs.filter(f => f.question?.trim() !== "" && f.answer?.trim() !== ""),
        virtualTours: formData.virtualTours.filter(t => t.video?.trim() !== ""),
        updatedAt: serverTimestamp()
      };

      if (editId) {
        await updateDoc(doc(db, "projectDetails", editId), cleanData);
        alert("Project Updated! ✨");
      } else {
        await addDoc(collection(db, "projectDetails"), { 
          ...cleanData, 
          createdAt: serverTimestamp() 
        });
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
    setEditId(null);
    cursorPosRef.current = { start: 0, end: 0 };
  };

  const handleEdit = (project: any) => {
    setEditId(project.id);
    setFormData({ ...project });
    cursorPosRef.current = { start: 0, end: 0 };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
          {editId ? <Edit3 className="text-orange-500" /> : <PlusCircle className="text-blue-600" />}
          {editId ? "Edit Project" : "Add New Project"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ===== LEFT SIDE: Metadata ===== */}
          <div className="space-y-5">
            {/* Project Name */}
            <input
              type="text"
              placeholder="Project Name *"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                name: e.target.value,
                heroTitle: e.target.value // Auto-fill heroTitle
              }))}
              required
            />

            {/* Hero Title */}
            <input
              type="text"
              placeholder="Hero Title"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
              value={formData.heroTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
            />

            {/* Category & Availability */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                className="p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Location & Price & Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>

              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Price"
                  className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div className="relative">
                <Square className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Area"
                  className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
            </div>

            {/* Brochure URL & Map URL */}
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                placeholder="Brochure URL (Google Drive)"
                className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                value={formData.brochureUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, brochureUrl: e.target.value }))}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                placeholder="Google Map Embed URL"
                className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                value={formData.mapEmbedUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
              />
            </div>

            {/* Main Image Upload */}
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-3xl text-center bg-slate-50 relative group">
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} className="w-full h-48 object-cover rounded-2xl shadow-sm" alt="Main" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-10">
                  <div className="p-4 bg-white rounded-full shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {uploading ? "Uploading..." : "Add Main Image"}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                </label>
              )}
            </div>

            {/* Gallery Upload */}
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-3xl text-center bg-slate-50">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-full shadow-sm text-green-600">
                  <ImageIcon size={24} />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {uploading ? "Uploading..." : "Add Gallery Images (Multiple)"}
                </span>
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
              </label>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {formData.images.map((img, idx) => (
                    <img key={idx} src={img.src} className="h-16 object-cover rounded-lg border" alt="" />
                  ))}
                </div>
              )}
            </div>

            {/* Property Advisor Section */}
            <div className="bg-blue-50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                <User size={18} /> Property Advisor
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  className="p-3 bg-white border-none rounded-xl"
                  value={formData.propertyAdvisor.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}
                  })}
                />
                <input
                  type="text"
                  placeholder="Title"
                  className="p-3 bg-white border-none rounded-xl"
                  value={formData.propertyAdvisor.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}
                  })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="p-3 bg-white border-none rounded-xl"
                  value={formData.propertyAdvisor.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}
                  })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="p-3 bg-white border-none rounded-xl"
                  value={formData.propertyAdvisor.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}
                  })}
                />
              </div>
              
              {/* Avatar Upload */}
              <div className="mt-3">
                <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-600">
                  <ImageIcon size={16} />
                  Upload Avatar
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
                {formData.propertyAdvisor.avatar && (
                  <img src={formData.propertyAdvisor.avatar} className="w-10 h-10 rounded-full mt-2 border" alt="Avatar" />
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT SIDE: Content ===== */}
          <div className="space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-2 text-white hover:bg-slate-700 rounded-lg"
                title="Bold"
              >
                <Bold size={18} />
              </button>

              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-2 text-white hover:bg-slate-700 rounded-lg"
                title="Italic"
              >
                <Italic size={18} />
              </button>

              <div className="h-6 w-[1px] bg-slate-600 mx-1 self-center" />

              <label
                className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Insert Image into Description"
              >
                {inlineUploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                <input type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} />
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 text-white hover:bg-slate-700 rounded-lg"
                  title="Text Color"
                >
                  <Palette size={18} />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-2xl z-50 grid grid-cols-5 gap-1 w-40">
                    {TEXT_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => { formatText('color', c); setShowColorPicker(false); }}
                        className="w-6 h-6 rounded-full cursor-pointer border border-slate-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description Textarea */}
            <textarea
              placeholder="Write project description here... (Use Enter for new lines)"
              className="w-full p-5 bg-white border border-slate-200 rounded-3xl h-64 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium resize-none"
              value={formData.description}
              onChange={(e) => {
                handleCursorTrack(e);
                setFormData(prev => ({ ...prev, description: e.target.value }));
              }}
              onSelect={handleCursorTrack}
              onBlur={handleCursorTrack}
              onClick={handleCursorTrack}
              onKeyUp={handleCursorTrack}
              required
            />

            {/* Amenities Section */}
<div className="bg-slate-50 p-4 rounded-2xl">
  <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
    <CheckCircle size={16} /> Amenities
  </h3>
  {formData.amenities.map((item, idx) => (
    <div key={idx} className="flex gap-2 mb-2">
      <input
        type="text"
        value={item.name}
        onChange={(e) => handleArrayChange(idx, "amenities", "name", e.target.value)}
        className="flex-1 p-2 bg-white border-none rounded-xl text-sm"
        placeholder="Amenity name"
      />
      {formData.amenities.length > 1 && (
        <button 
          type="button"  // ✅ type="button" add කරලා
          onClick={() => removeField("amenities", idx)} 
          className="text-red-500"
        >
          ✕
        </button>
      )}
    </div>
  ))}
  <button 
    type="button"  // ✅ type="button" add කරලා
    onClick={() => addField("amenities")} 
    className="text-blue-600 text-sm mt-2"
  >
    + Add Amenity
  </button>
</div>

{/* FAQs Section */}
<div className="bg-orange-50 p-4 rounded-2xl">
  <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
    <HelpCircle size={16} /> FAQs
  </h3>
  {formData.faqs.map((faq, idx) => (
    <div key={idx} className="mb-3 p-3 bg-white rounded-xl">
      <input
        type="text"
        value={faq.question}
        onChange={(e) => handleArrayChange(idx, "faqs", "question", e.target.value)}
        className="w-full p-2 bg-slate-50 border-none rounded-xl mb-2 text-sm"
        placeholder="Question"
      />
      <textarea
        value={faq.answer}
        onChange={(e) => handleArrayChange(idx, "faqs", "answer", e.target.value)}
        className="w-full p-2 bg-slate-50 border-none rounded-xl text-sm"
        placeholder="Answer"
        rows={2}
      />
      {formData.faqs.length > 1 && (
        <button 
          type="button"  // ✅ type="button" add කරලා
          onClick={() => removeField("faqs", idx)} 
          className="text-red-500 text-xs mt-1"
        >
          Remove
        </button>
      )}
    </div>
  ))}
  <button 
    type="button"  // ✅ type="button" add කරලා
    onClick={() => addField("faqs")} 
    className="text-orange-600 text-sm"
  >
    + Add FAQ
  </button>
</div>

{/* Virtual Tours Section */}
<div className="bg-purple-50 p-4 rounded-2xl">
  <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm text-purple-800">
    <Youtube size={16} /> Virtual Tours
  </h3>
  {formData.virtualTours.map((tour, tourIdx) => (
    <div key={tourIdx} className="mb-4 p-3 bg-white rounded-xl">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-medium">Tour #{tourIdx + 1}</span>
        <button 
          type="button"  // ✅ type="button" add කරලා
          onClick={() => removeField("virtualTours", tourIdx)} 
          className="text-red-500 text-xs"
        >
          Remove
        </button>
      </div>
      <input
        type="url"
        value={tour.video || ""}
        onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "video", e.target.value)}
        className="w-full p-2 bg-slate-50 border-none rounded-xl mb-2 text-sm"
        placeholder="YouTube URL"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={tour.duration || ""}
          onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "duration", e.target.value)}
          className="p-2 bg-slate-50 border-none rounded-xl text-sm"
          placeholder="Duration"
        />
        <input
          type="text"
          value={tour.description || ""}
          onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "description", e.target.value)}
          className="p-2 bg-slate-50 border-none rounded-xl text-sm"
          placeholder="Description"
        />
      </div>
      
      {/* Tour Details */}
      {tour.details?.map((detail, detIdx) => (
        <div key={detIdx} className="flex gap-2 mt-2">
          <input
            type="text"
            value={detail.text || ""}
            onChange={(e) => {
              const updated = [...formData.virtualTours];
              updated[tourIdx].details[detIdx].text = e.target.value;
              setFormData({...formData, virtualTours: updated});
            }}
            className="flex-1 p-2 bg-slate-50 border-none rounded-xl text-xs"
            placeholder="Highlight"
          />
          {tour.details.length > 1 && (
            <button 
              type="button"  // ✅ type="button" add කරලා
              onClick={() => removeTourDetail(tourIdx, detIdx)} 
              className="text-red-400"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button 
        type="button"  // ✅ type="button" add කරලා
        onClick={() => addTourDetail(tourIdx)} 
        className="text-purple-600 text-xs mt-2"
      >
        + Add Highlight
      </button>
    </div>
  ))}
  <button 
    type="button"  // ✅ type="button" add කරලා
    onClick={() => addField("virtualTours")} 
    className="text-purple-600 text-sm"
  >
    + Add Virtual Tour
  </button>
</div>

            {/* Live Preview */}
            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Preview</h4>
              <div
                className="prose prose-slate max-w-none"
                style={{
                  whiteSpace: 'pre-line',
                  fontFamily: formData.fontFamily,
                  color: formData.textColor,
                }}
                dangerouslySetInnerHTML={{ __html: formData.description || 'Project description starts here...' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploading || inlineUploading}
              className={`w-full p-5 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all shadow-lg ${
                editId ? 'bg-orange-500' : 'bg-blue-600'
              } text-white hover:scale-[1.02] active:scale-95 disabled:opacity-60`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Home size={22} />}
              {editId ? "Update Project" : "Publish Project"}
            </button>
          </div>
        </form>
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 ml-2">Published Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-xl transition-all group"
            >
              {project.image && (
                <img
                  src={project.image}
                  className="w-full h-40 object-cover rounded-2xl mb-4"
                  alt={project.name}
                />
              )}
              <h4 className="font-bold text-slate-800 line-clamp-1">{project.name}</h4>
              <p className="text-xs text-slate-400 mb-1">{project.location}</p>
              <p className="text-sm text-orange-600 font-semibold mb-3">{project.price}</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <button
                  onClick={() => handleEdit(project)}
                  className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => deleteDoc(doc(db, "projectDetails", project.id))}
                  className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;