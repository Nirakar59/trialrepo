import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { API } from '../api/api';

// Placeholder for profile picture if not provided
const DEFAULT_PROFILE_PICTURE = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop';

const RecentMessages = ({ currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const fetchRecentMessages = async () => {
    try {
      const res = await API.get('/message/latest', { withCredentials: true });
      // Map API response to match expected structure
      const formattedMessages = res.data.messages.map((message) => {
        // Determine if the sender or receiver is the "from" user
        const isSender = message.sender._id !== currentUserId;
        const fromUser = isSender ? message.sender : message.receiver;
        return {
          from_user_id: {
            _id: fromUser._id,
            full_name: fromUser.fullname,
            profile_picture: fromUser.profilePics || DEFAULT_PROFILE_PICTURE,
          },
          text: message.text,
          seen: message.seen,
          createdAt: message.createdAt,
        };
      });
      setMessages(formattedMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
      setError('Failed to load recent messages');
    }
  };

  useEffect(() => {
    fetchRecentMessages();
  }, []);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex flex-col max-h-56 overflow-y-scroll no-scrollbar">
        {messages.map((message, index) => (
          <Link
            to={`/messages/${message.from_user_id._id}`}
            key={index}
            className="flex items-start gap-2 py-2 hover:bg-slate-100"
          >
            <img
              src={message.from_user_id.profile_picture}
              alt=""
              className="w-8 h-8 rounded-full"
            />
            <div className="w-full">
              <div className="flex justify-between">
                <p className="font-medium">{message.from_user_id.full_name}</p>
                <p className="text-[10px] text-slate-400">
                  {moment(message.createdAt).fromNow()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-500">
                  {message.text ? message.text : 'Media'}
                </p>
                {!message.seen && (
                  <p className="bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                    1
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentMessages;