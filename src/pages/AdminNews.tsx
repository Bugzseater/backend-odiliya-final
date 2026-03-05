import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Trash2, Edit3, Newspaper, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, Save, Calendar,
  Type, AlignLeft, FileText, Upload
} from 'lucide-react';

// Define types for better type safety
interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  createdAt?: any;
}

interface FormData {
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
}

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#ffffff', 
  '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed',
  '#9333ea', '#db2777', '#0891b2', '#84cc16', '#f97316'
];

const AdminNews: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [ , ,] = useState<'editor' | 'preview'>('editor');

  // Cloudflare Configurations
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const NEWS_R2_URL = "https://pub-875fd3bdd9254e20b280dc9ba8f1a7b7.r2.dev";

  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<FormData>({
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
        'Cache-Control': 'public, max-age=31536000'
      }
    });
    if (!response.ok) throw new Error("R2 upload failed");
    return `${NEWS_R2_URL}/${fileName}`;
  };

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNewsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
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
      const imgTag = `\n<img src="${url}" alt="news-content" class="rounded-2xl max-w-full h-auto my-4 shadow-xl border border-[#252530]" />\n`;
      
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
      case 'bold': replacement = `<strong class="font-bold">${selectedText}</strong>`; break;
      case 'italic': replacement = `<em class="italic">${selectedText}</em>`; break;
      case 'color': replacement = `<span style="color: ${value}">${selectedText}</span>`; break;
      default: return;
    }

    setFormData(prev => ({
      ...prev,
      content: prev.content.substring(0, start) + replacement + prev.content.substring(end),
    }));

    // Focus back on textarea
    if (contentRef.current) {
      contentRef.current.focus();
    }
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

  const handleEdit = (news: NewsItem) => {
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
    <div className="min-h-screen bg-[#0A0A0F] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-600/30">
                <Newspaper className="text-blue-500" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {editId ? 'Edit News Article' : 'Publish News'}
                </h1>
                <p className="text-[#8B8B98] mt-1">
                  {editId ? 'Update your existing article' : 'Create and publish new content'}
                </p>
              </div>
            </div>
            
            {editId && (
              <button 
                onClick={resetForm} 
                className="flex items-center gap-2 px-6 py-3 bg-[#1A1A24] rounded-xl text-[#8B8B98] hover:text-white hover:bg-red-600/20 transition-all border border-[#252530]"
              >
                <X size={18} />
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title and Excerpt Section */}
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530] space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-linear-to-b from-blue-500 to-purple-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-white">Article Information</h2>
            </div>
            
            <div className="relative group">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Article Title" 
                className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                required
              />
            </div>

            <div className="relative group">
              <AlignLeft className="absolute left-4 top-5 text-[#8B8B98] group-focus-within:text-blue-500 transition-colors" size={20} />
              <textarea 
                placeholder="Short Excerpt (Brief description)" 
                className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none min-h-25 resize-none transition-all"
                value={formData.excerpt} 
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
                required
              />
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-linear-to-b from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-white">Content Editor</h2>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#1A1A24] rounded-2xl border border-[#252530]">
              <button 
                type="button" 
                onClick={() => formatText('bold')} 
                className="p-2.5 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white"
                title="Bold"
              >
                <Bold size={18} />
              </button>
              <button 
                type="button" 
                onClick={() => formatText('italic')} 
                className="p-2.5 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white"
                title="Italic"
              >
                <Italic size={18} />
              </button>
              
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setShowColorPicker(!showColorPicker)} 
                  className="p-2.5 hover:bg-[#252530] rounded-xl transition-all flex items-center gap-1 text-[#8B8B98] hover:text-white"
                  title="Text Color"
                >
                  <Palette size={18} />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-3 bg-[#1A1A24] shadow-2xl rounded-2xl border border-[#252530] grid grid-cols-5 gap-2 z-50">
                    {TEXT_COLORS.map(color => (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => { formatText('color', color); setShowColorPicker(false); }} 
                        className="w-8 h-8 rounded-xl border-2 border-transparent hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-[#252530] mx-1" />

              <label className="p-2.5 hover:bg-[#252530] rounded-xl transition-all cursor-pointer flex items-center gap-2 text-[#8B8B98] hover:text-blue-500">
                <ImageIcon size={18} />
                <span className="text-sm font-medium">
                  {inlineUploading ? 'Uploading...' : 'Add Image'}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleInlineImageUpload} 
                  disabled={inlineUploading} 
                />
              </label>

              {inlineUploading && (
                <div className="flex items-center gap-2 text-blue-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>

            <textarea 
              ref={contentRef}
              placeholder="Write your article content here... HTML tags supported for formatting" 
              className="w-full p-5 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-blue-600/50 outline-none min-h-100 font-mono text-sm leading-relaxed resize-y"
              value={formData.content} 
              onSelect={(e: any) => cursorPosRef.current = { 
                start: e.target.selectionStart, 
                end: e.target.selectionEnd 
              }}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
              required
            />
          </div>

          {/* Thumbnail Image */}
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-linear-to-b from-green-500 to-emerald-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-white">Thumbnail Image</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="flex flex-col items-center justify-center h-64 bg-[#1A1A24] border-2 border-dashed border-[#252530] rounded-2xl hover:border-blue-600/50 hover:bg-[#1A1A24]/80 cursor-pointer transition-all group">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleMainImageUpload} 
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-500 mb-3" size={32} />
                      <p className="text-[#8B8B98]">Uploading to R2...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="p-4 bg-[#252530] rounded-2xl mb-3 group-hover:bg-blue-600/20 transition-colors">
                        <Upload size={32} className="text-[#8B8B98] group-hover:text-blue-500" />
                      </div>
                      <p className="text-white font-medium mb-1">Click to upload thumbnail</p>
                      <p className="text-xs text-[#8B8B98]">PNG, JPG, WebP (Max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {formData.image && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative bg-[#1A1A24] p-3 rounded-2xl border border-[#252530]">
                    <img 
                      src={formData.image} 
                      className="w-full h-48 object-cover rounded-xl" 
                      alt="Preview" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, image: '' })} 
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-xl hover:bg-red-700 transition-all shadow-lg"
                    >
                      <X size={16} />
                    </button>
                    <p className="text-xs text-[#8B8B98] mt-2 text-center">Thumbnail Preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || uploading || inlineUploading} 
            className="w-full py-5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                {editId ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Save size={22} />
                {editId ? 'Update Article' : 'Publish Article'}
              </>
            )}
          </button>
        </form>

        {/* Recently Published Section */}
        <div className="space-y-6">
          <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-linear-to-b from-yellow-500 to-orange-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-white">Recently Published</h2>
              <div className="ml-auto px-4 py-2 bg-[#1A1A24] rounded-xl border border-[#252530]">
                <span className="text-[#8B8B98] text-sm">Total: </span>
                <span className="text-white font-bold">{newsList.length}</span>
              </div>
            </div>

            {newsList.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
                  <FileText size={32} className="text-[#8B8B98]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No articles yet</h3>
                <p className="text-[#8B8B98]">Publish your first news article</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <div 
                    key={news.id} 
                    className="group bg-[#1A1A24] rounded-3xl border border-[#252530] hover:border-blue-600/50 transition-all duration-300 overflow-hidden"
                  >
                    {news.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={news.image} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={news.title} 
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-[#1A1A24] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-[#8B8B98] mb-3">
                        <Calendar size={12} className="text-blue-500" />
                        {news.date}
                      </div>
                      
                      <h4 className="font-bold text-white text-lg mb-2 line-clamp-2">
                        {news.title}
                      </h4>
                      
                      <p className="text-sm text-[#8B8B98] mb-4 line-clamp-2">
                        {news.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                        <button 
                          onClick={() => handleEdit(news)} 
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-500 rounded-xl hover:bg-blue-600/30 transition-all"
                        >
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button 
                          onClick={() => { 
                            if(confirm("Delete this article?")) 
                              deleteDoc(doc(db, "news", news.id)) 
                          }} 
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600/30 transition-all"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNews;