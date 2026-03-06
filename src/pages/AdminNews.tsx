import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Trash2, Edit3, PlusCircle, Newspaper, Loader2, Image as ImageIcon, 
  X, Bold, Italic, Palette, Calendar, Eye, Copy, Check,
  ChevronDown, ChevronUp, AlertCircle, FileText, Clock,
  Tag, User, Share2, Download, Star, BookOpen
} from 'lucide-react';

const TEXT_COLORS = ['#000000', '#333333', '#666666', '#ffffff', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];

const AdminNews: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    content: true,
    image: true
  });

  // ✅ Cloudflare Configurations
  const WORKER_URL = "https://odiliya-uploader.devmiez.workers.dev";
  const NEWS_R2_URL = "https://pub-875fd3bdd9254e20b280dc9ba8f1a7b7.r2.dev";

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
        'Cache-Control': 'public, max-age=31536000'
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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, icon, section, color = "orange" }: any) => (
    <div 
      className={`flex items-center justify-between p-4 bg-gradient-to-r from-${color}-50 to-transparent border-b border-gray-100 cursor-pointer hover:from-${color}-100 transition-colors`}
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <button className="p-1 hover:bg-white rounded-lg transition-colors">
        {expandedSections[section] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Newspaper className="text-orange-600" size={32} />
                News Management
              </h1>
              <p className="text-gray-500">Create and manage your news articles</p>
            </div>
            
            {/* Status Badge */}
            {editId && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-orange-200">
                  <Edit3 size={16} />
                  Editing Mode
                </span>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Article Information" 
              icon={<FileText size={18} className="text-orange-600" />}
              section="basic"
              color="orange"
            />
            
            {expandedSections.basic && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Article Title *</label>
                  <input 
                    type="text" 
                    placeholder="Enter an attention-grabbing title" 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Short Excerpt</label>
                  <textarea 
                    placeholder="Write a brief summary of the article (will appear in previews)" 
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px] resize-none" 
                    value={formData.excerpt} 
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
                  />
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    This will appear in news listings and social shares
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{formData.date}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Article Content" 
              icon={<BookOpen size={18} className="text-orange-600" />}
              section="content"
              color="orange"
            />
            
            {expandedSections.content && (
              <div className="p-6">
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-800 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Bold"
                  >
                    <Bold size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Italic"
                  >
                    <Italic size={18} />
                  </button>
                  <div className="w-px h-6 bg-gray-700 mx-1" />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                      title="Text Color"
                    >
                      <Palette size={18} />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 grid grid-cols-3 gap-1 z-50">
                        {TEXT_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => { formatText('color', color); setShowColorPicker(false); }}
                            className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-px h-6 bg-gray-700 mx-1" />
                  <label className="p-2 text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-sm" title="Insert Image">
                    <ImageIcon size={18} />
                    <span className="hidden sm:inline">Add Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleInlineImageUpload} disabled={inlineUploading} />
                  </label>
                  {inlineUploading && (
                    <div className="ml-2 flex items-center gap-2 text-orange-400">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  )}
                </div>

                {/* Content Textarea */}
                <textarea 
                  placeholder="Write your article content here... HTML tags are supported for formatting" 
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[300px] font-mono text-sm" 
                  value={formData.content} 
                  onSelect={(e: any) => cursorPosRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd }}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  required
                />
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Images will be inserted at cursor position. HTML supported.
                  </p>
                  <span className="text-xs text-gray-400">
                    {formData.content.length} characters
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <SectionHeader 
              title="Thumbnail Image" 
              icon={<ImageIcon size={18} className="text-orange-600" />}
              section="image"
              color="orange"
            />
            
            {expandedSections.image && (
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                  {formData.image ? (
                    <div className="relative group">
                      <img 
                        src={formData.image} 
                        className="w-full h-64 object-cover rounded-xl" 
                        alt="Thumbnail preview" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, image: '' })} 
                          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <div className="p-4 bg-orange-50 rounded-full mb-3">
                        <ImageIcon size={32} className="text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 mb-1">Click to upload thumbnail</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 10MB (1200x630px recommended)</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} disabled={uploading} />
                      {uploading && (
                        <div className="mt-3 flex items-center gap-2 text-orange-600">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                {formData.image && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">{formData.image}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.image, 'image')}
                        className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                        title="Copy image URL"
                      >
                        {copySuccess === 'image' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <a 
                      href={formData.image} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <Eye size={14} /> Preview
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || uploading || inlineUploading} 
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {editId ? 'Updating Article...' : 'Publishing Article...'}
              </>
            ) : (
              <>
                {editId ? <Edit3 size={20} /> : <PlusCircle size={20} />}
                {editId ? 'Update Article' : 'Publish Article'}
              </>
            )}
          </button>
        </form>

        {/* News List */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Newspaper size={20} className="text-orange-600" />
            Recently Published ({newsList.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <div key={news.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                {/* News Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={news.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt={news.title}
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                    {news.date}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{news.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{news.excerpt || 'No excerpt provided'}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleEdit(news)} 
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => { if(confirm("Delete this article?")) deleteDoc(doc(db, "news", news.id)) }} 
                      className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {newsList.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No news articles yet. Create your first article above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNews;