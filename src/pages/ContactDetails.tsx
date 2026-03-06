import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, 
  XCircle, Trash2, RefreshCw, 
  Eye, EyeOff, Download, MessageSquare, 
  LayoutDashboard, Database, Search,
  Filter, ChevronDown, ChevronUp, Check,
  Copy, AlertCircle, User, Clock,
  Inbox, Archive, Star, Tag
} from "lucide-react";

// Define the type for inquiries
interface Inquiry {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  projectName?: string;
  status: string;
  submittedAt?: {
    toDate?: () => Date;
    seconds?: number;
    nanoseconds?: number;
  } | Date | null;
}

const ContactDetails = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [activeTab, setActiveTab] = useState("contact_us");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0
  });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, activeTab), orderBy("submittedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle the date properly
        let submittedAt = null;
        if (data.submittedAt) {
          if (typeof data.submittedAt.toDate === 'function') {
            submittedAt = data.submittedAt.toDate();
          } else {
            submittedAt = data.submittedAt;
          }
        }
        
        return {
          id: doc.id,
          ...data,
          submittedAt: submittedAt
        };
      }) as Inquiry[];
      
      setInquiries(inquiriesData);
      
      // Calculate stats
      const unreadCount = inquiriesData.filter(i => i.status === 'unread').length;
      setStats({
        total: inquiriesData.length,
        unread: unreadCount,
        read: inquiriesData.length - unreadCount
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
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

  const deleteInquiry = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, activeTab, id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "No date";
    
    // If it's a Firestore timestamp with toDate method
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    // If it's now a Date object
    if (date instanceof Date) {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      }).format(date);
    }
    
    return "No date";
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = filter === "all" || inquiry.status === filter;
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      (inquiry.name && inquiry.name.toLowerCase().includes(searchStr)) ||
      (inquiry.email && inquiry.email.toLowerCase().includes(searchStr)) ||
      (inquiry.phone && inquiry.phone.includes(searchTerm)) ||
      (inquiry.message && inquiry.message.toLowerCase().includes(searchStr)) ||
      (inquiry.projectName && inquiry.projectName.toLowerCase().includes(searchStr));
    
    return matchesFilter && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Content', 'Status', 'Date'];
    const csvData = filteredInquiries.map(i => [
      i.name || '',
      i.email || '',
      i.phone || '', 
      (i.message || i.projectName || "N/A"), 
      i.status || 'unknown', 
      formatDate(i.submittedAt)
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
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <LayoutDashboard className="text-orange-600" size={32} />
                Communications Dashboard
              </h1>
              <p className="text-gray-500">Manage all incoming inquiries and messages</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-3">
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Unread</p>
                <p className="text-xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Read</p>
                <p className="text-xl font-bold text-green-600">{stats.read}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => { setActiveTab("contact_us"); setSelectedInquiry(null); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'contact_us' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Database size={18} />
            Contact Us
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'contact_us' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {inquiries.length}
            </span>
          </button>
          <button 
            onClick={() => { setActiveTab("contact_inquiries"); setSelectedInquiry(null); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'contact_inquiries' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MessageSquare size={18} />
            Contact Inquiries
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'contact_inquiries' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {inquiries.length}
            </span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            
            {/* Filters & Actions */}
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full lg:w-40 pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
                <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <button 
                onClick={exportToCSV} 
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Main List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="animate-spin text-orange-600 w-10 h-10 mb-4" />
            <p className="text-gray-500">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="inline-flex p-4 bg-orange-50 rounded-full mb-4">
              <Inbox size={48} className="text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Inquiries Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'No results match your search criteria' 
                : 'No inquiries have been received yet'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilter('all'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <XCircle size={16} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInquiries.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedInquiry(item)}
                className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-lg overflow-hidden group ${
                  item.status === 'unread' 
                    ? 'border-l-4 border-l-orange-500 shadow-sm' 
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'unread' 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-gray-50 text-gray-500'
                    }`}>
                      {item.status === 'unread' ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteInquiry(item.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2.5 rounded-full ${
                      item.status === 'unread' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <User size={20} className={item.status === 'unread' ? 'text-orange-600' : 'text-gray-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{item.name || 'No Name'}</h3>
                      <p className="text-sm text-gray-500 truncate">{item.email || 'No Email'}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {item.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400" />
                        <span className="truncate">{item.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{formatDate(item.submittedAt)}</span>
                    </div>
                  </div>

                  {/* Preview */}
                  {(item.message || item.projectName) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} />
                        {item.projectName ? 'Project:' : 'Message:'}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {item.projectName || item.message}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1">
                      <Tag size={10} />
                      {activeTab.replace('_', ' ')}
                    </span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        updateStatus(item.id, item.status === 'unread' ? 'read' : 'unread'); 
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        item.status === 'unread' 
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Mark as {item.status === 'unread' ? 'Read' : 'Unread'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail View Modal */}
        {selectedInquiry && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedInquiry(null)}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare size={12} />
                      Inquiry Details
                    </p>
                    <h2 className="text-xl font-bold">{selectedInquiry.name || 'No Name'}</h2>
                    <p className="text-orange-100 text-sm mt-1">{selectedInquiry.email || 'No Email'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedInquiry(null)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Mail size={12} />
                      Email Address
                    </p>
                    <div className="flex items-center justify-between">
                      <a 
                        href={`mailto:${selectedInquiry.email}`} 
                        className="text-orange-600 font-medium text-sm hover:underline truncate"
                      >
                        {selectedInquiry.email || 'No Email'}
                      </a>
                      {selectedInquiry.email && (
                        <button
                          onClick={() => handleCopy(selectedInquiry.email!, 'email')}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          {copySuccess === 'email' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Phone size={12} />
                      Phone Number
                    </p>
                    <div className="flex items-center justify-between">
                      <a 
                        href={`tel:${selectedInquiry.phone}`} 
                        className="text-gray-900 font-medium text-sm"
                      >
                        {selectedInquiry.phone || 'No Phone'}
                      </a>
                      {selectedInquiry.phone && (
                        <button
                          onClick={() => handleCopy(selectedInquiry.phone!, 'phone')}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          {copySuccess === 'phone' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message/Project */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <MessageSquare size={12} />
                    {selectedInquiry.projectName ? 'Project Interest' : 'Message'}
                  </p>
                  <div className="relative">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedInquiry.message || selectedInquiry.projectName || "No message content provided."}
                    </p>
                    {(selectedInquiry.message || selectedInquiry.projectName) && (
                      <button
                        onClick={() => handleCopy(selectedInquiry.message || selectedInquiry.projectName || '', 'message')}
                        className="absolute top-0 right-0 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        {copySuccess === 'message' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    {formatDate(selectedInquiry.submittedAt)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      selectedInquiry.status === 'unread' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedInquiry.status || 'unknown'}
                    </span>
                    
                    <button
                      onClick={() => {
                        updateStatus(selectedInquiry.id, selectedInquiry.status === 'unread' ? 'read' : 'unread');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedInquiry.status === 'unread'
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      }`}
                    >
                      Mark as {selectedInquiry.status === 'unread' ? 'Read' : 'Unread'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this record?")) {
                          deleteInquiry(selectedInquiry.id);
                          setSelectedInquiry(null);
                        }
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
};

export default ContactDetails;