import { useEffect, useState, useRef } from 'react';
import { ImageIcon, SendHorizonal, Phone, Video, Mic, MicOff, VideoOff, Maximize2, Minimize2, X, RefreshCw } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useLocation, useParams } from 'react-router-dom';
import API from '../api/api';
import { socket } from '../utils/socket';
import useWebRTC from '../hooks/useWebRTC';
import { motion, AnimatePresence } from 'framer-motion';
import React, { Component } from 'react';

// ErrorBoundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-center p-5">
          Something went wrong with the video call. Please try again.
        </div>
      );
    }
    return this.props.children;
  }
}

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
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

//REmoved Incoming Call Modal Component

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
        <div>
          <p className="font-semibold text-lg">{receiver.fullname}</p>
          <p className="text-sm text-gray-500">@{receiver.fullname}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => console.log('Audio call started')}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
              aria-label="Start audio call"
            >
              <Phone size={20} />
            </button>
            <button
              onClick={isVideoCallActive ? endVideoCall : startVideoCall}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
              aria-label={isVideoCallActive ? 'End video call' : 'Start video call'}
              disabled={incomingCall}
            >
              <Video size={20} />
            </button>
          </div>
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
                onClick={startVideoCall}
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
            callId={incomingCall.callId}
          />
        )}
      </AnimatePresence>

      {/* Local Video Element (Always Mounted) */}
      <video
  ref={localVideoRef}
  autoPlay
  muted
  playsInline
  className={isVideoCallActive ? "w-full md:w-64 rounded-lg shadow" : "hidden"}
  onLoadedMetadata={() => {
    console.log('Local video metadata loaded');
    localVideoRef.current?.play().catch(e => console.error('Local play error:', e));
  }}
/>


      {/* Video Call UI */}
      <AnimatePresence>
        {isVideoCallActive && localStream && (
          <ErrorBoundary>
            <motion.div
              id="video-call-container"
              className={`p-5 flex flex-col md:flex-row gap-4 justify-center bg-gray-100 rounded-lg shadow-lg ${
                isFullScreen ? 'fixed inset-0 z-50' : 'relative z-10'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onAnimationStart={() => console.log('Video call container rendered')}
            >
              <div className="relative">
                <h3 className="text-sm font-medium mb-2">You</h3>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full md:w-64 rounded-lg shadow"
                  onError={(e) => console.error('Local video error:', e)}
                  onCanPlay={() => console.log('Local video can play')}
                />
                {!localStream && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
                    <span className="text-white">No local video</span>
                  </div>
                )}
                {localStream && localStream.getVideoTracks().length === 0 && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
                    <VideoOff className="text-white" size={32} />
                  </div>
                )}
              </div>
              {Object.entries(remoteStreams).map(([remoteUserId, stream]) => (
  <div key={remoteUserId} className="relative">
    <h3 className="text-sm font-medium mb-2 text-white">
      {remoteUserId.substring(0, 8)}...
    </h3>
    <video
      ref={(el) => {
        if (el && remoteVideoRefs.current[remoteUserId]) {
          remoteVideoRefs.current[remoteUserId].current = el;
          if (stream && el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch(e => console.error('Remote play error:', e));
          }
        }
      }}
      autoPlay
      playsInline
      className="w-full md:w-64 rounded-lg shadow"
      onLoadedMetadata={(e) => {
        console.log(`Remote video metadata loaded for ${remoteUserId}`);
        e.target.play().catch(err => console.error('Play error:', err));
      }}
    />
    {(!stream || stream.getTracks().length === 0) && (
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded-lg">
        <span className="text-white text-sm">Connecting...</span>
      </div>
    )}
  </div>
))}
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={toggleMic}
                  className={`p-2 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-80 transition`}
                  aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded-full ${isCameraOn ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-80 transition`}
                  aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button
                  onClick={toggleFullScreen}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                  aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
                >
                  {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  onClick={endVideoCall}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                  aria-label="End call"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          </ErrorBoundary>
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