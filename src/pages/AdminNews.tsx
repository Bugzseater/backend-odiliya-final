import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Trash2, Edit3, PlusCircle, Newspaper, Loader2, Image as ImageIcon, X, Bold, Italic, Palette } from 'lucide-react';

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#ffffff', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'
];

const AdminNews: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // ✅ Cursor position save කරන්න ref
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

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setNewsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Cursor position track කරන handler
  const handleCursorTrack = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    cursorPosRef.current = {
      start: t.selectionStart,
      end: t.selectionEnd,
    };
  };

  // Main Image Upload (Thumbnail)
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `news/main/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      alert("Main image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Fixed Inline Image Upload
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    try {
      const storageRef = ref(storage, `news/content/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // ✅ Saved cursor position use කරනවා (textarea focus නැති වුනත් හරි)
      const start = cursorPosRef.current.start;
      const end = cursorPosRef.current.end;

      const imgTag = `\n<img src="${url}" alt="news-content" style="max-width:100%; height:auto; border-radius:12px; margin:15px 0; display:block;" />\n`;

      setFormData(prev => ({
        ...prev,
        content: prev.content.substring(0, start) + imgTag + prev.content.substring(end),
      }));

      // ✅ Same file නැවත upload කරන්න file input reset
      e.target.value = '';

      // ✅ Cursor position image tag ඊළඟට move කරනවා
      const newPos = start + imgTag.length;
      cursorPosRef.current = { start: newPos, end: newPos };

    } catch (error) {
      alert("Inline image upload failed!");
    } finally {
      setInlineUploading(false);
    }
  };

  const formatText = (command: string, value?: string) => {
    const start = cursorPosRef.current.start;
    const end = cursorPosRef.current.end;
    const selected = formData.content.substring(start, end);

    if (selected) {
      let formatted = '';
      if (command === 'bold') formatted = `<strong>${selected}</strong>`;
      if (command === 'italic') formatted = `<em>${selected}</em>`;
      if (command === 'color') formatted = `<span style="color: ${value}">${selected}</span>`;
      if (command === 'list') formatted = `<ul>\n<li>${selected}</li>\n</ul>`;

      const newContent = formData.content.substring(0, start) + formatted + formData.content.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));

      const newPos = start + formatted.length;
      cursorPosRef.current = { start: newPos, end: newPos };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "news", editId), { ...formData, updatedAt: serverTimestamp() });
        alert("News Updated! ✨");
      } else {
        await addDoc(collection(db, "news"), { ...formData, createdAt: serverTimestamp() });
        alert("News Published! ✅");
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
      title: '',
      excerpt: '',
      content: '',
      image: '',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      fontFamily: 'inherit',
      fontSize: '16px',
      textColor: '#000000',
    });
    setEditId(null);
    cursorPosRef.current = { start: 0, end: 0 };
  };

  function handleEdit(news: any) {
    setEditId(news.id);
    setFormData({ ...news });
    cursorPosRef.current = { start: 0, end: 0 };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 bg-slate-50 min-h-screen">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
          {editId ? <Edit3 className="text-orange-500" /> : <PlusCircle className="text-blue-600" />}
          {editId ? "Edit News Post" : "Compose New Story"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Side: Metadata */}
          <div className="space-y-5">
            <input
              type="text"
              placeholder="Catchy Headline"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <textarea
              placeholder="Short Summary (Excerpt)"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              required
            />

            <div className="border-2 border-dashed border-slate-200 p-6 rounded-3xl text-center bg-slate-50 relative group">
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} className="w-full h-48 object-cover rounded-2xl shadow-sm" alt="Thumbnail" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-10">
                  <div className="p-4 bg-white rounded-full shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {uploading ? "Uploading Thumbnail..." : "Add Main Thumbnail"}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Right Side: Content Editor */}
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 bg-slate-800 rounded-2xl shadow-inner">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-2 text-white hover:bg-slate-700 rounded-lg"
                title="Bold"
              >
                <Bold size={18} />
              </button>

              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-2 text-white hover:bg-slate-700 rounded-lg"
                title="Italic"
              >
                <Italic size={18} />
              </button>

              <div className="h-6 w-[1px] bg-slate-600 mx-1 self-center" />

              {/* ✅ Fixed Inline Image Upload Button */}
              <label
                className="p-2 text-blue-400 hover:bg-slate-700 rounded-lg cursor-pointer"
                title="Insert Image into Content"
              >
                {inlineUploading
                  ? <Loader2 className="animate-spin" size={18} />
                  : <ImageIcon size={18} />
                }
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleInlineImageUpload}
                />
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 text-white hover:bg-slate-700 rounded-lg"
                  title="Text Color"
                >
                  <Palette size={18} />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-2xl z-50 grid grid-cols-5 gap-1 w-40">
                    {TEXT_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => { formatText('color', c); setShowColorPicker(false); }}
                        className="w-6 h-6 rounded-full cursor-pointer border border-slate-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Textarea with cursor tracking */}
            <textarea
              id="content-editor"
              placeholder="Start writing your story here... (Use Enter for new lines)"
              className="w-full p-5 bg-white border border-slate-200 rounded-3xl h-80 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium resize-none"
              value={formData.content}
              onChange={(e) => {
                handleCursorTrack(e);
                setFormData(prev => ({ ...prev, content: e.target.value }));
              }}
              onSelect={handleCursorTrack}
              onBlur={handleCursorTrack}
              onClick={handleCursorTrack}
              onKeyUp={handleCursorTrack}
              required
            />

            {/* Live Preview */}
            <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Preview</h4>
              <div
                className="prose prose-slate max-w-none"
                style={{
                  whiteSpace: 'pre-line',
                  fontFamily: formData.fontFamily,
                  color: formData.textColor,
                }}
                dangerouslySetInnerHTML={{ __html: formData.content || 'Your story starts here...' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploading || inlineUploading}
              className={`w-full p-5 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all shadow-lg ${
                editId ? 'bg-orange-500' : 'bg-blue-600'
              } text-white hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Newspaper size={22} />}
              {editId ? "Update Published News" : "Publish Story Now"}
            </button>
          </div>
        </form>
      </div>

      {/* Recently Published Grid */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 ml-2">Recently Published</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 hover:shadow-xl transition-all group"
            >
              {news.image && (
                <img
                  src={news.image}
                  className="w-full h-40 object-cover rounded-2xl mb-4"
                  alt="Post"
                />
              )}
              <h4 className="font-bold text-slate-800 line-clamp-1">{news.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{news.date}</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <button
                  onClick={() => handleEdit(news)}
                  className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => deleteDoc(doc(db, "news", news.id))}
                  className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNews;
