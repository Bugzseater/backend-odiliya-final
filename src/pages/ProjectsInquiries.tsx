import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, Trash2, 
  Eye, EyeOff, RefreshCw, Briefcase, 
  User, Search, Filter, Download,
  ChevronDown, ChevronUp, Check, Copy,
  AlertCircle, Clock, Inbox, Tag,
  MessageSquare, Building, XCircle
} from "lucide-react";

// Inquiry type එක define කරනවා
interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectName: string;
  message?: string;
  status: string;
  submittedAt?: {
    toDate?: () => Date;
    seconds?: number;
    nanoseconds?: number;
  } | Date | null;
}

function ProjectsInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0
  });

  // Firestore එකෙන් data real-time ලබා ගැනීම
  useEffect(() => {
    const q = query(collection(db, "inquiries"), orderBy("submittedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        let submittedAt = null;
        
        // Handle date properly
        if (docData.submittedAt) {
          if (typeof docData.submittedAt.toDate === 'function') {
            submittedAt = docData.submittedAt.toDate();
          } else {
            submittedAt = docData.submittedAt;
          }
        }
        
        return {
          id: doc.id,
          name: docData.name || '',
          email: docData.email || '',
          phone: docData.phone || '',
          projectName: docData.projectName || '',
          message: docData.message || '',
          status: docData.status || 'unread',
          submittedAt: submittedAt
        };
      }) as Inquiry[];
      
      setInquiries(data);
      
      // Calculate stats
      const unreadCount = data.filter(i => i.status === 'unread').length;
      setStats({
        total: data.length,
        unread: unreadCount,
        read: data.length - unreadCount
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inquiries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Status එක (Read/Unread) update කිරීම
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await updateDoc(doc(db, "inquiries", id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Record එක delete කිරීම
  const deleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        await deleteDoc(doc(db, "inquiries", id));
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  // Date format කරනවා
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    if (date instanceof Date) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      }).format(date);
    }
    
    return "N/A";
  };

  // Copy to clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(field);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Project', 'Message', 'Status', 'Date'];
    const csvData = filteredInquiries.map(i => [
      i.name || '',
      i.email || '',
      i.phone || '',
      i.projectName || '',
      i.message || '',
      i.status || 'unknown',
      formatDate(i.submittedAt)
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-inquiries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = filter === "all" || inquiry.status === filter;
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = 
      (inquiry.name && inquiry.name.toLowerCase().includes(searchStr)) ||
      (inquiry.email && inquiry.email.toLowerCase().includes(searchStr)) ||
      (inquiry.phone && inquiry.phone.includes(searchTerm)) ||
      (inquiry.projectName && inquiry.projectName.toLowerCase().includes(searchStr)) ||
      (inquiry.message && inquiry.message.toLowerCase().includes(searchStr));
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Briefcase className="text-orange-600" size={32} />
                Project Inquiries
              </h1>
              <p className="text-gray-500">Manage inquiries received from project pages</p>
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

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, project or message..."
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
                : 'No project inquiries have been received yet'}
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
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                      item.status === 'unread' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status || 'new'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteRecord(item.id); }}
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

                  {/* Contact Details */}
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

                  {/* Project Interest */}
                  <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-600 font-bold uppercase mb-1 flex items-center gap-1">
                      <Building size={12} />
                      Project Interested
                    </p>
                    <p className="text-sm font-semibold text-orange-900 line-clamp-1">
                      {item.projectName || 'Not specified'}
                    </p>
                  </div>

                  {/* Message Preview */}
                  {item.message && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                        <MessageSquare size={12} />
                        Message
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2 italic">
                        "{item.message}"
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={12} />
                      {formatDate(item.submittedAt)}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleStatus(item.id, item.status); 
                      }}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        item.status === 'unread' 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.status === 'unread' ? <Eye size={14} /> : <EyeOff size={14} />}
                      {item.status === 'unread' ? 'Mark Read' : 'Mark Unread'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
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
                      <Briefcase size={12} />
                      Project Inquiry Details
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
                          onClick={() => handleCopy(selectedInquiry.email, 'email')}
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
                          onClick={() => handleCopy(selectedInquiry.phone, 'phone')}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          {copySuccess === 'phone' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                    <Building size={12} />
                    Project Interested
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold">
                      {selectedInquiry.projectName || 'Not specified'}
                    </p>
                    {selectedInquiry.projectName && (
                      <button
                        onClick={() => handleCopy(selectedInquiry.projectName, 'project')}
                        className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-200 rounded-lg transition-colors"
                      >
                        {copySuccess === 'project' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message */}
                {selectedInquiry.message && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <MessageSquare size={12} />
                      Message
                    </p>
                    <div className="relative">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {selectedInquiry.message}
                      </p>
                      <button
                        onClick={() => handleCopy(selectedInquiry.message!, 'message')}
                        className="absolute top-0 right-0 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        {copySuccess === 'message' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

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
                        toggleStatus(selectedInquiry.id, selectedInquiry.status);
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
                        if (window.confirm("Are you sure you want to delete this inquiry?")) {
                          deleteRecord(selectedInquiry.id);
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
}

export default ProjectsInquiries;