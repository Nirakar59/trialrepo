import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, X } from 'lucide-react';
import Loading from '../components/Loading';
import useAuth from '../hooks/useAuth';

const Layout = () => {
  const { user, isLoading } = useAuth(); // Use real auth user
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <Loading />; // Show loader while auth status is loading
  }

  if (!user) {
    return <Loading />; // Or you can navigate to login if needed
  }

  return (
    <div className="w-full flex h-screen relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 bg-slate-50">
        <Outlet /> {/* Nested pages render here */}
      </div>

      {sidebarOpen ? (
        <X
          className="absolute top-3 right-3 p-2 z-50 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : (
        <Menu
          className="absolute top-3 right-3 p-2 z-50 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
};

export default Layout;
