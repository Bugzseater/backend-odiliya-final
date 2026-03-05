import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, Trash2, 
  Eye, EyeOff, RefreshCw, Briefcase, 
  User, Clock, 
  MessageCircle, XCircle, Filter
} from "lucide-react";

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
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    const q = query(collection(db, "inquiries"), orderBy("submittedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        let submittedAt = null;
        
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
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inquiries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await updateDoc(doc(db, "inquiries", id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        await deleteDoc(doc(db, "inquiries", id));
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

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

  const filteredInquiries = inquiries.filter(inquiry => 
    filter === "all" || inquiry.status === filter
  );

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full"></div>
          <RefreshCw className="animate-spin text-blue-500 relative z-10" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#13131A] rounded-3xl p-8 border border-[#252530]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-600/30">
                <Briefcase className="text-blue-500" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-white">Project Inquiries</h1>
            </div>
            <p className="text-[#8B8B98] ml-2">Manage inquiries received from project pages</p>
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1A1A24] p-2 rounded-2xl border border-[#252530]">
              <Filter size={16} className="text-[#8B8B98]" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
              >
                <option value="all">All Inquiries</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            
            <div className="px-4 py-2 bg-[#1A1A24] rounded-2xl border border-[#252530]">
              <span className="text-[#8B8B98] text-sm">Total: </span>
              <span className="text-white font-bold ml-1">{inquiries.length}</span>
            </div>
          </div>
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="bg-[#13131A] p-16 rounded-3xl text-center border border-[#252530]">
          <div className="w-20 h-20 bg-[#1A1A24] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#252530]">
            <MessageCircle size={32} className="text-[#8B8B98]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No inquiries yet</h3>
          <p className="text-[#8B8B98]">Project inquiries will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInquiries.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedInquiry(item)}
              className="group bg-[#13131A] rounded-3xl border border-[#252530] hover:border-blue-600/50 transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-blue-600/5"
            >
              {/* Status Bar */}
              <div className={`h-1.5 w-full ${item.status === 'unread' ? 'bg-linear-to-r from-blue-600 to-purple-600' : 'bg-[#252530]'}`}></div>
              
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="uppercase">{item.status || 'new'}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteRecord(item.id); }}
                    className="p-2 bg-[#1A1A24] rounded-xl text-[#8B8B98] hover:text-red-500 hover:bg-red-600/10 transition-all border border-[#252530] opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                      <User size={16} className="text-blue-500" />
                      {item.name || 'No Name'}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#8B8B98] bg-[#1A1A24] p-2 rounded-xl border border-[#252530]">
                        <Mail size={14} className="text-blue-500" />
                        <span className="truncate">{item.email || 'No Email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#8B8B98] bg-[#1A1A24] p-2 rounded-xl border border-[#252530]">
                        <Phone size={14} className="text-green-500" />
                        <span>{item.phone || 'No Phone'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Card */}
                  <div className="bg-linear-to-r from-blue-600/10 to-purple-600/10 p-4 rounded-2xl border border-blue-600/20">
                    <p className="text-[10px] text-blue-400 font-bold uppercase mb-2 flex items-center gap-1">
                      <Briefcase size={12} /> Project Interested
                    </p>
                    <p className="text-base font-bold text-white">{item.projectName || 'Not specified'}</p>
                  </div>

                  {/* Message Preview */}
                  {item.message && (
                    <div className="bg-[#1A1A24] p-3 rounded-2xl border border-[#252530]">
                      <p className="text-xs text-[#8B8B98] mb-1">Message</p>
                      <p className="text-sm text-white italic line-clamp-2">"{item.message}"</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#252530]">
                    <div className="flex items-center gap-1.5 text-xs text-[#8B8B98]">
                      <Calendar size={12} className="text-purple-500" />
                      {formatDate(item.submittedAt)}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleStatus(item.id, item.status); 
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        item.status === 'unread' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-[#1A1A24] text-[#8B8B98] hover:text-white border border-[#252530]'
                      }`}
                    >
                      {item.status === 'unread' ? <Eye size={14} /> : <EyeOff size={14} />}
                      {item.status === 'unread' ? 'Mark Read' : 'Mark Unread'}
                    </button>
                  </div>
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
            {/* Modal Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative p-8 border-b border-[#252530]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#8B8B98] text-xs uppercase tracking-wider mb-2">Inquiry Details</p>
                    <h2 className="text-2xl font-bold text-white">{selectedInquiry.name || 'No Name'}</h2>
                    <div className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${getStatusColor(selectedInquiry.status)}`}>
                      {getStatusIcon(selectedInquiry.status)}
                      <span className="uppercase">{selectedInquiry.status}</span>
                    </div>
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
            
            {/* Modal Body */}
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

              <div className="bg-linear-to-r from-blue-600/10 to-purple-600/10 p-6 rounded-2xl border border-blue-600/20">
                <p className="text-blue-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                  <Briefcase size={14} /> Project Interested
                </p>
                <p className="text-xl font-bold text-white">{selectedInquiry.projectName || 'Not specified'}</p>
              </div>

              {(selectedInquiry.message) && (
                <div className="bg-[#1A1A24] p-6 rounded-2xl border border-[#252530]">
                  <p className="text-[#8B8B98] text-xs mb-3">Message</p>
                  <p className="text-white leading-relaxed">{selectedInquiry.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[#252530]">
                <div className="flex items-center gap-2 text-sm text-[#8B8B98]">
                  <Calendar size={16} className="text-purple-500" />
                  {formatDate(selectedInquiry.submittedAt)}
                </div>
                <button 
                  onClick={() => {
                    toggleStatus(selectedInquiry.id, selectedInquiry.status);
                    setSelectedInquiry(null);
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    selectedInquiry.status === 'unread' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-[#1A1A24] text-white hover:bg-[#252530] border border-[#353540]'
                  }`}
                >
                  {selectedInquiry.status === 'unread' ? <Eye size={18} /> : <EyeOff size={18} />}
                  Mark as {selectedInquiry.status === 'unread' ? 'Read' : 'Unread'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsInquiries;