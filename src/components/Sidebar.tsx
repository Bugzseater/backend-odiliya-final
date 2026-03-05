import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Info, Phone, Newspaper, Menu, X, 
  Landmark, Building2, TagIcon, LogOut, Image, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Land', path: '/land', icon: Landmark },
    { name: 'Projects', path: '/projects', icon: Building2 },
    { name: 'Projects Inquiries', path: '/projects-inquiries', icon: MessageSquare, badge: 3 },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'Meta', path: '/meta', icon: TagIcon },
  ];

  return (
    <div 
      className={`flex flex-col h-screen sticky top-0 bg-[#0D0D14] text-white transition-all duration-500 ease-in-out border-r border-[#252530] ${
        isOpen ? 'w-72' : 'w-24'
      }`}
      style={{ boxShadow: '10px 0 30px -15px rgba(0,0,0,0.5)' }}
    >
      {/* Logo Section with Glass Effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
        <div className={`flex items-center ${isOpen ? 'justify-between px-6' : 'justify-center'} py-8 relative z-10`}>
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ODILIYA
                </h1>
                <p className="text-[10px] text-[#8B8B98] tracking-wider">ADMIN PANEL</p>
              </div>
            </div>
          )}
          {isOpen && (
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          )}
          {!isOpen && (
            <button 
              onClick={() => setIsOpen(true)} 
              className="p-3 hover:bg-[#252530] rounded-xl transition-all text-[#8B8B98] hover:text-white"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#252530] scrollbar-track-transparent">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center group relative ${
                isOpen ? 'justify-start' : 'justify-center'
              } p-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-linear-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-600/10' 
                  : 'text-[#8B8B98] hover:bg-[#1A1A24] hover:text-white'
              }`}
            >
              <div className={`relative ${isActive && 'scale-110'} transition-transform`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl -z-10"></div>
                )}
              </div>
              
              {isOpen && (
                <>
                  <span className="ml-4 font-medium text-sm flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full border border-blue-600/30">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Active Indicator */}
              {isActive && isOpen && (
                <div className="absolute right-4 w-1.5 h-8 bg-linear-to-b from-blue-500 to-purple-500 rounded-full"></div>
              )}
              
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-20 px-3 py-2 bg-[#1A1A24] text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 border border-[#252530] shadow-2xl z-50">
                  {item.name}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#252530]">
        <button
          onClick={logout}
          className={`flex items-center w-full group ${
            isOpen ? 'justify-start' : 'justify-center'
          } p-4 rounded-2xl text-[#8B8B98] hover:bg-red-600/10 hover:text-red-500 transition-all duration-300`}
        >
          <LogOut size={22} className="group-hover:scale-110 transition-transform" />
          {isOpen && (
            <span className="ml-4 font-medium text-sm">Logout</span>
          )}
          {!isOpen && (
            <div className="absolute left-20 px-3 py-2 bg-[#1A1A24] text-red-500 text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 border border-[#252530]">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;