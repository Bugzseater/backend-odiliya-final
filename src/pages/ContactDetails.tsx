import  { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, 
  XCircle, Trash2, RefreshCw, 
  Eye, EyeOff, Download, MessageSquare, 
  LayoutDashboard, Database
} from "lucide-react";

const ContactDetails = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [activeTab, setActiveTab] = useState("contact_us"); // 'contact_us' or 'contact_inquiries'
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Real-time data fetch based on activeTab
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, activeTab), orderBy("submittedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }));
      
      setInquiries(inquiriesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const updateStatus = async (id, newStatus) => {
    try {
      const inquiryRef = doc(db, activeTab, id);
      await updateDoc(inquiryRef, {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteInquiry = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, activeTab, id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "No date";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = filter === "all" || inquiry.status === filter;
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      inquiry.name?.toLowerCase().includes(searchStr) ||
      inquiry.email?.toLowerCase().includes(searchStr) ||
      inquiry.phone?.includes(searchTerm) ||
      inquiry.message?.toLowerCase().includes(searchStr) ||
      inquiry.projectName?.toLowerCase().includes(searchStr);
    
    return matchesFilter && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Content', 'Status', 'Date'];
    const csvData = filteredInquiries.map(i => [
      i.name, i.email, i.phone, 
      (i.message || i.projectName || "N/A"), 
      i.status, formatDate(i.submittedAt)
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Top Navigation / Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">Manage all incoming communications</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setActiveTab("contact_us")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'contact_us' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Database size={18} /> Contact Us
          </button>
          <button 
            onClick={() => setActiveTab("contact_inquiries")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${activeTab === 'contact_inquiries' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <MessageSquare size={18} /> Inquiries
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select 
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-blue-600 w-10 h-10" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInquiries.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedInquiry(item)}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg relative overflow-hidden ${item.status === 'unread' ? 'border-l-4 border-l-red-500' : 'border-gray-100'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${item.status === 'unread' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                   {item.status === 'unread' ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteInquiry(item.id); }}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500 mb-4 truncate">{item.email}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={12} /> {item.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={12} /> {formatDate(item.submittedAt)}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  {activeTab.replace('_', ' ')}
                </span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    updateStatus(item.id, item.status === 'unread' ? 'read' : 'unread'); 
                  }}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${item.status === 'unread' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-600'}`}
                >
                  Mark as {item.status === 'unread' ? 'Read' : 'Unread'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedInquiry(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-widest mb-1">Inquiry Details</p>
                <h2 className="text-xl font-bold">{selectedInquiry.name}</h2>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XCircle size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Address</p>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 font-medium flex items-center gap-2">
                    <Mail size={14} /> {selectedInquiry.email}
                  </a>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                  <a href={`tel:${selectedInquiry.phone}`} className="text-gray-900 font-medium flex items-center gap-2">
                    <Phone size={14} /> {selectedInquiry.phone}
                  </a>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-gray-400 text-xs mb-2">Message/Project</p>
                <p className="text-gray-800 leading-relaxed">
                  {selectedInquiry.message || selectedInquiry.projectName || "No message content provided."}
                </p>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-2"><Calendar size={14}/> {formatDate(selectedInquiry.submittedAt)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedInquiry.status === 'unread' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {selectedInquiry.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;