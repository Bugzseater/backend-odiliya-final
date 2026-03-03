import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Trash2, Edit3, PlusCircle, Newspaper, Loader2, Image as ImageIcon, X, Bold, Italic, Palette } from 'lucide-react';

const TEXT_COLORS = ['#000000', '#333333', '#666666', '#ffffff', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];

const AdminNews: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ✅ Cloudflare Configurations
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const NEWS_R2_URL = "https://pub-875fd3bdd9254e20b280dc9ba8f1a7b7.r2.dev"; // ඔබේ අලුත් News Bucket URL එක මෙතනට දමන්න

  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    fontFamily: 'inherit',
    fontSize: '16px',
    textColor: '#000000',
  });

  // --- Cloudflare R2 Upload Function ---
  const uploadToR2 = async (file: File, folder: string) => {
    const fileName = `news/${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const response = await fetch(`${WORKER_URL}/${fileName}`, {
      method: 'PUT',
      body: file,
      headers: { 
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000' // වසරක් Cache කිරීම සඳහා
      }
    });
    if (!response.ok) throw new Error("R2 upload failed");
    return `${NEWS_R2_URL}/${fileName}`;
  };

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNewsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToR2(file, 'thumbnails');
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert("Main image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    try {
      const url = await uploadToR2(file, 'content');
      const start = cursorPosRef.current.start;
      const end = cursorPosRef.current.end;
      const imgTag = `\n<img src="${url}" alt="news-content" style="max-width:100%; height:auto; border-radius:12px; margin:15px 0; display:block;" />\n`;
      
      setFormData(prev => ({
        ...prev,
        content: prev.content.substring(0, start) + imgTag + prev.content.substring(end),
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
    const selectedText = formData.content.substring(start, end);
    let replacement = '';

    switch (command) {
      case 'bold': replacement = `<b>${selectedText}</b>`; break;
      case 'italic': replacement = `<i>${selectedText}</i>`; break;
      case 'color': replacement = `<span style="color: ${value}">${selectedText}</span>`; break;
      default: return;
    }

    setFormData(prev => ({
      ...prev,
      content: prev.content.substring(0, start) + replacement + prev.content.substring(end),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newsData = { ...formData, createdAt: serverTimestamp() };
      if (editId) {
        await updateDoc(doc(db, "news", editId), newsData);
        alert("News updated successfully! ✅");
      } else {
        await addDoc(collection(db, "news"), newsData);
        alert("News published successfully! ✅");
      }
      resetForm();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (news: any) => {
    setEditId(news.id);
    setFormData({
      title: news.title,
      excerpt: news.excerpt,
      content: news.content,
      image: news.image,
      date: news.date,
      fontFamily: news.fontFamily || 'inherit',
      fontSize: news.fontSize || '16px',
      textColor: news.textColor || '#000000',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      title: '', excerpt: '', content: '', image: '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      fontFamily: 'inherit', fontSize: '16px', textColor: '#000000',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Newspaper className="text-blue-600" /> {editId ? 'Edit News Article' : 'Publish News'}
          </h1>
          {editId && <button onClick={resetForm} className="text-slate-400 hover:text-red-500"><X size={24} /></button>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <input type="text" placeholder="Article Title" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}  />
            <textarea placeholder="Short Excerpt (Brief description)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}  />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <button type="button" onClick={() => formatText('bold')} className="p-2 hover:bg-white rounded-lg transition-all" title="Bold"><Bold size={18} /></button>
              <button type="button" onClick={() => formatText('italic')} className="p-2 hover:bg-white rounded-lg transition-all" title="Italic"><Italic size={18} /></button>
              <div className="relative">
                <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 hover:bg-white rounded-lg transition-all flex items-center gap-1" title="Text Color"><Palette size={18} /></button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white shadow-xl rounded-xl border border-slate-100 grid grid-cols-3 gap-1 z-50">
                    {TEXT_COLORS.map(color => (
                      <button key={color} type="button" onClick={() => { formatText('color', color); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="h-6 w-[1px] bg-slate-200 mx-1" />
              <label className="p-2 hover:bg-white rounded-lg transition-all cursor-pointer flex items-center gap-2 text-sm text-blue-600 font-medium">
                <ImageIcon size={18} /> {inlineUploading ? 'Uploading...' : 'Add Image to Content'}
                <input type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} disabled={inlineUploading} />
              </label>
            </div>
            <textarea 
              placeholder="Article Content (HTML supported)..." 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono text-sm" 
              value={formData.content} 
              onSelect={(e: any) => cursorPosRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd }}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
            
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Main Thumbnail Image</h3>
            <div className="flex items-center gap-4">
              <label className="flex-1 border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center hover:bg-slate-50 cursor-pointer transition-all">
                <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                {uploading ? <Loader2 className="mx-auto animate-spin text-blue-500" /> : <div className="text-slate-400"><PlusCircle className="mx-auto mb-2" /> <p className="text-xs font-medium uppercase tracking-wider">Click to Upload</p></div>}
              </label>
              {formData.image && (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-md">
                  <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                  <button type="button" onClick={() => setFormData({ ...formData, image: '' })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={14} /></button>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading || uploading || inlineUploading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : editId ? 'Update Article' : 'Publish Article'}
          </button>
        </form>

        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 ml-2">Recently Published</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <div key={news.id} className="bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-xl transition-all group">
                {news.image && <img src={news.image} className="w-full h-40 object-cover rounded-2xl mb-4" alt="Post" />}
                <h4 className="font-bold text-slate-800 line-clamp-1">{news.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{news.date}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <button onClick={() => handleEdit(news)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl"><Edit3 size={18} /></button>
                  <button onClick={() => { if(confirm("Delete this article?")) deleteDoc(doc(db, "news", news.id)) }} className="text-red-400 hover:bg-red-50 p-2 rounded-xl"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNews;