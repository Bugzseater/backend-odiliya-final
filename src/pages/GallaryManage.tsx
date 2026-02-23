import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import { 
  collection, addDoc, serverTimestamp, 
  query, orderBy, onSnapshot, deleteDoc, doc 
} from "firebase/firestore";
import { 
  ref, uploadBytesResumable, getDownloadURL, deleteObject 
} from "firebase/storage";
import { Upload, Trash2, Image as ImageIcon, Loader2, X } from "lucide-react";

function GallaryManage() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // 1. Fetch Images (Real-time)
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
    }
  };

  // 3. Upload Image
  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(prog);
      },
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Save to Firestore
        await addDoc(collection(db, "gallery"), {
          url: downloadURL,
          storagePath: storageRef.fullPath,
          name: file.name,
          createdAt: serverTimestamp(),
        });

        setUploading(false);
        setFile(null);
        setPreview(null);
        setProgress(0);
      }
    );
  };

  // 4. Delete Image
  const handleDelete = async (id, storagePath) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        // Delete from Storage
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);

        // Delete from Firestore
        await deleteDoc(doc(db, "gallery", id));
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="text-blue-600" /> Gallery Management
          </h2>
          <p className="text-gray-500">Upload and manage your project images</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors">
            {preview ? (
              <div className="relative w-full max-w-xs">
                <img src={preview} alt="Preview" className="rounded-lg shadow-md max-h-48 mx-auto" />
                <button 
                  onClick={() => {setPreview(null); setFile(null);}}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="text-gray-400 mb-2" size={40} />
                <span className="text-gray-600 font-medium">Click to select an image</span>
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
              </label>
            )}

            {file && !uploading && (
              <button 
                onClick={handleUpload}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Upload to Gallery
              </button>
            )}

            {uploading && (
              <div className="w-full mt-4 max-w-xs">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 font-medium">Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 aspect-square">
              <img 
                src={img.url} 
                alt="Gallery" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => handleDelete(img.id, img.storagePath)}
                  className="bg-white p-3 rounded-full text-red-600 hover:bg-red-50 shadow-lg"
                  title="Delete Image"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && !uploading && (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
            <p>No images in gallery yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GallaryManage;