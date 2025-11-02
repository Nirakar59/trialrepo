import { useEffect, useState, useRef } from 'react';
import { ImageIcon, SendHorizonal, Phone, Video, Mic, MicOff, VideoOff, Maximize2, Minimize2, X, RefreshCw, Info } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useParams } from 'react-router-dom';
import API from '../api/api';
import { socket } from '../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';

// Message List Component
const MessageList = ({ messages, user }) => {
  return (
    <div className="space-y-3 max-w-3xl mx-auto px-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message._id || index}
            className={`flex ${
              message.sender._id === user._id ? 'justify-end' : 'justify-start'
            } items-end gap-2 my-2`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Avatar on LEFT for others */}
            {message.sender._id !== user._id && (
              <img
                src={
                  message.sender.profilePics ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'
                }
                alt={message.sender.fullname}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}

            {/* Message Bubble */}
            <div
              className={`flex flex-col max-w-[70%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                message.sender._id === user._id
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.sender._id !== user._id && (
                <p className="text-xs font-medium text-gray-600 mb-1">
                  {message.sender.fullname}
                </p>
              )}
              {message.message_type === 'image' && message.media_url && (
                <img
                  src={message.media_url}
                  className="w-full max-w-[200px] rounded-lg mb-2 shadow-sm object-cover"
                  alt="Sent media"
                />
              )}
              {message.text && (
                <p className="text-sm break-words">{message.text}</p>
              )}
              <span className="text-xs text-gray-400 mt-1 self-end">
                {new Date(message.createdAt).toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
              </span>
            </div>

            {/* Avatar on RIGHT for current user */}
            {message.sender._id === user._id && (
              <img
                src={
                  user.profilePics ||
                  'https://avatar.iran.liara.run/username?username=' + user.username
                }
                alt={user.fullname}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};



// Group Details Modal Component
const GroupDetailsModal = ({ group, onClose, user, onLeaveGroup, onAddMember, onKickMember }) => {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const isAdmin = group.admins.some((admin) => admin._id === user._id);

  const handleAddMember = async () => {
    if (!newMemberEmail) {
      setError('Please enter an email.');
      return;
    }
    setIsAdding(true);
    try {
      await onAddMember(newMemberEmail);
      setNewMemberEmail('');
      setError('');
    } catch (err) {
      setError('Failed to add member.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Group Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={group.photo || 'https://res.cloudinary.com/dczqoleux/image/upload/v1760852684/group_photos/default_group.png'}
              alt={group.name}
              className="w-12 h-12 rounded-full border-2 border-blue-200"
            />
            <div>
              <p className="font-semibold text-lg text-gray-800">{group.name}</p>
              <p className="text-sm text-gray-500">{group.members.length} members</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">{group.description || 'No description'}</p>
          </div>
          {isAdmin && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add Member</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter email"
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  disabled={isAdding}
                />
                <button
                  onClick={handleAddMember}
                  className={`p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 ${
                    isAdding ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isAdding}
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Members</h3>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.profilePics || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'}
                      alt={member.fullname}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{member.fullname}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      {group.admins.some((admin) => admin._id === member._id) && (
                        <span className="text-xs text-blue-500">Admin</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && member._id !== user._id && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${member.fullname}?`)) {
                          onKickMember(member._id);
                        }
                      }}
                      className="text-red-500 text-xs hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave this group?')) {
                onLeaveGroup();
              }
            }}
            className="w-full p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
          >
            Leave Group
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Chat Input Component
const ChatInput = ({ text, setText, image, setImage, sendMessage, isSending }) => (
  <div className="px-4 py-3 bg-white border-t border-gray-200 shadow-sm">
    <div className="flex items-center gap-2 max-w-3xl mx-auto bg-gray-50 border border-gray-200 rounded-full p-2">
      <input
        type="text"
        className="flex-1 outline-none bg-transparent text-gray-800 text-sm px-3"
        placeholder="Type a message..."
        onKeyDown={(e) => e.key === 'Enter' && !isSending && sendMessage()}
        onChange={(e) => setText(e.target.value)}
        value={text}
        aria-label="Type a message"
        disabled={isSending}
      />
      <label htmlFor="image" className="cursor-pointer">
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="h-8 rounded-md"
          />
        ) : (
          <ImageIcon className="size-5 text-gray-500 hover:text-blue-500 transition-colors duration-200" />
        )}
        <input
          type="file"
          id="image"
          accept="image/*"
          hidden
          onChange={(e) => setImage(e.target.files[0])}
          disabled={isSending}
        />
      </label>
      <button
        onClick={sendMessage}
        className={`p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 ${
          isSending || (!text && !image) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Send message"
        disabled={isSending || (!text && !image)}
      >
        {isSending ? (
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
          </svg>
        ) : (
          <SendHorizonal size={18} />
        )}
      </button>
    </div>
  </div>
);

const GroupChat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const { user } = useAuth();
  const { groupId } = useParams();
  const messageEndRef = useRef(null);

  // Fetch group data
  const fetchGroup = async () => {
    try {
      setIsLoading(true);
      const res = await API.get(`/group/groups/groupbyid/${groupId}`, { withCredentials: true });
      setGroup(res.data.group);
    } catch (error) {
      setError('Failed to load group data.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch group messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await API.get(`/group/groups/${groupId}/messages`, { withCredentials: true });
      setMessages(res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      setError('Failed to load group messages.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send group message
  const sendMessage = async () => {
    if (!text && !image) return;
    setIsSending(true);
    const tempMessage = {
      _id: Date.now(),
      sender: { _id: user._id, fullname: user.fullname },
      group: groupId,
      text,
      message_type: image ? 'image' : 'text',
      media_url: image ? URL.createObjectURL(image) : null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText('');
    setImage(null);

    const formData = new FormData();
    formData.append('sender', user._id);
    formData.append('text', text);
    formData.append('message_type', image ? 'image' : 'text');
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await API.post(`/group/groups/${groupId}/messages`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? res.data : msg)));
    } catch (error) {
      setError('Failed to send group message.');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Leave group
  const leaveGroup = async () => {
    try {
      await API.post(`/group/groups/${groupId}/leave`, {}, { withCredentials: true });
      socket.emit('leave-group', groupId);
      // Redirect to another page (e.g., groups list) or clear group state
      window.location.href = '/groups'; // Adjust as needed
    } catch (error) {
      setError('Failed to leave group.');
      console.error(error);
    }
  };

  // Add member
  const addMember = async (email) => {
    try {
      const res = await API.post(
        `/group/add-member/${groupId}`,
        { email },
        { withCredentials: true }
      );
      setGroup(res.data.group);
      socket.emit('group-updated', { groupId, action: 'add', member: res.data.newMember });
    } catch (error) {
      throw new Error('Failed to add member.');
    }
  };

  // Kick member
  const kickMember = async (memberId) => {
    try {
      const res = await API.patch(
        `/group/groups/${groupId}/remove-member`,
        { memberId },
        { withCredentials: true }
      );
      setGroup(res.data.group);
      socket.emit('group-updated', { groupId, action: 'remove', memberId });
    } catch (error) {
      setError('Failed to remove member.');
      console.error(error);
    }
  };

  // Socket.IO handling
  useEffect(() => {
    if (user && groupId) {
      socket.connect();
      socket.emit('join-group', groupId);
      socket.on('receive-group-message', (message) => {
        if (message.group === groupId) {
          setMessages((prev) => [...prev, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        }
      });
      socket.on('group-updated', ({ groupId: updatedGroupId, action, member, memberId }) => {
        if (updatedGroupId === groupId) {
          fetchGroup(); // Refresh group data
          if (action === 'remove' && memberId === user._id) {
            window.location.href = '/groups'; // Redirect if user is kicked
          }
        }
      });
      return () => {
        socket.off('receive-group-message');
        socket.off('group-updated');
        socket.emit('leave-group', groupId);
        socket.disconnect();
      };
    }
  }, [user, groupId]);

  // Scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    fetchGroup();
    fetchMessages();
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-5 bg-gray-50 h-screen">{error}</div>;
  }

  if (!group) {
    return <div className="text-gray-500 text-center p-5 bg-gray-50 h-screen">Group not found.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <img
            src={group.photo || 'https://res.cloudinary.com/dczqoleux/image/upload/v1760852684/group_photos/default_group.png'}
            alt={group.name}
            className="w-10 h-10 rounded-full border border-gray-200"
          />
          <div>
            <p className="font-semibold text-lg text-gray-800">{group.name}</p>
            <p className="text-xs text-gray-500">{group.members.length} members</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => console.log('Group audio call started')}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            aria-label="Start group audio call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={isVideoCallActive ? endVideoCall : startVideoCall}
            className={`p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 ${
              incomingCall ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={isVideoCallActive ? 'End group video call' : 'Start group video call'}
            disabled={incomingCall}
          >
            <Video size={18} />
          </button>
          <button
            onClick={() => setShowGroupDetails(true)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            aria-label="View group details"
          >
            <Info size={18} />
          </button>
        </div>
      </motion.div>


      {/* Group Details Modal */}
      <AnimatePresence>
        {showGroupDetails && (
          <GroupDetailsModal
            group={group}
            onClose={() => setShowGroupDetails(false)}
            user={user}
            onLeaveGroup={leaveGroup}
            onAddMember={addMember}
            onKickMember={kickMember}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50" role="log" aria-live="polite">
        <MessageList messages={messages} user={user} />
        <div ref={messageEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput text={text} setText={setText} image={image} setImage={setImage} sendMessage={sendMessage} isSending={isSending} />
    </div>
  );
};

export default GroupChat;