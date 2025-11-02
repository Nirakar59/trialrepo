import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import API from '../api/api';
import { socket } from '../utils/socket';
import useAuth from '../hooks/useAuth';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?._id;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await API.get(`/notify/${userId}`, { withCredentials: true });
      setNotifications(res.data.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notify/read/${id}`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          API.put(`/notify/read/${n._id}`, {}, { withCredentials: true })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Real-time notifications
  useEffect(() => {
    if (!userId) return;

    socket.connect();
    socket.emit('register', userId);

    fetchNotifications();

    socket.on('receive-notification', (newNoti) => {
      console.log('🔔 New notification received:', newNoti);
      setNotifications((prev) => [newNoti, ...prev]);
      toast.success(`🔔 ${newNoti.message}`);
    });

    return () => {
      socket.off('receive-notification');
      socket.disconnect();
    };
  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        unreadCount: notifications.filter((n) => !n.read).length,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);