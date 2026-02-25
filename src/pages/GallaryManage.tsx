import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { Upload, Trash2, Image as ImageIcon, X, Link } from "lucide-react";

function GallaryManage() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState("");

  // --- Cloudflare Configurations ---
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev"; //
  const R2_PUBLIC_URL = "https://pub-60bcd14d5096464aacffd76b19186295.r2.dev"; //
  // ---------------------------------

  // 1. Fetch Images (Real-time from Firestore)
  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle File Selection
  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setShowUrlInput(false);
    }
  };

  // 3. Upload Image to R2 via Worker
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    try {
      // Worker එක හරහා R2 එකට Upload කිරීම
      const response = await fetch(`${WORKER_URL}/${fileName}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!response.ok) throw new Error("Upload failed");

      const downloadURL = `${R2_PUBLIC_URL}/${fileName}`;
      
      // Firestore එකේ URL එක විතරක් Save කිරීම
      await addDoc(collection(db, "gallery"), {
        url: downloadURL,
        storagePath: "cloudflare-r2",
        name: fileName,
        createdAt: serverTimestamp(),
      });

      setUploading(false);
      setFile(null);
      setPreview(null);
      alert("පින්තූරය සාර්ථකව Cloudflare R2 වෙත එක් කළා!");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Upload එක අසාර්ථකයි! CORS settings පරීක්ෂා කරන්න.");
      setUploading(false);
    }
  };

  // 4. Add Image from External URL
  const handleAddFromUrl = async () => {
    if (!imageUrl.trim()) return;
    setUploading(true);
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
      await addDoc(collection(db, "gallery"), {
        url: imageUrl,
        storagePath: "external-url",
        name: fileName,
        createdAt: serverTimestamp(),
      });
      setImageUrl("");
      setUrlPreview("");
      setShowUrlInput(false);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // 5. Delete Image from Firestore
  const handleDelete = async (id) => {
    if (window.confirm("ඔබට මෙම පින්තූරය මැකීමට අවශ්‍ය බව සහතිකද?")) {
      try {
        await deleteDoc(doc(db, "gallery", id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="text-blue-600" /> Gallery Management (R2 Enabled)
          </h2>
          <p className="text-gray-500">පින්තූර Cloudflare R2 Storage එකට කෙලින්ම upload කරන්න.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => setShowUrlInput(false)} 
              className={`px-4 py-2 rounded-lg transition-colors ${!showUrlInput ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Upload File
            </button>
            <button 
              onClick={() => setShowUrlInput(true)} 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${showUrlInput ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <Link size={16} /> Add from URL
            </button>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors">
            {showUrlInput ? (
              <div className="w-full max-w-md space-y-4">
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => { setImageUrl(e.target.value); setUrlPreview(e.target.value); }} 
                  placeholder="https://example.com/image.jpg" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                {urlPreview && <img src={urlPreview} className="rounded-lg max-h-48 mx-auto shadow-sm" alt="Preview" />}
                <button 
                  onClick={handleAddFromUrl} 
                  disabled={!imageUrl || uploading} 
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium"
                >
                   {uploading ? "Adding..." : "Add to Gallery"}
                </button>
              </div>
            ) : (
              <>
                {preview ? (
                  <div className="relative w-full max-w-xs">
                    <img src={preview} alt="Preview" className="rounded-lg shadow-md max-h-48 mx-auto" />
                    <button 
                      onClick={() => {setPreview(null); setFile(null);}} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center group">
                    <div className="bg-blue-50 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
                      <Upload className="text-blue-600" size={32} />
                    </div>
                    <span className="mt-3 text-gray-600 font-medium">Click to select an image</span>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG or WebP (Max 10MB)</p>
                    <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
                  </label>
                )}
                {file && !uploading && (
                  <button 
                    onClick={handleUpload} 
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold transition-colors"
                  >
                    Upload to Cloudflare R2
                  </button>
                )}
                {uploading && (
                  <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold animate-pulse">
                    Uploading to R2...
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 aspect-square">
              <img 
                src={img.url} 
                alt={img.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                loading="lazy"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Load+Error'; }} 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => handleDelete(img.id)} 
                  className="bg-white p-3 rounded-full text-red-600 shadow-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              {img.storagePath === "cloudflare-r2" && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm">
                  R2 STORAGE
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GallaryManage;