import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, ThumbsUp, CheckCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNotifications } from '../context/NotificationContext';

const iconMap = {
  follow: <UserPlus className="w-5 h-5 text-blue-500" />,
  like: <Heart className="w-5 h-5 text-pink-500" />,
  comment: <MessageCircle className="w-5 h-5 text-green-500" />,
  message: <MessageCircle className="w-5 h-5 text-indigo-500" />,
  connect: <ThumbsUp className="w-5 h-5 text-yellow-500" />,
};


const Notifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNavigate = (link) => {
    navigate(link);
  };

  // Helper function to extract post preview text
  const getPostPreview = (noti) => {
    if (noti.postContent) {
      return noti.postContent.length > 50 
        ? noti.postContent.substring(0, 50) + '...' 
        : noti.postContent;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl border border-slate-200/70 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-blue-600" />
            Notifications
          </h1>
          <button
            onClick={markAllAsRead}
            className="text-sm cursor-pointer text-blue-600 hover:underline hover:text-blue-700"
          >
            Mark all as read
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-500 animate-pulse">
            Loading notifications...
          </div>
        )}

        {/* Notification List */}
        {!loading && notifications.length > 0 && (
          <div
            className="rounded-xl border border-slate-200/70 bg-white overflow-y-auto 
                       max-h-[70vh] shadow-inner scroll-smooth 
                       scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
          >
            <AnimatePresence>
              {notifications.map((noti) => {
                const postPreview = getPostPreview(noti);
                
                return (
                  <motion.div
                    key={noti._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                      "relative cursor-pointer flex items-start gap-4 p-5 border-b border-slate-100 hover:bg-slate-50 transition-all duration-200",
                      !noti.read && "bg-blue-50/40"
                    )}
                    onClick={async () => {
                      if (!noti.read) await markAsRead(noti._id);
                      
                      // Navigate based on notification type
                      if (noti.type === 'comment')
                      {
                        const postId = noti.postId || noti.link?.split('/').pop();
                        if (postId) {
                          navigate(`/post/${postId}`);
                        }
                      }
                      else if (noti.type === 'follow' || noti.type === 'connect') {
                        // Navigate to connections page
                        navigate('/connections');
                      } else if (noti.link) {
                        // For other types, use the provided link
                        navigate(noti.link);
                      }
                    }}
                  >
                    {/* New Badge Pulse */}
                    {!noti.read && (
                      <span className="absolute top-4 left-2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                    )}
                    {!noti.read && (
                      <span className="absolute top-4 left-2 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}

                    <div className="flex-shrink-0 mt-1 ml-4">
                      {iconMap[noti.type] || (
                        <Bell className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-slate-800 text-sm sm:text-base font-medium leading-relaxed">
                        {noti.message}
                      </p>
                      
                      {/* Post Preview for like and comment notifications */}
                      {postPreview && (noti.type === 'like' || noti.type === 'comment') && (
                        <div className="mt-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 italic line-clamp-2">
                            "{postPreview}"
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(noti.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {!noti.read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(noti._id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark as read
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Read</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No notifications yet ✨
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;