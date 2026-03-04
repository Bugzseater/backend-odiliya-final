import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { 
  Mail, Phone, Calendar, Trash2, 
  Eye, EyeOff, RefreshCw, Briefcase, 
  User
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="text-blue-600" /> Project Inquiries
        </h2>
        <p className="text-gray-500 text-sm">Manage inquiries received from project pages</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white p-10 rounded-xl text-center shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No project inquiries found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inquiries.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md overflow-hidden ${
                item.status === 'unread' ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    item.status === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status || 'new'}
                  </span>
                  <button 
                    onClick={() => deleteRecord(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-gray-400" /> {item.name || 'No Name'}
                  </h3>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-2"><Mail size={14} /> {item.email || 'No Email'}</p>
                    <p className="flex items-center gap-2"><Phone size={14} /> {item.phone || 'No Phone'}</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-[11px] text-blue-500 font-bold uppercase mb-1">Project Interested</p>
                    <p className="text-sm font-semibold text-blue-900">{item.projectName || 'Not specified'}</p>
                  </div>

                  {item.message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                       <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">Message</p>
                       <p className="text-sm text-gray-700 italic">"{item.message}"</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar size={12} /> {formatDate(item.submittedAt)}
                    </div>
                    <button 
                      onClick={() => toggleStatus(item.id, item.status)}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        item.status === 'unread' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.status === 'unread' ? <><Eye size={14} /> Mark Read</> : <><EyeOff size={14} /> Mark Unread</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsInquiries;