import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../utils/socket';

const useWebRTC = (userId, receiverId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const peerConnectionsRef = useRef({});
  const currentCallIdRef = useRef(null);

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize local media stream
  const startLocalStream = useCallback(async () => {
    try {
      const constraints = {
        audio: true,
        video: isVideoCall ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallStatus('Failed to access camera/microphone');
      return null;
    }
  }, [isVideoCall]);

  // Create peer connection
  const createPeerConnection = useCallback((peerId, callId) => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }

    const peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0].id);
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: event.streams[0],
      }));

      // Assign to video ref
      if (remoteVideoRefs.current[peerId]?.current) {
        remoteVideoRefs.current[peerId].current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('peer-negotiation-needed', {
          to: peerId,
          candidate: event.candidate,
          callId,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('Connected');
      } else if (peerConnection.connectionState === 'failed') {
        setCallStatus('Connection failed');
      }
    };

    peerConnectionsRef.current[peerId] = peerConnection;
    return peerConnection;
  }, [localStream]);

  // Start call (initiate)
  const startCall = useCallback(async () => {
    if (!receiverId) return;

    setCallStatus('Calling...');
    const stream = await startLocalStream();
    if (!stream) return;

    setIsCallActive(true);

    const peerConnection = createPeerConnection(receiverId, null);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('user-call', {
      to: receiverId,
      offer: peerConnection.localDescription,
    });
  }, [receiverId, startLocalStream, createPeerConnection]);

  // Accept call
  const acceptCall = useCallback(async (call) => {
    setCallStatus('Accepting call...');
    currentCallIdRef.current = call.callId;

    const stream = await startLocalStream();
    if (!stream) return;

    setIsCallActive(true);
    setIncomingCall(null);

    const peerConnection = createPeerConnection(call.from, call.callId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('call-accepted', {
      to: call.from,
      answer: peerConnection.localDescription,
      callId: call.callId,
    });

    setCallStatus('Connected');
  }, [startLocalStream, createPeerConnection]);

  // Reject call
  const rejectCall = useCallback((callId) => {
    socket.emit('call-rejected', {
      to: incomingCall?.from,
      callId,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    // Clear remote streams
    setRemoteStreams({});

    // Emit end call event
    socket.emit('end-call', {
      to: receiverId,
      callId: currentCallIdRef.current,
    });

    setLocalStream(null);
    setIsCallActive(false);
    setCallStatus('');
    currentCallIdRef.current = null;
  }, [localStream, receiverId]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle fullscreen
  const toggleFullScreen = useCallback(() => {
    const container = document.getElementById('video-call-container');
    if (!container) return;

    if (!isFullScreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  // Socket event listeners
  useEffect(() => {
    if (!userId) return;

    // Incoming call
    socket.on('incoming-call', (data) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
      setCallStatus('Incoming call...');
    });

    // Call accepted
    socket.on('call-accepted', async (data) => {
      console.log('Call accepted:', data);
      currentCallIdRef.current = data.callId;
      setCallStatus('Connected');

      const peerConnection = peerConnectionsRef.current[data.from];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Call rejected
    socket.on('call-rejected', () => {
      console.log('Call rejected');
      setCallStatus('Call rejected');
      endCall();
    });

    // ICE candidate
    socket.on('peer-negotiation-needed', async (data) => {
      const peerConnection = peerConnectionsRef.current[data.from];
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Call ended
    socket.on('end-call', () => {
      console.log('Call ended by peer');
      endCall();
    });

    // User offline
    socket.on('user-offline', () => {
      setCallStatus('User is offline');
      endCall();
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('peer-negotiation-needed');
      socket.off('end-call');
      socket.off('user-offline');
    };
  }, [userId, endCall]);

  // Initialize remote video refs
  useEffect(() => {
    Object.keys(remoteStreams).forEach((peerId) => {
      if (!remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId] = { current: null };
      }
    });
  }, [remoteStreams]);

  // Assign local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return {
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
  };
};

export default useWebRTC;