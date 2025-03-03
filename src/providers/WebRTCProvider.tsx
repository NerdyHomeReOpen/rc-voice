import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
} from 'react';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { Channel } from '@/types';

interface WebRTCContextType {
  joinVoiceChannel?: (channelId: string) => void;
  leaveVoiceChannel?: () => void;
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
  // Socket
  const socket = useSocket();

  // RTC State
  const [peers, setPeers] = useState<{ [id: string]: MediaStream }>({});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
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

    socket?.on.channelConnect(async (channel: Channel) => {
      setChannelId(channel.id);
    });

    socket?.on.channelDisconnect(async () => {
      setChannelId(null);
    });

    socket?.on.RTCConnect(async (rtcConnections: string[]) => {
      console.log('rtcConnections: ', rtcConnections);
      for (const rtcConnection of rtcConnections) {
        await createPeerConnection(rtcConnection);
      }
    });

    socket?.on.RTCJoin(async (rtcConnection: string) => {
      await createPeerConnection(rtcConnection);
    });

    socket?.on.RTCLeave(async (rtcConnection: string) => {
      await removePeerConnection(rtcConnection);
    });

    interface RTCOfferProps {
      from: string;
      offer: RTCSessionDescriptionInit;
    }
    socket?.on.RTCOffer(async ({ from, offer }: RTCOfferProps) => {
      console.log('offer: ', offer);
      if (!peerConnections.current[from]) await createPeerConnection(from);
      await peerConnections.current[from].setRemoteDescription(offer);
      const answer = await peerConnections.current[from].createAnswer();
      await peerConnections.current[from].setLocalDescription(answer);
      socket.send.RTCAnswer({ to: from, answer });
      // await peer.setRemoteDescription(new RTCSessionDescription(offer));
      // const answer = await peer.createAnswer();
      // await peer.setLocalDescription(answer);
      // socket.sendRTCAnswer(channelId, answer);
      // socket.current.emit('answer', { roomId: room, answer });
    });

    interface RTCAnswerProps {
      from: string;
      answer: RTCSessionDescriptionInit;
    }
    socket?.on.RTCAnswer(async ({ from, answer }: RTCAnswerProps) => {
      await peerConnections.current[from].setRemoteDescription(answer);
    });

    interface RTCIceCandidateProps {
      from: string;
      candidate: RTCIceCandidateInit;
    }
    socket?.on.RTCIceCandidate(
      async ({ from, candidate }: RTCIceCandidateProps) => {
        peerConnections.current[from]?.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      },
    );
  }, [socket]);

  const createPeerConnection = async (rtcConnection: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.send.RTCIceCandidate({
          to: rtcConnection,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
      setPeers((prev) => ({ ...prev, [rtcConnection]: event.streams[0] }));
    };

    peerConnections.current[rtcConnection] = peer;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket?.send.RTCOffer({ to: rtcConnection, offer });
  };

  const removePeerConnection = async (rtcConnection: string) => {
    peerConnections.current[rtcConnection]?.close();
    delete peerConnections.current[rtcConnection];
    setPeers((prev) => {
      const newPeers = { ...prev };
      delete newPeers[rtcConnection];
      return newPeers;
    });
  };

  return (
    <WebRTCContext.Provider value={{}}>
      <audio ref={localAudioRef} autoPlay controls />
      {Object.keys(peers).map((userId) => (
        <div key={userId}>
          <h3>使用者 {userId} 的音訊</h3>
          <audio
            ref={(el) => {
              if (el) el.srcObject = peers[userId];
            }}
            autoPlay
            controls
          />
        </div>
      ))}
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
