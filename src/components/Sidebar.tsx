import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Info, Phone, Newspaper,
  Landmark, Building2, Tag, LogOut, Image, 
  MessageSquare, ChevronLeft, ChevronRight,
  Settings, HelpCircle, Bell
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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const location = useLocation();
  const { logout } = useAuth();

  // Check if sidebar state is saved in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setIsOpen(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isOpen));
  }, [isOpen]);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Building2, badge: 3 },
    { name: 'Land Projects', path: '/land', icon: Landmark },
    { name: 'News', path: '/news', icon: Newspaper, badge: 2 },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone, badge: 5 },
    { name: 'Project Inquiries', path: '/projects-inquiries', icon: MessageSquare },
    { name: 'SEO Meta', path: '/meta', icon: Tag },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  // Determine if sidebar should be expanded (open or hovered)
  const expanded = isOpen || isHovered;

  return (
    <>
      {/* Fixed Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-white shadow-xl transition-all duration-300 z-50
          ${expanded ? 'w-64' : 'w-20'}
          border-r border-gray-100
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-100
          ${expanded ? 'justify-between' : 'justify-center'}
        `}>
          {expanded ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
                <span className="font-bold text-lg text-gray-800 tracking-tight">
                  <span className="text-orange-600">Odiliya</span>
                  <span className="text-gray-400 text-xs ml-1 font-normal">Admin</span>
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-orange-600"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-orange-600"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto h-[calc(100vh-64px)] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-linear-to-r from-orange-50 to-orange-50/50 text-orange-600 shadow-sm border border-orange-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
                    }
                    ${!expanded && 'justify-center'}
                  `}
                >
                  {/* Icon */}
                  <div className={`relative ${!expanded && 'mx-auto'}`}>
                    <Icon 
                      size={20} 
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={`transition-all ${isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'}`}
                    />
                    {/* Badge */}
                    {item.badge && expanded && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  {expanded && (
                    <span className="ml-3 text-sm font-medium flex-1">{item.name}</span>
                  )}

                  {/* Active Indicator */}
                  {isActive && expanded && (
                    <div className="w-1 h-5 bg-orange-500 rounded-full absolute right-2"></div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!expanded && (
                    <div className="fixed left-16 ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-60 shadow-lg">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.badge && (
                          <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100"></div>

          {/* Bottom Links */}
          <div className="space-y-1">
            <Link
              to="/settings"
              className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${!expanded && 'justify-center'}
                text-gray-600 hover:bg-gray-50 hover:text-orange-600
              `}
            >
              <Settings size={20} className={`${!expanded ? 'mx-auto' : ''} text-gray-500 group-hover:text-orange-600`} />
              {expanded && <span className="ml-3 text-sm font-medium">Settings</span>}
              {!expanded && (
                <div className="fixed left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-60">
                  Settings
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </Link>

            <Link
              to="/help"
              className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${!expanded && 'justify-center'}
                text-gray-600 hover:bg-gray-50 hover:text-orange-600
              `}
            >
              <HelpCircle size={20} className={`${!expanded ? 'mx-auto' : ''} text-gray-500 group-hover:text-orange-600`} />
              {expanded && <span className="ml-3 text-sm font-medium">Help & Support</span>}
              {!expanded && (
                <div className="fixed left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-60">
                  Help & Support
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${!expanded && 'justify-center'}
                text-gray-600 hover:bg-red-50 hover:text-red-600
              `}
            >
              <LogOut size={20} className={`${!expanded ? 'mx-auto' : ''} text-gray-500 group-hover:text-red-600`} />
              {expanded && <span className="ml-3 text-sm font-medium">Logout</span>}
              {!expanded && (
                <div className="fixed left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-60">
                  Logout
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </button>
          </div>
        </nav>

        {/* User Profile Section (Bottom) */}
        {expanded && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">Admin User</p>
                <p className="text-xs text-gray-400 truncate">admin@odiliya.com</p>
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={16} className="text-gray-400 hover:text-orange-600" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Spacer */}
      <div className={`transition-all duration-300 ${expanded ? 'ml-64' : 'ml-20'}`} />
    </>
  );
};

export default Sidebar;