import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Loader2, Plus, Image as ImageIcon, MapPin, MessageCircleQuestion, 
  UserCheck, Edit3, Trash2, X, Home, Map as MapIcon, DollarSign, 
  FileText, CheckCircle, PlusCircle 
} from "lucide-react";

const AddLand = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [landsList, setLandsList] = useState<any[]>([]); 
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
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

  // පවතින දත්ත ලබා ගැනීම
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "landProjects")), (snapshot) => {
      const lands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLandsList(lands);
    });
    return () => unsub();
  }, []);

  const uploadImage = async (file: File, path: string) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleMainImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "lands/main");
      setFormData(prev => ({ ...prev, image: url }));
    } finally { setUploading(false); }
  };

  const handleGalleryUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadImage(file, "lands/gallery"));
      const urls = await Promise.all(uploadPromises);
      const newImages = urls.map(url => ({ src: url, alt: formData.name }));
      setFormData(prev => ({ ...prev, images: [...(prev.images as any), ...newImages] }));
    } finally { setUploading(false); }
  };

  const handleAvatarUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "advisors");
      setFormData(prev => ({ 
        ...prev, 
        propertyAdvisor: { ...prev.propertyAdvisor, avatar: url } 
      }));
    } finally { setUploading(false); }
  };

  const handleArrayChange = (index: number, field: string, subField: string, value: string) => {
    const updatedArray = [...(formData as any)[field]];
    updatedArray[index][subField] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const addField = (field: string) => {
    const newObj = field === "faqs" ? { question: "", answer: "" } : { name: "" };
    setFormData({ ...formData, [field]: [...(formData as any)[field], newObj] });
  };

  const handleEdit = (land: any) => {
    setEditId(land.id);
    setFormData({ ...land });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "landProjects", editId), formData);
        alert("Land Project Updated! ✅");
      } else {
        await addDoc(collection(db, "landProjects"), formData);
        alert("Land Project Published! ✅");
      }
      setEditId(null);
      setFormData({
        name: "", title: "", location: "", price: "", availability: "Available",
        description: "", mapEmbedUrl: "", image: "",
        propertyAdvisor: { name: "", title: "", phone: "", email: "", avatar: "" },
        amenities: [{ name: "" }], faqs: [{ question: "", answer: "" }], images: []
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapIcon className="text-blue-600" /> {editId ? "Edit Land Project" : "Add New Land Project"}
            </h1>
            <p className="text-slate-500 text-sm">Manage your land listings and details</p>
          </div>
          {editId && (
            <button onClick={() => {setEditId(null); window.location.reload();}} className="text-slate-400 hover:text-red-500 transition-colors">
              <X size={24} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Basic Info Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700">
              <Home size={20} className="text-blue-500" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Project Name</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Availability Status</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={formData.availability} onChange={(e) => setFormData({...formData, availability: e.target.value})}>
                  <option value="Available">🟢 Available</option>
                  <option value="Sold Out">🔴 Sold Out</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1"><MapPin size={14}/> Location</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1"><DollarSign size={14}/> Price Info</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-600">Full Description</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[150px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 2. Media Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700"><ImageIcon size={20} className="text-purple-500"/> Main Cover</h3>
              <div className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input type="file" onChange={handleMainImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {formData.image ? (
                  <img src={formData.image} className="h-40 mx-auto rounded-xl shadow-md" alt="Preview" />
                ) : (
                  <div className="py-8"><PlusCircle className="mx-auto text-slate-300 mb-2" size={40} /><p className="text-slate-400 text-sm font-medium">Click to upload cover image</p></div>
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700"><ImageIcon size={20} className="text-orange-500"/> Photo Gallery</h3>
              <input type="file" multiple onChange={handleGalleryUpload} className="text-sm mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img: any, i) => (
                  <img key={i} src={img.src} className="w-full h-16 object-cover rounded-lg" alt="Gallery" />
                ))}
              </div>
            </div>
          </div>

          {/* 3. Advisor Section */}
          <div className="bg-blue-600 p-8 rounded-3xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><UserCheck size={22} /> Property Advisor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input type="text" placeholder="Name" className="p-3 bg-white/10 border border-white/20 rounded-xl placeholder:text-blue-100 outline-none" value={formData.propertyAdvisor.name} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})} />
              <input type="text" placeholder="Title" className="p-3 bg-white/10 border border-white/20 rounded-xl placeholder:text-blue-100" value={formData.propertyAdvisor.title} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}})} />
              <input type="text" placeholder="Phone" className="p-3 bg-white/10 border border-white/20 rounded-xl placeholder:text-blue-100" value={formData.propertyAdvisor.phone} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} />
              <input type="email" placeholder="Email" className="p-3 bg-white/10 border border-white/20 rounded-xl placeholder:text-blue-100" value={formData.propertyAdvisor.email} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <input type="file" onChange={handleAvatarUpload} className="text-xs" />
              {formData.propertyAdvisor.avatar && <img src={formData.propertyAdvisor.avatar} className="w-12 h-12 rounded-full border-2 border-white" alt="Advisor" />}
            </div>
          </div>

          <button type="submit" disabled={loading || uploading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-lg hover:bg-black transition-all shadow-xl flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : editId ? "Update Land Project" : "Publish Land Project"}
          </button>

        </form>

        {/* Existing Projects List */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-slate-800 mb-8">Current Land Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landsList.map((land) => (
              <div key={land.id} className="bg-white rounded-[32px] p-4 border border-slate-100 hover:shadow-xl transition-all group">
                <div className="relative h-44 mb-4">
                  <img src={land.image} className="w-full h-full object-cover rounded-2xl" alt={land.name} />
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${land.availability === 'Sold Out' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {land.availability}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 px-1">{land.name}</h4>
                <p className="text-xs text-slate-400 px-1 flex items-center gap-1 mb-4"><MapPin size={12}/> {land.location}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <button onClick={() => handleEdit(land)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors"><Edit3 size={18} /></button>
                  <button onClick={async () => { if(confirm("Delete?")) await deleteDoc(doc(db, "landProjects", land.id)) }} className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddLand;