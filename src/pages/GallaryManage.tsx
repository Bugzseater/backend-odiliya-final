import { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; 
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  Upload, Trash2, Image as ImageIcon, X, Link, 
  Loader2, Copy, Check, Download, Eye, Grid3X3,
  AlertCircle, ExternalLink, Clock, HardDrive,
  PlusCircle, FileImage, Globe, Sparkles
} from "lucide-react";

// Gallery image type එක define කරනවා
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
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
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
      alert("Image successfully uploaded to Cloudflare R2! ✅");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Upload failed! Please check CORS settings.");
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
      alert("Image added from URL successfully! ✅");
    } catch (error) {
      console.error(error);
      alert("Failed to add from URL!");
    } finally {
      setUploading(false);
    }
  };

  // Image එක delete කරනවා
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteDoc(doc(db, "gallery", id));
      } catch (error) {
        console.error(error);
        alert("Failed to delete image!");
      }
    }
  };

  // Copy URL to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    if (timestamp?.toDate) {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }
    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <ImageIcon className="text-orange-600" size={32} />
                Gallery Management
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <HardDrive size={16} className="text-gray-400" />
                Cloudflare R2 Storage • {images.length} images
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600">Total Images: </span>
                <span className="font-bold text-orange-600">{images.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-10">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Upload size={18} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Add New Images</h2>
                <p className="text-sm text-gray-500">Upload images or add from external URL</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setShowUrlInput(false)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  !showUrlInput 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload size={18} />
                Upload File
              </button>
              <button 
                onClick={() => setShowUrlInput(true)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  showUrlInput 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Link size={18} />
                Add from URL
              </button>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50">
              {showUrlInput ? (
                // URL Input Mode
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="url" 
                        value={imageUrl} 
                        onChange={(e) => { setImageUrl(e.target.value); setUrlPreview(e.target.value); }} 
                        placeholder="https://example.com/image.jpg" 
                        className="w-full pl-10 pr-4 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  {urlPreview && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Preview</label>
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white p-4">
                        <img 
                          src={urlPreview} 
                          className="max-h-64 mx-auto object-contain rounded-lg" 
                          alt="Preview" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleAddFromUrl} 
                    disabled={!imageUrl || uploading} 
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding to Gallery...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        Add to Gallery
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // File Upload Mode
                <div className="text-center">
                  {preview ? (
                    <div className="relative inline-block">
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="max-h-64 w-auto object-contain" 
                        />
                        <button 
                          onClick={() => {setPreview(null); setFile(null);}} 
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {file && !uploading && (
                        <button 
                          onClick={handleUpload} 
                          className="mt-6 w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                        >
                          <Upload size={18} />
                          Upload to Cloudflare R2
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="p-5 bg-orange-50 rounded-full mb-4 group-hover:bg-orange-100 transition-colors">
                          <Upload size={48} className="text-orange-600" />
                        </div>
                        <span className="text-lg font-medium text-gray-800 mb-2">
                          Click to select an image
                        </span>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <FileImage size={14} />
                          PNG, JPG, WebP up to 10MB
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={onFileChange} 
                        accept="image/*" 
                      />
                    </label>
                  )}

                  {uploading && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-orange-600">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="font-medium">Uploading to R2...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Grid3X3 size={20} className="text-orange-600" />
              All Images ({images.length})
            </h2>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>Latest first</span>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="inline-flex p-4 bg-orange-50 rounded-full mb-4">
                <ImageIcon size={48} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Images Yet</h3>
              <p className="text-gray-500 mb-6">Start by uploading your first image to the gallery</p>
              <button
                onClick={() => setShowUrlInput(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
              >
                <Upload size={18} />
                Upload Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all"
                  onClick={() => setSelectedImage(img)}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.name || 'Gallery image'} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy"
                      onError={(e) => { 
                        e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Error'; 
                      }} 
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs truncate mb-2">{img.name}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        img.storagePath === "cloudflare-r2" 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-purple-500 text-white'
                      }`}>
                        {img.storagePath === "cloudflare-r2" ? 'R2' : 'External'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Storage Badge (when not hovered) */}
                  {!selectedImage && (
                    <div className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${
                      img.storagePath === "cloudflare-r2" 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {img.storagePath === "cloudflare-r2" ? 'R2' : 'URL'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Detail Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ImageIcon size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Image Details</h3>
                    <p className="text-xs text-gray-500">ID: {selectedImage.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Image Preview */}
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img 
                      src={selectedImage.url} 
                      alt={selectedImage.name}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Storage</p>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        {selectedImage.storagePath === "cloudflare-r2" ? (
                          <>
                            <HardDrive size={16} className="text-orange-600" />
                            Cloudflare R2
                          </>
                        ) : (
                          <>
                            <Globe size={16} className="text-purple-600" />
                            External URL
                          </>
                        )}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Uploaded</p>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        {formatDate(selectedImage.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedImage.url}
                        readOnly
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                      />
                      <button
                        onClick={() => handleCopy(selectedImage.url, selectedImage.id)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-2"
                      >
                        {copySuccess === selectedImage.id ? (
                          <>
                            <Check size={16} className="text-green-600" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span className="text-sm">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Filename */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Filename</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono">
                      {selectedImage.name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <a
                      href={selectedImage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      View Original
                    </a>
                    <a
                      href={selectedImage.url}
                      download={selectedImage.name}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download
                    </a>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this image?")) {
                          handleDelete(selectedImage.id);
                          setSelectedImage(null);
                        }
                      }}
                      className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GallaryManage;