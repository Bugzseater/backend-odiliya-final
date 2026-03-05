import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Landmark, MessageSquare, Phone, Newspaper,
  TrendingUp, CheckCircle, AlertCircle,
  RefreshCw, Home,
  MapPin, Calendar,
  PieChart, Activity, LayoutDashboard,
  Tag, Award
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  totalLands: number;
  totalInquiries: number;
  totalContact: number;
  totalNews: number;
  totalGallery: number;
  apartments: number;
  residencies: number;
  roiProjects: number;
  soldOutProjects: number;
  unreadInquiries: number;
  unreadContact: number;
  recentProjects: any[];
  recentNews: any[];
  availableProjects: number;
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalLands: 0,
    totalInquiries: 0,
    totalContact: 0,
    totalNews: 0,
    totalGallery: 0,
    apartments: 0,
    residencies: 0,
    roiProjects: 0,
    soldOutProjects: 0,
    unreadInquiries: 0,
    unreadContact: 0,
    recentProjects: [],
    recentNews: [],
    availableProjects: 0
  });

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Projects count with category breakdown
    const projectsQuery = query(collection(db, "projectDetails"));
    unsubscribers.push(
      onSnapshot(projectsQuery, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const apartments = projects.filter((p: any) => p.category === 'Apartments').length;
        const residencies = projects.filter((p: any) => p.category === 'Residencies').length;
        const roiProjects = projects.filter((p: any) => p.category === 'ROI Projects').length;
        const available = projects.filter((p: any) => p.availability === 'Available').length;
        const soldOut = projects.filter((p: any) => p.availability === 'Sold Out').length;
        
        setStats(prev => ({
          ...prev,
          totalProjects: snapshot.size,
          apartments,
          residencies,
          roiProjects,
          availableProjects: available,
          soldOutProjects: soldOut,
          recentProjects: projects.slice(0, 5)
        }));
      })
    );

    // Lands count
    const landsQuery = query(collection(db, "landProjects"));
    unsubscribers.push(
      onSnapshot(landsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, totalLands: snapshot.size }));
      })
    );

    // Inquiries count with unread
    const inquiriesQuery = query(collection(db, "inquiries"));
    unsubscribers.push(
      onSnapshot(inquiriesQuery, (snapshot) => {
        const inquiries = snapshot.docs.map(doc => doc.data());
        const unread = inquiries.filter(i => i.status === 'unread').length;
        setStats(prev => ({ 
          ...prev, 
          totalInquiries: snapshot.size,
          unreadInquiries: unread 
        }));
      })
    );

    // Contact us & inquiries count
    let contactTotal = 0;
    let contactUnread = 0;

    const contactUsQuery = query(collection(db, "contact_us"));
    unsubscribers.push(
      onSnapshot(contactUsQuery, (snapshot) => {
        const contactData = snapshot.docs.map(doc => doc.data());
        const unread = contactData.filter(c => c.status === 'unread').length;
        contactTotal = snapshot.size;
        contactUnread = unread;
        
        setStats(prev => ({ 
          ...prev, 
          totalContact: contactTotal,
          unreadContact: contactUnread
        }));
      })
    );

    const contactInquiriesQuery = query(collection(db, "contact_inquiries"));
    unsubscribers.push(
      onSnapshot(contactInquiriesQuery, (snapshot) => {
        const contactData = snapshot.docs.map(doc => doc.data());
        const unread = contactData.filter(c => c.status === 'unread').length;
        contactTotal += snapshot.size;
        contactUnread += unread;
        
        setStats(prev => ({ 
          ...prev, 
          totalContact: contactTotal,
          unreadContact: contactUnread
        }));
      })
    );

    // News count
    const newsQuery = query(collection(db, "news"));
    unsubscribers.push(
      onSnapshot(newsQuery, (snapshot) => {
        const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStats(prev => ({ 
          ...prev, 
          totalNews: snapshot.size,
          recentNews: news.slice(0, 5)
        }));
      })
    );

    // Gallery count
    const galleryQuery = query(collection(db, "gallery"));
    unsubscribers.push(
      onSnapshot(galleryQuery, (snapshot) => {
        setStats(prev => ({ ...prev, totalGallery: snapshot.size }));
        setLoading(false);
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530] hover:border-blue-600/50 transition-all group hover:scale-105 duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-linear-to-br ${color} group-hover:scale-110 transition-transform`}>
          <div className="text-white">{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-[#8B8B98] text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-[#8B8B98] mt-2">{subtitle}</p>}
      </div>
    </div>
  );

  const CategoryCard = ({ title, value, icon, color, bgColor }: any) => (
    <div className="bg-[#1A1A24] rounded-2xl p-4 border border-[#252530] hover:border-blue-600/50 transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <div className={color}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-[#8B8B98]">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-[#13131A] rounded-3xl p-12 border border-[#252530] flex items-center justify-center min-h-100">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full"></div>
          <RefreshCw className="relative z-10 w-12 h-12 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-linear-to-br from-[#13131A] to-[#1A1A24] rounded-3xl p-8 border border-[#252530] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-emerald-600/20 to-cyan-600/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-600/25">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Dashboard Home
              </h1>
              <p className="text-[#8B8B98] mt-1 text-lg">
                Welcome to Odiliya Admin Panel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Building2 size={24} />}
          color="from-blue-600 to-cyan-600"
          subtitle={`${stats.apartments} Apt, ${stats.residencies} Res, ${stats.roiProjects} ROI`}
        />
        <StatCard 
          title="Total Lands"
          value={stats.totalLands}
          icon={<Landmark size={24} />}
          color="from-emerald-600 to-green-600"
        />
        <StatCard 
          title="Sold Out Projects"
          value={stats.soldOutProjects}
          icon={<Award size={24} />}
          color="from-red-600 to-orange-600"
          subtitle={`${((stats.soldOutProjects / stats.totalProjects) * 100 || 0).toFixed(1)}% of total`}
        />
        <StatCard 
          title="Project Inquiries"
          value={stats.totalInquiries}
          icon={<MessageSquare size={24} />}
          color="from-purple-600 to-pink-600"
          subtitle={`${stats.unreadInquiries} unread`}
        />
        <StatCard 
          title="Contact Messages"
          value={stats.totalContact}
          icon={<Phone size={24} />}
          color="from-orange-600 to-red-600"
          subtitle={`${stats.unreadContact} unread`}
        />
        <StatCard 
          title="News Articles"
          value={stats.totalNews}
          icon={<Newspaper size={24} />}
          color="from-yellow-600 to-orange-600"
        />
      </div>

      {/* Category Breakdown & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by Category */}
        <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530] lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChart size={18} className="text-blue-500" />
              Projects by Category
            </h3>
          </div>

          <div className="space-y-4">
            <CategoryCard 
              title="Apartments"
              value={stats.apartments}
              icon={<Building2 size={18} />}
              color="text-blue-500"
              bgColor="bg-blue-600/20"
            />
            <CategoryCard 
              title="Residencies"
              value={stats.residencies}
              icon={<Home size={18} />}
              color="text-green-500"
              bgColor="bg-green-600/20"
            />
            <CategoryCard 
              title="ROI Projects"
              value={stats.roiProjects}
              icon={<TrendingUp size={18} />}
              color="text-purple-500"
              bgColor="bg-purple-600/20"
            />
          </div>

          {/* Project Status Summary */}
          <div className="mt-6 pt-6 border-t border-[#252530]">
            <h4 className="text-sm font-medium text-[#8B8B98] mb-3">Project Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8B98]">Available</span>
                <span className="text-sm font-bold text-green-500">{stats.availableProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8B98]">Sold Out</span>
                <span className="text-sm font-bold text-red-500">{stats.soldOutProjects}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-500" />
              Recent Projects
            </h3>
          </div>

          <div className="space-y-3">
            {stats.recentProjects.length > 0 ? (
              stats.recentProjects.map((project: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#1A1A24] rounded-2xl border border-[#252530] hover:border-blue-600/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      project.availability === 'Available' 
                        ? 'bg-green-600/20' 
                        : 'bg-red-600/20'
                    }`}>
                      {project.availability === 'Available' 
                        ? <CheckCircle size={20} className="text-green-500" />
                        : <AlertCircle size={20} className="text-red-500" />
                      }
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{project.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-[#8B8B98] flex items-center gap-1">
                          <MapPin size={10} /> {project.location || 'No location'}
                        </p>
                        <p className="text-xs text-[#8B8B98] flex items-center gap-1">
                          <Tag size={10} /> {project.category || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${
                      project.availability === 'Available' 
                        ? 'bg-green-600/20 text-green-500 border border-green-600/30' 
                        : 'bg-red-600/20 text-red-500 border border-red-600/30'
                    }`}>
                      {project.availability}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-[#1A1A24] rounded-2xl border border-[#252530]">
                <Building2 size={40} className="text-[#8B8B98] mx-auto mb-3" />
                <p className="text-[#8B8B98]">No projects yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent News - Without Images */}
      <div className="bg-[#13131A] rounded-3xl p-6 border border-[#252530]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Newspaper size={18} className="text-yellow-500" />
            Recent News
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.recentNews.length > 0 ? (
            stats.recentNews.map((news: any, idx: number) => (
              <div key={idx} className="bg-[#1A1A24] p-5 rounded-2xl border border-[#252530] hover:border-yellow-600/50 transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-yellow-600/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Newspaper size={20} className="text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white line-clamp-1">{news.title}</h4>
                    <p className="text-[10px] text-[#8B8B98] mt-1 flex items-center gap-1">
                      <Calendar size={10} /> {news.date || 'No date'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#8B8B98] line-clamp-2 pl-2 border-l-2 border-yellow-600/30">
                  {news.excerpt || 'No description available'}
                </p>
                <div className="mt-3 flex items-center justify-end">
                  <span className="text-[10px] px-2 py-1 bg-[#252530] rounded-lg text-[#8B8B98]">
                    {news.excerpt ? `${news.excerpt.length} chars` : 'No content'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 bg-[#1A1A24] rounded-2xl border border-[#252530]">
              <Newspaper size={40} className="text-[#8B8B98] mx-auto mb-3" />
              <p className="text-[#8B8B98]">No news articles yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
          <p className="text-[#8B8B98] text-xs">Apartments</p>
          <p className="text-2xl font-bold text-white">{stats.apartments}</p>
        </div>
        <div className="bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
          <p className="text-[#8B8B98] text-xs">Residencies</p>
          <p className="text-2xl font-bold text-white">{stats.residencies}</p>
        </div>
        <div className="bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
          <p className="text-[#8B8B98] text-xs">ROI Projects</p>
          <p className="text-2xl font-bold text-white">{stats.roiProjects}</p>
        </div>
        <div className="bg-[#13131A] p-4 rounded-2xl border border-[#252530]">
          <p className="text-[#8B8B98] text-xs">Sold Out</p>
          <p className="text-2xl font-bold text-white">{stats.soldOutProjects}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;