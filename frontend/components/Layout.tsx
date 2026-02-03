import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Video, Bell, User, LogOut, Home as HomeIcon, Radio, PlaySquare, Menu as MenuIcon, LayoutDashboard, History, Clock, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../utils/media';

const Layout: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MenuIcon size={20} />
          </button>
          <Link to="/" className="flex items-center gap-1">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-white border-b-[5px] border-b-transparent ml-1"></div>
            </div>
            <span className="text-xl font-bold tracking-tight">Cinnova Streaming Platform</span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
          <div className="flex w-full">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 border border-gray-300 rounded-l-full focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="px-5 bg-gray-50 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-100">
              <Search size={18} className="text-gray-600" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/upload" className="hidden md:flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-full text-sm font-medium">
            <Video size={20} />
            <span>Create</span>
          </Link>

          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <img src={resolveMediaUrl(user.avatar)} alt="Profile" className="w-8 h-8 rounded-full" />
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-blue-600 font-medium hover:bg-blue-50">
              <User size={18} />
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="flex pt-16 flex-1">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 bottom-0 bg-white w-64 p-3 overflow-y-auto transition-transform duration-300 border-r border-gray-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} hidden md:block z-40`}>
          <div className="space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/') ? 'bg-gray-100' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <HomeIcon size={20} />
              Home
            </Link>
            <Link
              to="/live"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/live') ? 'bg-gray-100' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <Radio size={20} className={isActive('/live') ? 'text-red-600' : ''} />
              Live
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">You</h3>
            <div className="space-y-1">
              <Link
                to="/channel"
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/channel') ? 'bg-gray-100' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <LayoutDashboard size={20} />
                Your Channel
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/history') ? 'bg-gray-100' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <History size={20} />
                History
              </Link>
              <Link
                to="/channel" // Placeholder for "Your Videos" usually same as channel content
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-700`}
              >
                <PlaySquare size={20} />
                Your Videos
              </Link>
              <Link
                to="/liked"
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive('/liked') ? 'bg-gray-100' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <ThumbsUp size={20} />
                Liked Videos
              </Link>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-700"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-4 md:p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
