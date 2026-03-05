import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  Loader2, Save, Tag, Globe, FileText, 
  Sparkles, Link, RefreshCw,
  Layout, Layers, Code, Hash,
  ArrowRight, Settings, Search, Filter
} from 'lucide-react';

// Base item type define කරනවා
interface BaseItem {
  id: string;
  name: string;
  location?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: any;
}

const MetaDetails = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<BaseItem[]>([]);
  const [lands, setLands] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    metaTitle: '',
    metaDescription: ''
  });

  // Slug එක create කරනවා
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Data fetch කරනවා
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'projects') {
          const snapshot = await getDocs(collection(db, 'projectDetails'));
          const projectsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as BaseItem[];
          setProjects(projectsData);
        } else {
          const snapshot = await getDocs(collection(db, 'landProjects'));
          const landsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as BaseItem[];
          setLands(landsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // Item එකක් select කරන විට
  const handleSelectItem = (item: BaseItem) => {
    setSelectedItem(item);
    setFormData({
      slug: item.slug || createSlug(item.name),
      metaTitle: item.metaTitle || item.name,
      metaDescription: item.metaDescription || ''
    });
  };

  // Slug generate කරනවා
  const generateSlug = () => {
    if (selectedItem) {
      setFormData(prev => ({
        ...prev,
        slug: createSlug(selectedItem.name)
      }));
    }
  };

  // Save කරනවා
  const handleSave = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const collectionName = activeTab === 'projects' ? 'projectDetails' : 'landProjects';
      await updateDoc(doc(db, collectionName, selectedItem.id), formData);
      alert('✅ Saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const currentItems = activeTab === 'projects' ? projects : lands;
  
  const filteredItems = currentItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.slug && item.slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-600/30">
              <Tag className="text-purple-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Meta Details Manager</h1>
              <p className="text-[#8B8B98] mt-1">Manage SEO details for projects and lands</p>
            </div>
          </div>
        </div>

        {/* Tabs with Search */}
        <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-[#1A1A24] p-1.5 rounded-2xl border border-[#252530]">
              <button
                onClick={() => { setActiveTab('projects'); setSelectedItem(null); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'projects' 
                    ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-[#8B8B98] hover:text-white'
                }`}
              >
                <Layout size={18} /> Projects
              </button>
              <button
                onClick={() => { setActiveTab('lands'); setSelectedItem(null); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'lands' 
                    ? 'bg-linear-to-r from-emerald-600 to-green-600 text-white shadow-lg' 
                    : 'text-[#8B8B98] hover:text-white'
                }`}
              >
                <Layers size={18} /> Lands
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98]" size={18} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-600/20 blur-xl rounded-full"></div>
              <Loader2 className="relative z-10 w-12 h-12 animate-spin text-purple-500" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Items List */}
            <div className="bg-[#13131A] rounded-3xl border border-[#252530] overflow-hidden">
              <div className="p-6 border-b border-[#252530] bg-[#1A1A24]">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Layers size={18} className="text-purple-500" />
                    {activeTab === 'projects' ? 'Projects' : 'Lands'}
                  </h2>
                  <div className="px-3 py-1.5 bg-[#252530] rounded-xl">
                    <span className="text-sm text-[#8B8B98]">Total: </span>
                    <span className="text-white font-bold ml-1">{filteredItems.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-[#252530] max-h-150 overflow-y-auto scrollbar-thin scrollbar-thumb-[#353540] scrollbar-track-transparent">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#1A1A24] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#252530]">
                      <Filter size={24} className="text-[#8B8B98]" />
                    </div>
                    <p className="text-[#8B8B98]">No items found</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full p-5 text-left hover:bg-[#1A1A24] transition-all group ${
                        selectedItem?.id === item.id 
                          ? 'bg-linear-to-r from-purple-600/10 to-pink-600/10 border-l-4 border-l-purple-600' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${
                          selectedItem?.id === item.id 
                            ? 'bg-purple-600/20 text-purple-500' 
                            : 'bg-[#1A1A24] text-[#8B8B98] group-hover:text-white'
                        }`}>
                          {activeTab === 'projects' ? <Layout size={16} /> : <Layers size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{item.name}</h3>
                          <p className="text-sm text-[#8B8B98] mt-1 truncate">
                            {item.location || 'No location'}
                          </p>
                          {item.slug && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-purple-500 bg-purple-600/10 px-2 py-1 rounded-lg w-fit">
                              <Link size={12} />
                              <span className="truncate max-w-37.5">/{item.slug}</span>
                            </div>
                          )}
                        </div>
                        {selectedItem?.id === item.id && (
                          <ArrowRight size={16} className="text-purple-500" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {selectedItem ? (
                <div className="bg-[#13131A] rounded-3xl border border-[#252530] overflow-hidden">
                  {/* Form Header */}
                  <div className="p-6 border-b border-[#252530] bg-[#1A1A24]">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-linear-to-b from-purple-500 to-pink-500 rounded-full"></div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Edit Meta Details</h2>
                        <p className="text-sm text-[#8B8B98] mt-1">{selectedItem.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-[#8B8B98] mb-3">
                        <div className="flex items-center gap-2">
                          <Link size={16} className="text-purple-500" />
                          Slug (URL)
                        </div>
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1 group">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-purple-500 transition-colors" size={18} />
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({...formData, slug: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none transition-all"
                            placeholder="enter-url-slug"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={generateSlug}
                          className="px-6 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-[#8B8B98] hover:text-white hover:border-purple-600/50 hover:bg-purple-600/10 transition-all flex items-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Generate
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-[#1A1A24] rounded-xl border border-[#252530]">
                        <p className="text-xs text-[#8B8B98] flex items-center gap-2">
                          <Code size={14} className="text-purple-500" />
                          Full URL: <span className="text-purple-500 font-mono">/{formData.slug || 'enter-slug'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Meta Title */}
                    <div>
                      <label className="block text-sm font-medium text-[#8B8B98] mb-3">
                        <div className="flex items-center gap-2">
                          <Hash size={16} className="text-purple-500" />
                          Meta Title
                        </div>
                      </label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98] group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none transition-all"
                          placeholder="Enter meta title for SEO"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-[#8B8B98]">
                          {formData.metaTitle.length} characters
                        </span>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-[#8B8B98] mb-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-500" />
                          Meta Description
                        </div>
                      </label>
                      <div className="relative group">
                        <textarea
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                          rows={5}
                          className="w-full p-4 bg-[#1A1A24] border border-[#252530] rounded-xl text-white placeholder-[#4A4A5A] focus:ring-2 focus:ring-purple-600/50 outline-none resize-none"
                          placeholder="Enter meta description for SEO (optional)"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-[#8B8B98]">
                          {formData.metaDescription.length} characters
                        </span>
                      </div>
                    </div>

                    {/* SEO Preview */}
                    <div className="bg-[#1A1A24] p-5 rounded-2xl border border-[#252530]">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-yellow-500" />
                        <h3 className="text-sm font-medium text-white">SEO Preview</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="text-blue-400 text-lg font-medium break-all">
                          {formData.metaTitle || selectedItem.name}
                        </p>
                        <p className="text-green-500 text-sm break-all">
                          yourdomain.com/{formData.slug || 'slug'}
                        </p>
                        <p className="text-[#8B8B98] text-sm break-all line-clamp-2">
                          {formData.metaDescription || 'Meta description will appear here...'}
                        </p>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Save Meta Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#13131A] rounded-3xl border border-[#252530] p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
                      <Settings size={36} className="text-[#8B8B98]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Item Selected</h3>
                    <p className="text-[#8B8B98] max-w-sm">
                      Select a {activeTab === 'projects' ? 'project' : 'land'} from the list to edit its meta details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaDetails;