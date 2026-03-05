import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, 
  XCircle, Trash2, RefreshCw, 
  Eye, EyeOff, Download, MessageSquare, 
  LayoutDashboard, Database, Filter,
  Search, Clock,
} from "lucide-react";

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

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, activeTab), orderBy("submittedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => {
        const data = doc.data();
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
    
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'unread': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'read': return 'bg-green-600/20 text-green-400 border-green-600/30';
      default: return 'bg-[#252530] text-[#8B8B98] border-[#353540]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'unread': return <EyeOff size={14} />;
      case 'read': return <Eye size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-600/30">
                <LayoutDashboard className="text-blue-500" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-white">Contact Management</h1>
            </div>
            <p className="text-[#8B8B98] ml-2">Manage all incoming communications</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#1A1A24] rounded-2xl border border-[#252530]">
              <span className="text-[#8B8B98] text-sm">Total: </span>
              <span className="text-white font-bold ml-1">{inquiries.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mt-8 bg-[#1A1A24] p-1.5 rounded-2xl border border-[#252530] w-fit">
          <button 
            onClick={() => setActiveTab("contact_us")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'contact_us' 
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-[#8B8B98] hover:text-white'
            }`}
          >
            <Database size={18} /> Contact Us
          </button>
          <button 
            onClick={() => setActiveTab("contact_inquiries")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'contact_inquiries' 
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'text-[#8B8B98] hover:text-white'
            }`}
          >
            <MessageSquare size={18} /> Contact Inquiries
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-[#13131A] p-6 rounded-3xl border border-[#252530] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B98]" size={18} />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A24] border border-[#252530] rounded-2xl text-white placeholder-[#8B8B98] focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-[#1A1A24] p-2 rounded-2xl border border-[#252530]">
            <Filter size={16} className="text-[#8B8B98]" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <button 
            onClick={exportToCSV} 
            className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full"></div>
            <RefreshCw className="animate-spin text-blue-500 relative z-10" size={40} />
          </div>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-[#13131A] p-16 rounded-3xl text-center border border-[#252530]">
          <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
            <MessageSquare size={32} className="text-[#8B8B98]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No records found</h3>
          <p className="text-[#8B8B98]">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInquiries.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedInquiry(item)}
              className="group bg-[#13131A] rounded-3xl border border-[#252530] hover:border-blue-600/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-600/5 overflow-hidden"
            >
              {/* Status Bar */}
              <div className={`h-1.5 w-full ${item.status === 'unread' ? 'bg-linear-to-r from-red-600 to-pink-600' : 'bg-[#252530]'}`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="uppercase">{item.status || 'new'}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteInquiry(item.id); }}
                    className="p-2 bg-[#1A1A24] rounded-xl text-[#8B8B98] hover:text-red-500 hover:bg-red-600/10 transition-all border border-[#252530] opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{item.name || 'No Name'}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm bg-[#1A1A24] p-3 rounded-xl border border-[#252530]">
                    <Mail size={14} className="text-blue-500" />
                    <span className="text-[#8B8B98] truncate">{item.email || 'No Email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-[#1A1A24] p-3 rounded-xl border border-[#252530]">
                    <Phone size={14} className="text-green-500" />
                    <span className="text-[#8B8B98]">{item.phone || 'No Phone'}</span>
                  </div>
                </div>

                {/* Message Preview */}
                {(item.message || item.projectName) && (
                  <div className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530] mb-4">
                    <p className="text-xs text-[#8B8B98] mb-2">Content</p>
                    <p className="text-sm text-white line-clamp-2">
                      {item.message || item.projectName}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                  <div className="flex items-center gap-1.5 text-xs text-[#8B8B98]">
                    <Calendar size={12} className="text-purple-500" />
                    {formatDate(item.submittedAt)}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#8B8B98] bg-[#1A1A24] px-3 py-1 rounded-full border border-[#252530]">
                    {activeTab.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInquiry && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInquiry(null)}
        >
          <div 
            className="bg-[#13131A] rounded-3xl w-full max-w-2xl border border-[#252530] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative p-8 border-b border-[#252530]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#8B8B98] text-xs uppercase tracking-wider mb-2">Contact Details</p>
                    <h2 className="text-2xl font-bold text-white">{selectedInquiry.name || 'No Name'}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedInquiry(null)}
                    className="p-3 bg-[#1A1A24] rounded-xl text-[#8B8B98] hover:text-white hover:bg-red-600/20 transition-all border border-[#252530]"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530]">
                  <p className="text-[#8B8B98] text-xs mb-2">Email Address</p>
                  <a 
                    href={`mailto:${selectedInquiry.email}`} 
                    className="text-blue-400 font-medium flex items-center gap-2 hover:text-blue-300 transition-colors"
                  >
                    <Mail size={16} />
                    {selectedInquiry.email || 'No Email'}
                  </a>
                </div>
                <div className="bg-[#1A1A24] p-4 rounded-2xl border border-[#252530]">
                  <p className="text-[#8B8B98] text-xs mb-2">Phone Number</p>
                  <a 
                    href={`tel:${selectedInquiry.phone}`} 
                    className="text-green-400 font-medium flex items-center gap-2 hover:text-green-300 transition-colors"
                  >
                    <Phone size={16} />
                    {selectedInquiry.phone || 'No Phone'}
                  </a>
                </div>
              </div>

              <div className="bg-[#1A1A24] p-6 rounded-2xl border border-[#252530]">
                <p className="text-[#8B8B98] text-xs mb-3">Message / Project</p>
                <p className="text-white leading-relaxed">
                  {selectedInquiry.message || selectedInquiry.projectName || "No message content provided."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-[#252530]">
                <div className="flex items-center gap-2 text-sm text-[#8B8B98]">
                  <Calendar size={16} className="text-purple-500" />
                  {formatDate(selectedInquiry.submittedAt)}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${getStatusColor(selectedInquiry.status)}`}>
                    {getStatusIcon(selectedInquiry.status)}
                    <span className="uppercase">{selectedInquiry.status || 'unknown'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      updateStatus(selectedInquiry.id, selectedInquiry.status === 'unread' ? 'read' : 'unread');
                      setSelectedInquiry(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedInquiry.status === 'unread' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-[#1A1A24] text-white hover:bg-[#252530] border border-[#353540]'
                    }`}
                  >
                    Mark as {selectedInquiry.status === 'unread' ? 'Read' : 'Unread'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;