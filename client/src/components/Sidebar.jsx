import { Link, useNavigate } from 'react-router-dom';
import { CirclePlus, LogOut, X } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import MenuItems from './MenuItems';
import { useNotifications } from '../context/NotificationContext';
import { useEffect, useState } from 'react';
import API from '../api/api';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications(); // Use shared unreadCount
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data } = await API.get('/users/profile', { withCredentials: true });
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    getProfile();
  }, []);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-10 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 xl:w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col justify-between z-20 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <img
              src="/logo.svg"
              alt="App Logo"
              className="w-28 cursor-pointer"
              onClick={() => {
                navigate('/');
                setSidebarOpen(false);
              }}
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <MenuItems setSidebarOpen={setSidebarOpen} unreadCount={unreadCount} />
          </div>

          <div className="px-6 mt-4">
            <Link
              to="/create-post"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center gap-2 py-2.5 w-full rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all text-white shadow-sm"
            >
              <CirclePlus className="w-5 h-5" />
              Create Post
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition">
          <div
            onClick={() => navigate(`/profile`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={
                profile?.profilePics ||
                user?.profile_image ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
              }
              alt="User"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-400 transition"
            />
            <div>
              <h1 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                {profile?.fullname || user?.fullName}
              </h1>
              <p className="text-xs text-gray-500">@{profile?.username || user?.fullName || 'username'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;