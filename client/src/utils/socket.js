import { io } from 'socket.io-client';

const SOCKET_URL ='http://localhost:5000';

// Create a single socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection state management
let isConnected = false;
let currentUserId = null;
let reconnectAttempts = 0;

// Connection management
export const connectSocket = (userId) => {
  // Prevent duplicate connections for the same user
  if (isConnected && currentUserId === userId) {
    console.log('✅ Socket already connected for user:', userId);
    return;
  }

  // If switching users, disconnect first
  if (isConnected && currentUserId !== userId) {
    console.log('🔄 Switching users, disconnecting old connection...');
    disconnectSocket();
  }

  try {
    socket.connect();
    socket.emit('register', userId);
    isConnected = true;
    currentUserId = userId;
    reconnectAttempts = 0;
    console.log('✅ Socket connected for user:', userId);
  } catch (error) {
    console.error('❌ Socket connection error:', error);
    isConnected = false;
  }
};

export const disconnectSocket = () => {
  if (isConnected) {
    socket.disconnect();
    isConnected = false;
    currentUserId = null;
    console.log('🔌 Socket disconnected');
  }
};

// Get connection status
export const getSocketStatus = () => ({
  isConnected,
  currentUserId,
  socketId: socket.id,
  connected: socket.connected,
});

// Setup event listeners for connection monitoring
socket.on('connect', () => {
  console.log('🟢 Socket.IO connected:', socket.id);
  isConnected = true;
  
  // Re-register user on reconnect
  if (currentUserId) {
    console.log('🔄 Re-registering user:', currentUserId);
    socket.emit('register', currentUserId);
  }
});

socket.on('disconnect', (reason) => {
  console.log('🔴 Socket.IO disconnected:', reason);
  isConnected = false;
  
  // Auto-reconnect on unexpected disconnect
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    if (currentUserId && reconnectAttempts < 3) {
      reconnectAttempts++;
      console.log(`🔄 Attempting reconnect (${reconnectAttempts}/3)...`);
      setTimeout(() => connectSocket(currentUserId), 2000);
    }
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message);
  isConnected = false;
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  reconnectAttempts = 0;
});

socket.on('reconnect_failed', () => {
  console.error('❌ Socket reconnection failed after all attempts');
  isConnected = false;
});

// Debug helper (only in development)
if (process.env.NODE_ENV === 'development') {
  window.socket = socket;
  window.getSocketStatus = getSocketStatus;
  window.connectSocket = connectSocket;
  window.disconnectSocket = disconnectSocket;
}

export default socket;