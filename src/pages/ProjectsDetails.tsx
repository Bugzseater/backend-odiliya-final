import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Trash2, Edit3, PlusCircle, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, 
  CheckCircle, HelpCircle, User, Youtube, Layout
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
    // Floor Plans state එක එක් කරන ලදි
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

  const uploadImage = async (file: File, path: string) => {
    const storageRef = ref(storage, `projects/${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

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

  // Gallery image එකක් ඉවත් කිරීම
  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Floor Plan Upload කිරීම සහ ඉවත් කිරීම
  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "floorplans");
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

  const addTourDetail = (tourIndex: number) => {
    const updatedTours = [...formData.virtualTours];
    updatedTours[tourIndex].details.push({ text: "" });
    setFormData({ ...formData, virtualTours: updatedTours });
  };

  const removeTourDetail = (tourIndex: number, detailIndex: number) => {
    const updatedTours = [...formData.virtualTours];
    updatedTours[tourIndex].details = updatedTours[tourIndex].details.filter((_: any, i: number) => i !== detailIndex);
    setFormData({ ...formData, virtualTours: updatedTours });
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 bg-slate-50 min-h-screen">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
          {editId ? <Edit3 className="text-orange-500" /> : <PlusCircle className="text-blue-600" />}
          {editId ? "Edit Project" : "Add New Project"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            {/* --- BASIC INFO --- */}
            <input type="text" placeholder="Project Name *" className="w-full p-4 bg-slate-50 border-none rounded-2xl" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, heroTitle: e.target.value }))} required />
            <input type="text" placeholder="Hero Title" className="w-full p-4 bg-slate-50 border-none rounded-2xl" value={formData.heroTitle} onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))} />
            
            <div className="grid grid-cols-2 gap-3">
              <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="p-4 bg-slate-50 border-none rounded-2xl">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={formData.availability} onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))} className="p-4 bg-slate-50 border-none rounded-2xl">
                {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Location" className="p-4 bg-slate-50 rounded-2xl" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} required />
              <input type="text" placeholder="Price" className="p-4 bg-slate-50 rounded-2xl" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} />
              <input type="text" placeholder="Area" className="p-4 bg-slate-50 rounded-2xl" value={formData.area} onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))} />
            </div>

            <input type="url" placeholder="Brochure URL" className="w-full p-4 bg-slate-50 rounded-2xl" value={formData.brochureUrl} onChange={(e) => setFormData(prev => ({ ...prev, brochureUrl: e.target.value }))} />
            <input type="url" placeholder="Google Map Embed URL" className="w-full p-4 bg-slate-50 rounded-2xl" value={formData.mapEmbedUrl} onChange={(e) => setFormData(prev => ({ ...prev, mapEmbedUrl: e.target.value }))} />

            {/* --- IMAGES & GALLERY --- */}
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-3xl bg-slate-50">
              <h3 className="text-sm font-bold mb-4">Main Image</h3>
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} className="w-full h-48 object-cover rounded-2xl" alt="" />
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"><X size={16} /></button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center py-6">
                  <ImageIcon size={32} className="text-blue-600 mb-2" />
                  <span className="text-sm">Add Main Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                </label>
              )}
            </div>

            {/* Gallery with Remove Option */}
            <div className="border-2 border-dashed border-slate-200 p-6 rounded-3xl bg-slate-50">
              <label className="cursor-pointer flex flex-col items-center mb-4">
                <ImageIcon size={24} className="text-green-600 mb-2" />
                <span className="text-sm font-medium">Add Gallery Images</span>
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
              </label>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={img.src} className="w-full h-full object-cover rounded-xl border" alt="" />
                      <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- FLOOR PLANS WITH NAME --- */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-700"><Layout size={18} /> Floor Plans</h3>
              <label className="cursor-pointer flex flex-col items-center p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-100 mb-4 transition-colors">
                <PlusCircle size={24} className="text-purple-600 mb-1" />
                <span className="text-xs font-medium">Add Floor Plan</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFloorPlanUpload} />
              </label>
              <div className="space-y-3">
                {formData.floorPlans.map((fp, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    <img src={fp.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                    <input 
                      type="text" 
                      placeholder="Floor Plan Name (e.g. 1 BEDROOM)" 
                      className="flex-1 p-2 text-sm bg-slate-50 rounded-lg outline-none" 
                      value={fp.name} 
                      onChange={(e) => handleArrayChange(idx, "floorPlans", "name", e.target.value)} 
                    />
                    <button type="button" onClick={() => removeFloorPlan(idx)} className="text-red-400 p-2"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* --- PROPERTY ADVISOR --- */}
            <div className="bg-blue-50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800"><User size={18} /> Property Advisor</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Name" className="p-3 bg-white rounded-xl" value={formData.propertyAdvisor.name} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})} />
                <input type="text" placeholder="Title" className="p-3 bg-white rounded-xl" value={formData.propertyAdvisor.title} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}})} />
                <input type="text" placeholder="Phone" className="p-3 bg-white rounded-xl" value={formData.propertyAdvisor.phone} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} />
                <input type="email" placeholder="Email" className="p-3 bg-white rounded-xl" value={formData.propertyAdvisor.email} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} />
              </div>
              <label className="mt-3 cursor-pointer flex items-center gap-2 text-sm text-blue-600">
                <ImageIcon size={16} /> Upload Avatar
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>

          {/* --- RIGHT SIDE: DESCRIPTION & LISTS --- */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800 rounded-2xl">
              <button type="button" onClick={() => formatText('bold')} className="p-2 text-white"><Bold size={18} /></button>
              <button type="button" onClick={() => formatText('italic')} className="p-2 text-white"><Italic size={18} /></button>
              <label className="p-2 text-blue-400 cursor-pointer">
                <ImageIcon size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} />
              </label>
              <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 text-white"><Palette size={18} /></button>
              {showColorPicker && (
                <div className="absolute mt-10 p-2 bg-white rounded-xl shadow-2xl z-50 grid grid-cols-5 gap-1">
                  {TEXT_COLORS.map(c => <div key={c} onClick={() => { formatText('color', c); setShowColorPicker(false); }} className="w-6 h-6 rounded-full cursor-pointer border" style={{ backgroundColor: c }} />)}
                </div>
              )}
            </div>

            <textarea
              className="w-full p-5 bg-white border border-slate-200 rounded-3xl h-64 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => { handleCursorTrack(e); setFormData(prev => ({ ...prev, description: e.target.value })); }}
              onSelect={handleCursorTrack}
              required
            />

            {/* Amenities */}
            <div className="bg-slate-50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2"><CheckCircle size={16} /> Amenities</h3>
              {formData.amenities.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={item.name} onChange={(e) => handleArrayChange(idx, "amenities", "name", e.target.value)} className="flex-1 p-2 rounded-xl text-sm" />
                  <button type="button" onClick={() => removeField("amenities", idx)} className="text-red-500">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addField("amenities")} className="text-blue-600 text-sm">+ Add Amenity</button>
            </div>

            {/* FAQs */}
            <div className="bg-orange-50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2"><HelpCircle size={16} /> FAQs</h3>
              {formData.faqs.map((faq, idx) => (
                <div key={idx} className="mb-3 p-3 bg-white rounded-xl shadow-sm">
                  <input type="text" value={faq.question} onChange={(e) => handleArrayChange(idx, "faqs", "question", e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl mb-2 text-sm" placeholder="Question" />
                  <textarea value={faq.answer} onChange={(e) => handleArrayChange(idx, "faqs", "answer", e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl text-sm" placeholder="Answer" rows={2} />
                  <button type="button" onClick={() => removeField("faqs", idx)} className="text-red-500 text-xs mt-1">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => addField("faqs")} className="text-orange-600 text-sm">+ Add FAQ</button>
            </div>

            {/* Virtual Tours */}
            <div className="bg-purple-50 p-4 rounded-2xl">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 text-purple-800"><Youtube size={16} /> Virtual Tours</h3>
              {formData.virtualTours.map((tour, tourIdx) => (
                <div key={tourIdx} className="mb-4 p-3 bg-white rounded-xl shadow-sm">
                  <input type="url" value={tour.video || ""} onChange={(e) => handleArrayChange(tourIdx, "virtualTours", "video", e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl mb-2 text-sm" placeholder="YouTube URL" />
                  <button type="button" onClick={() => removeField("virtualTours", tourIdx)} className="text-red-500 text-xs">Remove Tour</button>
                </div>
              ))}
              <button type="button" onClick={() => addField("virtualTours")} className="text-purple-600 text-sm">+ Add Virtual Tour</button>
            </div>

            <button type="submit" disabled={loading} className={`w-full p-5 rounded-2xl font-bold text-white shadow-lg transition-all ${editId ? 'bg-orange-500' : 'bg-blue-600'} hover:scale-[1.01]`}>
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (editId ? "Update Project" : "Publish Project")}
            </button>
          </div>
        </form>
      </div>

      {/* --- PROJECTS LIST VIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projectsList.map((project) => (
          <div key={project.id} className="bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-xl transition-all">
            {project.image && <img src={project.image} className="w-full h-40 object-cover rounded-2xl mb-4" alt="" />}
            <h4 className="font-bold text-slate-800 line-clamp-1">{project.name}</h4>
            <p className="text-xs text-slate-400">{project.location}</p>
            <div className="flex justify-between items-center mt-4 border-t pt-4">
              <button onClick={() => handleEdit(project)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-xl transition-colors"><Edit3 size={18} /></button>
              <button onClick={() => deleteDoc(doc(db, "projectDetails", project.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProjects;