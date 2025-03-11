/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
} from 'react';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { Channel, SocketServerEvent } from '@/types';

interface RTCOfferProps {
  from: string;
  offer: {
    type: RTCSdpType;
    sdp: string;
  };
}
interface RTCAnswerProps {
  from: string;
  answer: {
    type: RTCSdpType;
    sdp: string;
  };
}
interface RTCIceCandidateProps {
  from: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment: string | null;
  };
}

interface WebRTCContextType {
  // joinVoiceChannel?: (channelId: string) => void;
  // leaveVoiceChannel?: () => void;
  toggleMute?: () => void;
  isMute?: boolean;
}

const WebRTCContext = createContext<WebRTCContextType>({});

export const useWebRTC = () => {
  return useContext(WebRTCContext);
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  // RTC State
  const peerStreams = useRef<{ [id: string]: MediaStream }>({});
  const localStream = useRef<MediaStream | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null); // Not used
  const [isMute, setIsMute] = useState<boolean>(false);
  const peerAudioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});

  // Socket
  const socket = useSocket();

  const handleChannelConnect = (channel: Channel) => {
    setChannelId(channel.id);
  };
  const handleChannelDisconnect = () => {
    setChannelId(null);
  };
  const handleRTCJoin = async (rtcConnection: string) => {
    console.log('WebRTC: handle join:', rtcConnection);
    try {
      if (peerConnections.current[rtcConnection])
        removePeerConnection(rtcConnection);
      // Create peer connection
      await createPeerConnection(rtcConnection);
      // Create offer
      const offer = await peerConnections.current[rtcConnection].createOffer();
      await peerConnections.current[rtcConnection].setLocalDescription(offer);
      // Send offer
      handleSendRTCOffer(rtcConnection, offer);
    } catch (error) {
      console.error('WebRTC: handle join error:', error);
    }
  };
  const handleRTCLeave = async (rtcConnection: string) => {
    console.log('WebRTC: handle leave:', rtcConnection);
    try {
      if (!peerConnections.current[rtcConnection]) return;
      // Remove peer connection
      await removePeerConnection(rtcConnection);
    } catch (error) {
      console.error('WebRTC: handle leave error:', error);
    }
  };
  const handleRTCOffer = async ({ from, offer }: RTCOfferProps) => {
    console.log('WebRTC: receive offer from', from);
    try {
      if (!peerConnections.current[from]) await createPeerConnection(from);
      // Receive offer
      const offerDes = new RTCSessionDescription({
        type: offer.type,
        sdp: offer.sdp,
      });
      await peerConnections.current[from].setRemoteDescription(offerDes);
      // Create answer
      const answer = await peerConnections.current[from].createAnswer();
      await peerConnections.current[from].setLocalDescription(answer);
      // Send answer
      handleSendRTCAnswer(from, answer);
    } catch (error) {
      console.error('WebRTC: handle Offer error:', error);
    }
  };
  const handleRTCAnswer = async ({ from, answer }: RTCAnswerProps) => {
    console.log('WebRTC: receive answer from', from);
    try {
      if (!peerConnections.current[from]) return;
      // Receive answer
      const answerDes = new RTCSessionDescription({
        type: answer.type,
        sdp: answer.sdp,
      });
      await peerConnections.current[from].setRemoteDescription(answerDes);
    } catch (error) {
      console.error('WebRTC: handle Answer error:', error);
    }
  };
  const handleRTCIceCandidate = async ({
    from,
    candidate,
  }: RTCIceCandidateProps) => {
    console.log('WebRTC: receive ICE candidate from', from);
    try {
      if (!peerConnections.current[from]) return;
      // Receive ICE candidate
      const iceCandidate = new RTCIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      });
      await peerConnections.current[from].addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('WebRTC: add ICE Candidate failed:', error);
    }
  };
  const handleSendRTCOffer = (to: string, offer: RTCSessionDescriptionInit) => {
    console.log('WebRTC: send offer to', to);
    socket?.send.RTCOffer({
      to: to,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });
  };
  const handleSendRTCAnswer = (
    to: string,
    answer: RTCSessionDescriptionInit,
  ) => {
    console.log('WebRTC: send answer to', to);
    socket?.send.RTCAnswer({
      to: to,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });
  };
  const handleSendRTCIceCandidate = (
    to: string,
    candidate: RTCIceCandidate,
  ) => {
    console.log('WebRTC: send ICE candidate to', to);
    socket?.send.RTCIceCandidate({
      to: to,
      candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      },
    });
  };

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.CHANNEL_CONNECT]: handleChannelConnect,
      [SocketServerEvent.CHANNEL_DISCONNECT]: handleChannelDisconnect,
      [SocketServerEvent.RTC_JOIN]: handleRTCJoin,
      [SocketServerEvent.RTC_LEAVE]: handleRTCLeave,
      [SocketServerEvent.RTC_OFFER]: handleRTCOffer,
      [SocketServerEvent.RTC_ANSWER]: handleRTCAnswer,
      [SocketServerEvent.RTC_ICE_CANDIDATE]: handleRTCIceCandidate,
    };

    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStream.current = stream;
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            console.log('WebRTC: local audio track ended');
          };
          track.enabled = !isMute;
          Object.values(peerConnections.current).forEach((peerConnection) => {
            peerConnection.addTrack(track, stream);
          });
        });
      })
      .catch((err) => console.error('Error accessing microphone', err));

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
    };
  }, []);

  const createPeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: create peer connection, target user:', rtcConnection);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
    });
    peerConnection.onicecandidate = (event) => {
      if (event.candidate)
        handleSendRTCIceCandidate(rtcConnection, event.candidate);
    };
    peerConnection.onicegatheringstatechange = () => {
      console.log(
        'WebRTC: ICE gathering state:',
        peerConnection.iceGatheringState,
      );
    };
    peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC: Connection state:', peerConnection.connectionState);
    };
    peerConnection.onsignalingstatechange = () => {
      console.log('WebRTC: Signaling state:', peerConnection.signalingState);
    };
    peerConnection.ontrack = (event) => {
      console.log('WebRTC: receive remote audio track');
      if (!peerAudioRefs.current[rtcConnection]) {
        peerAudioRefs.current[rtcConnection] = document.createElement('audio');
        peerAudioRefs.current[rtcConnection].autoplay = true;
      }
      peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
      peerStreams.current[rtcConnection] = event.streams[0];
    };
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream.current!);
      });
    }

    peerConnections.current[rtcConnection] = peerConnection;
  };

  const removePeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: remove peer connection, target user:', rtcConnection);
    peerConnections.current[rtcConnection].close();
    delete peerConnections.current[rtcConnection];
    delete peerAudioRefs.current[rtcConnection];
  };

  // Not used
  const joinVoiceChannel = (channelId: string) => {
    socket?.send.connectChannel({ channelId });
  };

  // Not used
  const leaveVoiceChannel = () => {
    if (channelId) {
      socket?.send.disconnectChannel({ channelId });
    }
  };

  const toggleMute = () => {
    console.log('WebRTC: toggle mute, current state:', isMute);
    if (!localStream.current) return;
    const audioTracks = localStream.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = isMute;
    });
    setIsMute(!isMute);
  };

  return (
    <WebRTCContext.Provider value={{ toggleMute, isMute }}>
      {Object.keys(peerStreams).map((rtcConnection) => (
        <audio
          key={rtcConnection}
          ref={(el) => {
            if (el) el.srcObject = peerStreams.current[rtcConnection];
          }}
          autoPlay
          controls
          style={{ display: 'none' }}
        />
      ))}
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
