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
  const [peerStreams, setPeerStreams] = useState<{ [id: string]: MediaStream }>(
    {},
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null); // Not used
  const [isMute, setIsMute] = useState<boolean>(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const peerAudioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setStream(stream);
        if (!localAudioRef.current) return;
        localAudioRef.current.srcObject = stream;
      })
      .catch((err) => console.error('Error accessing microphone', err));
  }, []);

  // Socket
  const socket = useSocket();

  const handleSendRTCOffer = async (to: string) => {
    console.log('WebRTC: send offer to', to);

    // Create offer
    const offer = await peerConnections.current[to].createOffer();
    await peerConnections.current[to].setLocalDescription(offer);

    // Send offer
    socket?.send.RTCOffer({
      to: to,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });
  };
  const handleSendRTCAnswer = async (to: string) => {
    console.log('WebRTC: send answer to', to);

    // Create answer
    const answer = await peerConnections.current[to].createAnswer();
    await peerConnections.current[to].setLocalDescription(answer);

    // Send answer
    socket?.send.RTCAnswer({
      to: to,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });
  };
  const handleSendRTCIceCandidate = async (
    to: string,
    candidate: RTCIceCandidate,
  ) => {
    console.log('WebRTC: send ICE candidate to', to);

    // Send candidate
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
  const handleChannelConnect = (channel: Channel) => {
    setChannelId(channel.id);
  };
  const handleChannelDisconnect = () => {
    setChannelId(null);
  };
  const handleRTCJoin = (rtcConnection: string) => {
    createPeerConnection(rtcConnection);
    handleSendRTCOffer(rtcConnection);
  };
  const handleRTCLeave = (rtcConnection: string) => {
    removePeerConnection(rtcConnection);
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

      handleSendRTCAnswer(from);
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

  const createPeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: create peer connection, target user:', rtcConnection);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate)
        handleSendRTCIceCandidate(rtcConnection, event.candidate);
    };

    peer.oniceconnectionstatechange = () => {
      console.log(
        'WebRTC: ICE connection state changed:',
        peer.iceConnectionState,
      );
    };

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      console.log('WebRTC: receive remote audio track');
      if (!peerAudioRefs.current[rtcConnection]) {
        peerAudioRefs.current[rtcConnection] = document.createElement('audio');
        peerAudioRefs.current[rtcConnection].autoplay = true;
      }
      peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
      setPeerStreams((prev) => ({
        ...prev,
        [rtcConnection]: event.streams[0],
      }));
    };

    peerConnections.current[rtcConnection] = peer;
  };

  const removePeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: remove peer connection, target user:', rtcConnection);
    if (!peerConnections.current[rtcConnection]) return;
    peerConnections.current[rtcConnection].close();
    delete peerConnections.current[rtcConnection];
    setPeerStreams((prev) => {
      delete prev[rtcConnection];
      return prev;
    });
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
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMute;
      });
      setIsMute(!isMute);
    }
  };

  return (
    <WebRTCContext.Provider value={{ toggleMute, isMute }}>
      {Object.keys(peerStreams).map((rtcConnection) => (
        <audio
          key={rtcConnection}
          ref={(el) => {
            if (el) el.srcObject = peerStreams[rtcConnection];
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
