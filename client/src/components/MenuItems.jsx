import { NavLink } from 'react-router-dom';
import { menuItemsData } from '../assets/assets';

const MenuItems = ({ setSidebarOpen, unreadCount }) => {
  return (
    <nav className="px-4 py-3 text-gray-600 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'hover:bg-gray-50 hover:text-indigo-600'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
        </NavLink>
      ))}
    </nav>
  );
};

export default MenuItems;