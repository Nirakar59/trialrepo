import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export let io;
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const activeCalls = new Map(); // callId -> { initiator, participants[] }

const allowedOrigins = [
  'http://localhost:5173',
  'https://sanjal-chakra.vercel.app',
];

export const setUpSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Register user
    socket.on('register', (userId) => {
      if (!userId) {
        console.error('Register called without userId');
        return;
      }

      // Remove old socket if user reconnects
      const oldSocketId = onlineUsers.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          console.log(`Disconnecting old socket ${oldSocketId} for user ${userId}`);
          oldSocket.disconnect(true);
        }
      }

      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      userSockets.set(socket.id, userId);
      
      console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      
      // Broadcast online status
      socket.broadcast.emit('user-online', { userId });
    });

    // Get online users
    socket.on('get-online-users', () => {
      const onlineUsersList = Array.from(onlineUsers.keys());
      socket.emit('online-users', onlineUsersList);
      console.log(`📋 Sent online users list: ${onlineUsersList.length} users`);
    });

    // Join group
    socket.on('join-group', (groupId) => {
      if (!groupId) return;
      socket.join(groupId);
      console.log(`👥 Socket ${socket.id} joined group ${groupId}`);
    });

    // Leave group
    socket.on('leave-group', (groupId) => {
      if (!groupId) return;
      socket.leave(groupId);
      console.log(`👋 Socket ${socket.id} left group ${groupId}`);
    });

    // Group messages
    socket.on('send-group-message', (data) => {
      const { groupId } = data;
      if (!groupId) return;
      
      socket.to(groupId).emit('receive-group-message', data);
      console.log(`💬 Group message sent to ${groupId}`);
    });

    // ==================== VIDEO CALL HANDLERS ====================

    // Initiate call
    socket.on('user-call', ({ to, offer, groupId }) => {
      if (!socket.userId) {
        console.error('user-call: Socket not registered');
        return;
      }

      const callId = uuidv4();
      
      if (groupId) {
        // Group call
        console.log(`📞 Group call initiated by ${socket.userId} to group ${groupId}`);
        
        activeCalls.set(callId, {
          initiator: socket.userId,
          groupId,
          participants: [socket.userId],
          startTime: Date.now(),
        });

        // Emit to all members in the group except caller
        socket.to(groupId).emit('incoming-call', {
          from: socket.userId,
          offer,
          callId,
          groupId,
        });
      } else if (to) {
        // 1-on-1 call
        const receiverSocketId = onlineUsers.get(to);
        
        if (!receiverSocketId) {
          console.log(`❌ User ${to} is offline`);
          socket.emit('user-offline', { userId: to });
          return;
        }

        console.log(`📞 Call initiated from ${socket.userId} to ${to}`);
        
        activeCalls.set(callId, {
          initiator: socket.userId,
          receiver: to,
          participants: [socket.userId],
          startTime: Date.now(),
        });

        io.to(receiverSocketId).emit('incoming-call', {
          from: socket.userId,
          offer,
          callId,
        });
      }
    });

    // Accept call
    socket.on('call-accepted', ({ to, answer, callId, groupId }) => {
      if (!socket.userId) return;

      const call = activeCalls.get(callId);
      if (call && !call.participants.includes(socket.userId)) {
        call.participants.push(socket.userId);
      }

      if (groupId) {
        // For group calls, notify the specific caller
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('call-accepted', {
            answer,
            callId,
            from: socket.userId,
            groupId,
          });
          console.log(`✅ Group call accepted by ${socket.userId} for caller ${to}`);
        }
      } else {
        // For 1-on-1, notify the caller
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('call-accepted', {
            answer,
            callId,
            from: socket.userId,
          });
          console.log(`✅ Call accepted: ${socket.userId} -> ${to}`);
        }
      }
    });

    // Reject call
    socket.on('call-rejected', ({ to, callId, groupId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        activeCalls.delete(callId);
      }

      if (groupId) {
        // Notify the group
        socket.to(groupId).emit('call-rejected', { callId });
        console.log(`❌ Group call ${callId} rejected`);
      } else if (to) {
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('call-rejected', { callId });
          console.log(`❌ Call ${callId} rejected by ${socket.userId}`);
        }
      }
    });

    // ICE candidates (peer negotiation)
    socket.on('peer-negotiation-needed', ({ to, candidate, callId, groupId }) => {
      if (!candidate) return;

      if (groupId) {
        // For group calls, send to specific peer
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('peer-negotiation-needed', {
            candidate,
            callId,
            from: socket.userId,
            groupId,
          });
        }
      } else {
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('peer-negotiation-needed', {
            candidate,
            callId,
            from: socket.userId,
          });
        }
      }
    });

    // End call
    socket.on('end-call', ({ to, callId, groupId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        activeCalls.delete(callId);
        console.log(`📴 Call ${callId} ended`);
      }

      if (groupId) {
        // Notify entire group
        socket.to(groupId).emit('end-call', { callId });
        console.log(`📴 Group call ended for group ${groupId}`);
      } else if (to) {
        const receiverSocketId = onlineUsers.get(to);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('end-call', { callId });
        }
      }
    });

    // ==================== DISCONNECT HANDLER ====================

    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id}, reason: ${reason}`);
      
      const userId = userSockets.get(socket.id);
      if (userId) {
        // Only remove if this is the current socket for this user
        if (onlineUsers.get(userId) === socket.id) {
          onlineUsers.delete(userId);
          console.log(`👤 User ${userId} went offline`);
          
          // Broadcast offline status
          socket.broadcast.emit('user-offline', { userId });
        }
        userSockets.delete(socket.id);
      }

      // Clean up any active calls involving this socket
      activeCalls.forEach((call, callId) => {
        if (call.participants.includes(userId)) {
          if (call.groupId) {
            io.to(call.groupId).emit('end-call', { callId });
          } else if (call.receiver) {
            const receiverSocketId = onlineUsers.get(call.receiver);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('end-call', { callId });
            }
          }
          activeCalls.delete(callId);
        }
      });
    });
  });

  console.log('🚀 Socket.IO server initialized');
};

// Utility functions
export const emitToUser = (userId, event, payload) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  const socketId = onlineUsers.get(userId?.toString());
  if (socketId) {
    io.to(socketId).emit(event, payload);
    console.log(`📤 Emitted ${event} to user ${userId}`);
    return true;
  }
  
  console.log(`⚠️ User ${userId} not online`);
  return false;
};

export const emitToGroup = (groupId, event, payload) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  io.to(groupId).emit(event, payload);
  console.log(`📤 Emitted ${event} to group ${groupId}`);
  return true;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId?.toString());
};