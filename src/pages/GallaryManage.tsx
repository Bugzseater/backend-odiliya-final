import { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  Upload, Trash2, Image as ImageIcon, X, Link, 
  Loader2, Grid, Globe, CheckCircle,
  Sparkles, Eye, ExternalLink
} from "lucide-react";

// Gallery image type define කරනවා
interface GalleryImage {
  id: string;
  url: string;
  storagePath: string;
  name: string;
  createdAt?: any;
}

function GallaryManage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Cloudflare Configurations
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const R2_PUBLIC_URL = "https://pub-60bcd14d5096464aacffd76b19186295.r2.dev";

  // Real-time images fetch කරනවා
  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url || '',
          storagePath: data.storagePath || '',
          name: data.name || '',
          createdAt: data.createdAt
        };
      }) as GalleryImage[];
      
      setImages(imagesData);
    });
    return () => unsubscribe();
  }, []);

  // File එක select කරන විට
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setShowUrlInput(false);
    }
  };

  // R2 වෙත upload කරනවා
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    try {
      const response = await fetch(`${WORKER_URL}/${fileName}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!response.ok) throw new Error("Upload failed");

      const downloadURL = `${R2_PUBLIC_URL}/${fileName}`;
      
      await addDoc(collection(db, "gallery"), {
        url: downloadURL,
        storagePath: "cloudflare-r2",
        name: fileName,
        createdAt: serverTimestamp(),
      });

      setUploading(false);
      setFile(null);
      setPreview(null);
      alert("✅ පින්තූරය සාර්ථකව Cloudflare R2 වෙත එක් කළා!");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("❌ Upload එක අසාර්ථකයි! CORS settings පරීක්ෂා කරන්න.");
      setUploading(false);
    }
  };

  // URL එකකින් image එක add කරනවා
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
      alert("✅ URL එකෙන් පින්තූරය එකතු කළා!");
    } catch (error) {
      console.error(error);
      alert("❌ URL එකෙන් එකතු කිරීම අසාර්ථකයි!");
    } finally {
      setUploading(false);
    }
  };

  // Image එක delete කරනවා
  const handleDelete = async (id: string) => {
    if (window.confirm("ඔබට මෙම පින්තූරය මැකීමට අවශ්‍ය බව සහතිකද?")) {
      try {
        await deleteDoc(doc(db, "gallery", id));
      } catch (error) {
        console.error(error);
        alert("❌ මකා දැමීම අසාර්ථකයි!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-600/30">
                <ImageIcon className="text-blue-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Gallery Management</h1>
                <p className="text-[#8B8B98] mt-1 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" />
                  Cloudflare R2 Storage Integration
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-[#1A1A24] rounded-xl border border-[#252530]">
                <span className="text-[#8B8B98] text-sm">Total Images: </span>
                <span className="text-white font-bold ml-1">{images.length}</span>
              </div>
              <div className="px-4 py-2 bg-linear-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-600/30">
                <span className="text-blue-500 text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> R2 Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-white">Upload New Images</h2>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-8">
            <button 
              onClick={() => setShowUrlInput(false)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                !showUrlInput 
                  ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-[#1A1A24] text-[#8B8B98] hover:text-white border border-[#252530]'
              }`}
            >
              <Upload size={18} />
              Upload File
            </button>
            <button 
              onClick={() => setShowUrlInput(true)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                showUrlInput 
                  ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-[#1A1A24] text-[#8B8B98] hover:text-white border border-[#252530]'
              }`}
            >
              <Link size={18} />
              Add from URL
            </button>
          </div>

          {/* Upload Area */}
          <div className="bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl p-8 hover:border-blue-600/50 transition-all">
            {showUrlInput ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-purple-500 transition-colors" size={20} />
                  <input 
                    type="url" 
                    value={imageUrl} 
                    onChange={(e) => { setImageUrl(e.target.value); setUrlPreview(e.target.value); }} 
                    placeholder="https://example.com/image.jpg" 
                    className="w-full pl-12 pr-4 py-4 bg-[#13131A] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none transition-all" 
                  />
                </div>
                
                {urlPreview && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
                      <img 
                        src={urlPreview} 
                        className="rounded-xl max-h-64 mx-auto shadow-2xl" 
                        alt="Preview" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                        }}
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600/20 text-yellow-500 text-xs rounded-lg border border-yellow-600/30">
                        Preview
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleAddFromUrl} 
                  disabled={!imageUrl || uploading} 
                  className="w-full py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Adding from URL...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={20} />
                      Add to Gallery
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                {preview ? (
                  <div className="max-w-md mx-auto">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="rounded-xl max-h-64 mx-auto shadow-2xl" 
                        />
                        <button 
                          onClick={() => {setPreview(null); setFile(null);}} 
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-xl hover:bg-red-700 transition-all shadow-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleUpload} 
                      disabled={uploading}
                      className="mt-6 w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Uploading to R2...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          Upload to Cloudflare R2
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center py-12 group">
                    <div className="p-5 bg-[#252530] rounded-3xl group-hover:bg-blue-600/20 transition-all mb-4">
                      <Upload className="text-[#8B8B98] group-hover:text-blue-500 transition-colors" size={48} />
                    </div>
                    <span className="text-white font-medium text-lg mb-2">Click to select an image</span>
                    <p className="text-[#8B8B98] text-sm">PNG, JPG or WebP (Max 10MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={onFileChange} 
                      accept="image/*" 
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Grid size={20} className="text-purple-500" />
              Image Gallery
            </h2>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
                <ImageIcon size={40} className="text-[#8B8B98]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No images yet</h3>
              <p className="text-[#8B8B98]">Upload your first image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative aspect-square bg-[#1A1A24] rounded-2xl overflow-hidden border border-[#252530] hover:border-blue-600/50 transition-all cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <img 
                    src={img.url} 
                    alt={img.name || 'Gallery image'} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy"
                    onError={(e) => { 
                      e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Error'; 
                    }} 
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#0A0A0F] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }} 
                        className="w-full py-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-all flex items-center justify-center gap-2 backdrop-blur-sm border border-red-600/30"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Storage Badge */}
                  {img.storagePath === "cloudflare-r2" ? (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-linear-to-r from-blue-600 to-cyan-600 text-white text-[10px] rounded-lg font-bold shadow-lg flex items-center gap-1">
                      <CheckCircle size={10} />
                      R2
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-linear-to-r from-purple-600 to-pink-600 text-white text-[10px] rounded-lg font-bold shadow-lg flex items-center gap-1">
                      <Globe size={10} />
                      URL
                    </div>
                  )}

                  {/* View Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(img.url, '_blank');
                    }}
                    className="absolute top-2 right-2 p-2 bg-[#1A1A24] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600/20 border border-[#252530]"
                  >
                    <Eye size={14} className="text-[#8B8B98] hover:text-blue-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <button
                onClick={() => window.open(selectedImage.url, '_blank')}
                className="px-4 py-2 bg-[#1A1A24] text-white rounded-xl hover:bg-blue-600/20 transition-all border border-[#252530] flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Open Original
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-[#1A1A24] text-white rounded-xl hover:bg-red-600/20 transition-all border border-[#252530]"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-30"></div>
              <div className="relative bg-[#13131A] p-4 rounded-3xl border border-[#252530]">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name}
                  className="w-full max-h-[80vh] object-contain rounded-2xl"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{selectedImage.name}</p>
                <p className="text-[#8B8B98] text-sm mt-1">
                  Storage: {selectedImage.storagePath === 'cloudflare-r2' ? 'Cloudflare R2' : 'External URL'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("ඔබට මෙම පින්තූරය මැකීමට අවශ්‍ය බව සහතිකද?")) {
                    handleDelete(selectedImage.id);
                    setSelectedImage(null);
                  }
                }}
                className="px-6 py-3 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-all border border-red-600/30 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GallaryManage;