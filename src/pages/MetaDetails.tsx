import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  Loader2, Save, Search, Tag, FileText, Globe,
  ArrowLeft, Copy, Check, AlertCircle, Sparkles,
  Layers, MapPin, ChevronRight, RefreshCw
} from 'lucide-react';

// Base item type එක define කරනවා
interface BaseItem {
  id: string;
  name: string;
  location?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: any; // additional fields සඳහා
}

const MetaDetails = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<BaseItem[]>([]);
  const [lands, setLands] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
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

  // Copy to clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
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
  
  // Filter items based on search
  const filteredItems = currentItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Tag className="text-orange-600" size={32} />
                SEO Meta Manager
              </h1>
              <p className="text-gray-500">Manage SEO details and URLs for projects and lands</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600">Total: </span>
                <span className="font-bold text-orange-600">{currentItems.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('projects'); setSelectedItem(null); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'projects' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Layers size={18} />
            Projects
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'projects' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {projects.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('lands'); setSelectedItem(null); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'lands' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MapPin size={18} />
            Lands
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'lands' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {lands.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <Loader2 size={40} className="animate-spin text-orange-600 mb-4" />
            <p className="text-gray-500">Loading {activeTab}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Items List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-transparent">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FileText size={16} className="text-orange-600" />
                      {activeTab === 'projects' ? 'Projects' : 'Lands'} 
                      <span className="text-sm font-normal text-gray-400">({filteredItems.length})</span>
                    </h2>
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`w-full p-4 text-left hover:bg-orange-50 transition-all group relative ${
                          selectedItem?.id === item.id 
                            ? 'bg-orange-50 border-l-4 border-orange-600' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedItem?.id === item.id 
                              ? 'bg-orange-100' 
                              : 'bg-gray-100 group-hover:bg-orange-100'
                          } transition-colors`}>
                            {activeTab === 'projects' ? (
                              <Layers size={16} className={selectedItem?.id === item.id ? 'text-orange-600' : 'text-gray-500'} />
                            ) : (
                              <MapPin size={16} className={selectedItem?.id === item.id ? 'text-orange-600' : 'text-gray-500'} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                            {item.location && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.location}</p>
                            )}
                            {item.slug && (
                              <p className="text-xs text-orange-600 mt-1 truncate">/{item.slug}</p>
                            )}
                          </div>
                          <ChevronRight size={16} className={`text-gray-400 ${
                            selectedItem?.id === item.id ? 'text-orange-600' : ''
                          }`} />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                        <Search size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">No {activeTab} found</p>
                      {searchTerm && (
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {selectedItem ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Form Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-transparent">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Edit SEO Details</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <FileText size={14} className="text-gray-400" />
                          {selectedItem.name}
                          {selectedItem.location && (
                            <>
                              <span className="text-gray-300 mx-1">•</span>
                              <MapPin size={14} className="text-gray-400" />
                              {selectedItem.location}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <ArrowLeft size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form Body */}
                  <div className="p-6 space-y-6">
                    {/* Slug */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Globe size={16} className="text-orange-600" />
                        Slug (URL)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({...formData, slug: e.target.value})}
                            className="w-full pl-7 pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="enter-url-slug"
                          />
                          {formData.slug && (
                            <button
                              type="button"
                              onClick={() => handleCopy(formData.slug, 'slug')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600 transition-colors"
                            >
                              {copySuccess === 'slug' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={generateSlug}
                          className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 rounded-xl transition-colors flex items-center gap-2"
                        >
                          <RefreshCw size={16} />
                          Generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Full URL: https://odiliya.lk/{activeTab}/{formData.slug}
                      </p>
                    </div>

                    {/* Meta Title */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Tag size={16} className="text-orange-600" />
                        Meta Title
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all pr-10"
                          placeholder="Enter meta title (recommended: 50-60 characters)"
                          maxLength={60}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {formData.metaTitle.length}/60
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden`}>
                          <div 
                            className={`h-full transition-all ${
                              formData.metaTitle.length > 60 ? 'bg-red-500' :
                              formData.metaTitle.length > 50 ? 'bg-orange-500' :
                              formData.metaTitle.length > 0 ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ width: `${Math.min((formData.metaTitle.length / 60) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs ${
                          formData.metaTitle.length > 60 ? 'text-red-500' :
                          formData.metaTitle.length > 50 ? 'text-orange-500' :
                          'text-gray-400'
                        }`}>
                          {formData.metaTitle.length > 60 ? 'Too long' : 
                           formData.metaTitle.length > 50 ? 'Optimal' : 
                           'Good'}
                        </span>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText size={16} className="text-orange-600" />
                        Meta Description
                      </label>
                      <div className="relative">
                        <textarea
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                          rows={4}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none pr-16"
                          placeholder="Enter meta description (recommended: 150-160 characters)"
                          maxLength={160}
                        />
                        <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                          {formData.metaDescription.length}/160
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden`}>
                          <div 
                            className={`h-full transition-all ${
                              formData.metaDescription.length > 160 ? 'bg-red-500' :
                              formData.metaDescription.length > 150 ? 'bg-orange-500' :
                              formData.metaDescription.length > 0 ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ width: `${Math.min((formData.metaDescription.length / 160) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs ${
                          formData.metaDescription.length > 160 ? 'text-red-500' :
                          formData.metaDescription.length > 150 ? 'text-orange-500' :
                          'text-gray-400'
                        }`}>
                          {formData.metaDescription.length > 160 ? 'Too long' : 
                           formData.metaDescription.length > 150 ? 'Optimal' : 
                           'Good'}
                        </span>
                      </div>
                    </div>

                    {/* SEO Preview */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Sparkles size={12} className="text-orange-600" />
                        Google Search Preview
                      </h3>
                      <div className="space-y-1">
                        <div className="text-blue-700 text-lg font-medium line-clamp-1 hover:underline cursor-pointer">
                          {formData.metaTitle || selectedItem.name}
                        </div>
                        <div className="text-green-700 text-sm">
                          https://odiliya.lk/{activeTab}/{formData.slug || 'url-slug'}
                        </div>
                        <div className="text-gray-600 text-sm line-clamp-2">
                          {formData.metaDescription || 'Meta description will appear here...'}
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="inline-flex p-4 bg-orange-50 rounded-full mb-4">
                    <Tag size={32} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Item Selected</h3>
                  <p className="text-gray-500 mb-6">
                    Select a {activeTab === 'projects' ? 'project' : 'land'} from the list to edit its SEO details
                  </p>
                  <div className="text-sm text-gray-400">
                    <p>You can manage:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• Custom URL slugs</li>
                      <li>• Meta titles for search engines</li>
                      <li>• Meta descriptions for better SEO</li>
                    </ul>
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