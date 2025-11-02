import { useEffect, useState, useRef } from 'react';
import { ImageIcon, SendHorizonal, Phone, Video, Mic, MicOff, VideoOff, Maximize2, Minimize2, X, RefreshCw } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useParams } from 'react-router-dom';
import API from '../api/api';
import { socket } from '../utils/socket';
import useWebRTC from '../hooks/useWebRTC';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

// Incoming Call Modal Component
const IncomingCallModal = ({ caller, onAccept, onReject }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.8, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
    >
      <div className="text-center">
        <div className="mb-6">
          <img
            src={caller.profilePics || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'}
            alt={caller.fullname}
            className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-blue-500 shadow-lg"
          />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {caller.fullname}
          </h3>
          <p className="text-gray-600">Incoming video call...</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="flex-1 bg-red-500 text-white py-3 px-6 rounded-full hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-green-500 text-white py-3 px-6 rounded-full hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// Message List Component
const MessageList = ({ messages, user }) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message._id || index}
            className={`flex flex-col ${message.sender === user._id ? 'items-end' : 'items-start'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`p-3 text-sm max-w-sm rounded-lg shadow-md ${
                message.sender === user._id ? 'bg-blue-100 text-slate-700 rounded-br-none' : 'bg-indigo-100 text-slate-700 rounded-bl-none'
              }`}
            >
              {message.message_type === 'image' && (
                <img src={message.media_url} className="w-full max-w-sm rounded-lg mb-2" alt="Message media" />
              )}
              <p>{message.text}</p>
              <span className="text-xs text-gray-400 mt-1 block">
                {moment(message.createdAt).fromNow()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Chat Input Component
const ChatInput = ({ text, setText, image, setImage, sendMessage }) => (
  <div className="px-4 mb-5">
    <div className="flex items-center gap-3 p-2 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full">
      <input
        type="text"
        className="flex-1 outline-none text-slate-700"
        placeholder="Type a message..."
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        onChange={(e) => setText(e.target.value)}
        value={text}
        aria-label="Type a message"
      />
      <label htmlFor="image" className="cursor-pointer">
        {image ? (
          <img src={URL.createObjectURL(image)} alt="Preview" className="h-8 rounded" />
        ) : (
          <ImageIcon className="size-7 text-gray-400" />
        )}
        <input
          type="file"
          id="image"
          accept="image/*"
          hidden
          onChange={(e) => setImage(e.target.files[0])}
        />
      </label>
      <button
        onClick={sendMessage}
        className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 text-white p-2 rounded-full"
        aria-label="Send message"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  </div>
);

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { userId } = useParams();
  const messageEndRef = useRef(null);

  // WebRTC hook
  const {
    localStream,
    remoteStreams,
    isCallActive,
    incomingCall,
    callStatus,
    isMicOn,
    isCameraOn,
    isFullScreen,
    localVideoRef,
    remoteVideoRefs,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleFullScreen,
  } = useWebRTC(user?._id, userId);

  // Fetch receiver data
  const fetchReceiver = async () => {
    try {
      setIsLoading(true);
      const { data } = await API.get(`/users/${userId}`, { withCredentials: true });
      setReceiver(data.user);
    } catch (error) {
      setError('Failed to load user data.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data } = await API.get(`/message/${userId}`, { withCredentials: true });
      setMessages(data.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      setError('Failed to load messages.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message with optimistic update
  const sendMessage = async () => {
    if (!text && !image) return;
    const tempMessage = {
      _id: Date.now(),
      sender: user._id,
      receiver: userId,
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
      const { data } = await API.post(`/message/send/${userId}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? data.data : msg)));
    } catch (error) {
      setError('Failed to send message.');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      console.error(error);
    }
  };

  // Socket.IO message handling
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('register', user._id);
      socket.on('receive-message', (message) => {
        if (
          (message.sender === user._id && message.receiver === userId) ||
          (message.sender === userId && message.receiver === user._id)
        ) {
          setMessages((prev) => [...prev, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        }
      });
      return () => {
        socket.off('receive-message');
        socket.disconnect();
      };
    }
  }, [user, userId]);

  // Scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    fetchReceiver();
    fetchMessages();
  }, [userId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-5">{error}</div>;
  }

  if (!receiver) {
    return <div className="text-gray-500 text-center p-5">User not found.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 md:px-10 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 shadow-sm">
        <img
          src={receiver.profilePics || 'https://via.placeholder.com/32'}
          alt={receiver.fullname}
          className="size-10 rounded-full"
        />
        <div className="flex-1">
          <p className="font-semibold text-lg">{receiver.fullname}</p>
          <p className="text-sm text-gray-500">@{receiver.fullname}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => console.log('Audio call started')}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
            aria-label="Start audio call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={isCallActive ? endCall : startCall}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
            aria-label={isCallActive ? 'End video call' : 'Start video call'}
            disabled={!!incomingCall}
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Call Status */}
      <AnimatePresence>
        {callStatus && (
          <motion.div
            className="p-2 text-center text-sm text-gray-600 bg-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {callStatus}
            {callStatus.includes('Failed') && (
              <button
                onClick={startCall}
                className="ml-2 p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                aria-label="Retry call"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallModal
            caller={receiver}
            onAccept={() => acceptCall(incomingCall)}
            onReject={() => rejectCall(incomingCall.callId)}
          />
        )}
      </AnimatePresence>

      {/* Video Call UI */}
      <AnimatePresence>
        {isCallActive && localStream && (
          <motion.div
            id="video-call-container"
            className={`p-5 flex flex-col md:flex-row gap-4 justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg ${
              isFullScreen ? 'fixed inset-0 z-50' : 'relative z-10'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Local Video */}
            <div className="relative">
              <h3 className="text-sm font-medium mb-2 text-white">You</h3>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full md:w-64 rounded-lg shadow-lg border-2 border-blue-500"
              />
              {!isCameraOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
                  <VideoOff className="text-white" size={32} />
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([remoteUserId, stream]) => (
              <div key={remoteUserId} className="relative">
                <h3 className="text-sm font-medium mb-2 text-white">
                  {receiver.fullname}
                </h3>
                <video
                  ref={(el) => {
                    if (el && !remoteVideoRefs.current[remoteUserId]) {
                      remoteVideoRefs.current[remoteUserId] = { current: el };
                    }
                    if (el && stream) {
                      el.srcObject = stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full md:w-64 rounded-lg shadow-lg border-2 border-green-500"
                />
              </div>
            ))}

            {/* Call Controls */}
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-3 bg-gray-800/80 backdrop-blur-md px-6 py-3 rounded-full">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full ${isMicOn ? 'bg-gray-700' : 'bg-red-500'} text-white hover:opacity-80 transition`}
                aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full ${isCameraOn ? 'bg-gray-700' : 'bg-red-500'} text-white hover:opacity-80 transition`}
                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                onClick={toggleFullScreen}
                className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
                aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
              >
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={endCall}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                aria-label="End call"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 p-5 md:px-10 overflow-y-auto">
        <MessageList messages={messages} user={user} />
        <div ref={messageEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput text={text} setText={setText} image={image} setImage={setImage} sendMessage={sendMessage} />
    </div>
  );
};

export default ChatBox;