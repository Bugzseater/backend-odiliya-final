import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Info, Phone, Newspaper, Menu, X, type LucideIcon } from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
    { name: 'News', path: '/news', icon: Newspaper },
  ];

  return (
    <div className={`flex flex-col h-auto p-3 bg-slate-950 text-white transition-all duration-300 shadow-xl ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 px-2 pt-2">
        {isOpen && <h1 className="text-xl font-extrabold tracking-wider text-blue-400">ODILIYA DASHBOARD</h1>}
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

      {/* Footer Profile Section */}
      <div className="mt-auto border-t border-slate-800 pt-4 flex items-center px-2">
        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 shrink-0" />
        {isOpen && (
          <div className="ml-3 overflow-hidden">
            <p className="text-xs font-semibold truncate">User Admin</p>
            <p className="text-[10px] text-slate-500 truncate">admin@example.com</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;