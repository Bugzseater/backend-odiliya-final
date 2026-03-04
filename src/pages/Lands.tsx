import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { 
  Loader2, Plus, Image as ImageIcon,
  UserCheck, Edit3, Trash2, X, Home,  
  PlusCircle, MessageCircleQuestion, FileText, Globe
} from "lucide-react";

const AddLand = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [landsList, setLandsList] = useState<any[]>([]); 
  const [editId, setEditId] = useState<string | null>(null);
  
  // --- Cloudflare Configurations ---
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const LANDS_R2_URL = "https://pub-b71da939312c4b00a5ab8f97f5ea5f37.r2.dev"; 
  // ---------------------------------

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

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "landProjects")), (snapshot) => {
      const lands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLandsList(lands);
    });
    return () => unsub();
  }, []);

  const uploadToR2 = async (file: File) => {
    const fileName = `lands/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const response = await fetch(`${WORKER_URL}/${fileName}`, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    if (!response.ok) throw new Error("Cloudflare upload failed");
    return `${LANDS_R2_URL}/${fileName}`;
  };

  const handleMainImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) { alert("Main image upload failed!"); } 
    finally { setUploading(false); }
  };

  const handleGalleryUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    setUploading(true);
    try {
      const uploadPromises = files.map(file => uploadToR2(file));
      const urls = await Promise.all(uploadPromises);
      const newImages = urls.map(url => ({ src: url, alt: formData.name }));
      setFormData(prev => ({ ...prev, images: [...(prev.images as any), ...newImages] }));
    } catch (error) { alert("Gallery upload failed!"); } 
    finally { setUploading(false); }
  };

  // Gallery පින්තූර ඉවත් කිරීම සඳහා අලුතින් එක් කළ Function එක
  const removeGalleryImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleAvatarUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file);
      setFormData(prev => ({ 
        ...prev, 
        propertyAdvisor: { ...prev.propertyAdvisor, avatar: url } 
      }));
    } catch (error) { alert("Avatar upload failed!"); } 
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "landProjects", editId), formData);
        alert("Updated! ✅");
      } else {
        await addDoc(collection(db, "landProjects"), formData);
        alert("Published! ✅");
      }
      window.location.reload(); 
    } catch (error: any) { alert(error.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Basic Information & Map Link */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700">
              <Home size={20} className="text-blue-500" /> Basic Details & Map Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Project Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value, title: e.target.value})} required />
              <input type="text" placeholder="Location (City)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              <input type="text" placeholder="Price Info" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.availability} onChange={(e) => setFormData({...formData, availability: e.target.value})}>
                <option value="Available">🟢 Available</option>
                <option value="Sold Out">🔴 Sold Out</option>
              </select>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1 mb-2"><Globe size={16}/> Google Map Embed Link (iframe src)</label>
                <input type="text" placeholder="Paste the src link from Google Maps Embed iframe..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.mapEmbedUrl} onChange={(e) => setFormData({...formData, mapEmbedUrl: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1 mb-2"><FileText size={16}/> Description</label>
                <textarea placeholder="Enter details..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[120px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 2. Property Advisor */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700">
              <UserCheck size={20} className="text-green-500" /> Property Advisor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" placeholder="Advisor Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.propertyAdvisor.name} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, name: e.target.value}})} />
                <input type="text" placeholder="Phone" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.propertyAdvisor.phone} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, phone: e.target.value}})} />
                <div className="border-2 border-dashed border-slate-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-400 mb-2">Advisor Photo (R2)</p>
                  <input type="file" onChange={handleAvatarUpload} className="text-xs" />
                  {formData.propertyAdvisor.avatar && (
                    <div className="relative inline-block mt-2">
                      <img src={formData.propertyAdvisor.avatar} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                      <button type="button" onClick={() => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, avatar: ""}})} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Advisor Title" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.propertyAdvisor.title} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, title: e.target.value}})} />
                <input type="email" placeholder="Advisor Email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.propertyAdvisor.email} onChange={(e) => setFormData({...formData, propertyAdvisor: {...formData.propertyAdvisor, email: e.target.value}})} />
              </div>
            </div>
          </div>

          {/* 3. Media (Main & Gallery) - පින්තූර ඉවත් කිරීමේ පහසුකම සහිතව */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><ImageIcon size={20}/> Main Cover Image</h3>
              {!formData.image ? (
                <input type="file" onChange={handleMainImageChange} className="text-sm mb-4" />
              ) : (
                <div className="relative group rounded-xl overflow-hidden">
                  <img src={formData.image} className="w-full h-44 object-cover rounded-xl shadow-sm" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setFormData({...formData, image: ""})} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><PlusCircle size={20}/> Gallery Images</h3>
              <input type="file" multiple onChange={handleGalleryUpload} className="text-sm mb-4" />
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img: any, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100">
                    <img src={img.src} className="h-full w-full object-cover" />
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
            </div>
          </div>

          {/* 4. Amenities & FAQs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 text-slate-700">Amenities</h3>
              {formData.amenities.map((amt, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" placeholder="e.g. 24/7 Security" className="flex-1 p-2 bg-slate-50 border rounded-lg outline-none focus:border-blue-500" value={amt.name} onChange={(e) => {
                    const newAmt = [...formData.amenities];
                    newAmt[i].name = e.target.value;
                    setFormData({...formData, amenities: newAmt});
                  }} />
                  <button type="button" onClick={() => setFormData({...formData, amenities: [...formData.amenities, {name: ""}]})} className="p-2 text-blue-500"><Plus size={18}/></button>
                </div>
              ))}
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><MessageCircleQuestion size={20}/> FAQs</h3>
              {formData.faqs.map((faq, i) => (
                <div key={i} className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl">
                  <input type="text" placeholder="Question" className="w-full p-2 border rounded-lg outline-none focus:border-blue-500" value={faq.question} onChange={(e) => {
                    const newFaq = [...formData.faqs];
                    newFaq[i].question = e.target.value;
                    setFormData({...formData, faqs: newFaq});
                  }} />
                  <input type="text" placeholder="Answer" className="w-full p-2 border rounded-lg outline-none focus:border-blue-500" value={faq.answer} onChange={(e) => {
                    const newFaq = [...formData.faqs];
                    newFaq[i].answer = e.target.value;
                    setFormData({...formData, faqs: newFaq});
                  }} />
                  <button type="button" onClick={() => setFormData({...formData, faqs: [...formData.faqs, {question: "", answer: ""}]})} className="text-xs text-blue-500">+ Add another FAQ</button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || uploading} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold text-lg hover:bg-blue-700 shadow-xl transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : editId ? "Update Project" : "Publish Project"}
          </button>
        </form>

        {/* Existing Land Projects ලිස්ට් එක */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-slate-800 mb-8">Existing Land Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landsList.map((land) => (
              <div key={land.id} className="bg-white rounded-[32px] p-4 border border-slate-100 hover:shadow-lg transition-all">
                <img src={land.image} className="w-full h-40 object-cover rounded-2xl mb-4 shadow-sm" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300'} />
                <h4 className="font-bold text-slate-800 px-1">{land.name}</h4>
                <p className="text-xs text-slate-400 mb-4 px-1">{land.location}</p>
                <div className="flex justify-between border-t pt-4">
                  <button onClick={() => {setEditId(land.id); setFormData(land); window.scrollTo(0,0);}} className="text-blue-500 p-2 hover:bg-blue-50 rounded-xl transition-colors"><Edit3 size={18}/></button>
                  <button onClick={async () => {if(confirm("Are you sure you want to delete this project?")) await deleteDoc(doc(db,"landProjects",land.id))}} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
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