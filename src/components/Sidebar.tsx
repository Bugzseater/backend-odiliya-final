import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Info, Phone, Newspaper, Menu, X, type LucideIcon, Landmark, Building2, TagIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Land', path: '/land', icon: Landmark },
    { name: 'Projects', path: '/projects', icon: Building2 },
    { name: 'Projects Inquiries', path: '/projects-inquiries', icon: Building2 },
    { name: 'Gallery', path: '/gallery', icon: Building2 },
    { name: 'Meta', path: '/meta', icon: TagIcon },
  ];

  return (
    <div className={`flex flex-col h-auto p-3 bg-white text-[#2f2f2f] transition-all duration-300 shadow-xl ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 px-2 pt-2">
        {isOpen && <h1 className="text-xl font-extrabold tracking-wider text-blue-400">ODILIYA</h1>}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 px-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              <div className={`${!isOpen && 'mx-auto'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {isOpen && (
                <span className="ml-3 font-medium text-sm antialiased">{item.name}</span>
              )}
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="fixed left-20 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

<button
  onClick={logout}
  className="w-full flex items-center p-3 rounded-xl transition-all duration-200 hover:bg-red-600/10 text-slate-400 hover:text-red-500 mb-2"
>
  <div className={`${!isOpen && 'mx-auto'}`}>
    <LogOut size={22} />
  </div>
  {isOpen && (
    <span className="ml-3 font-medium text-sm">Logout</span>
  )}
  {!isOpen && (
    <div className="fixed left-20 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
      Logout
    </div>
  )}
</button>
    </div>
  );
};

export default Sidebar;