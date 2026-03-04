import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Save } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Meta Details Manager</h1>
          <p className="text-gray-600 mt-1">Manage SEO details for projects and lands</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm w-fit">
          <button
            onClick={() => { setActiveTab('projects'); setSelectedItem(null); }}
            className={`px-6 py-2 rounded-md transition-all ${
              activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => { setActiveTab('lands'); setSelectedItem(null); }}
            className={`px-6 py-2 rounded-md transition-all ${
              activeTab === 'lands' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Lands
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Items List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-700">
                  {activeTab === 'projects' ? 'Projects' : 'Lands'} ({currentItems.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-125 overflow-y-auto">
                {currentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${
                      selectedItem?.id === item.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.location || 'No location'}</p>
                    {item.slug && (
                      <p className="text-xs text-blue-600 mt-1">/{item.slug}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              {selectedItem ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Edit: {selectedItem.name}
                  </h2>

                  <div className="space-y-5">
                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug (URL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="enter-url-slug"
                        />
                        <button
                          type="button"
                          onClick={generateSlug}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">URL: /{formData.slug}</p>
                    </div>

                    {/* Meta Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter meta title"
                      />
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Enter meta description (optional)"
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Meta Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  <p>Select a {activeTab === 'projects' ? 'project' : 'land'} from the list</p>
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