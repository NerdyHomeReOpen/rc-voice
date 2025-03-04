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

    socket?.on.channelConnect(async (channel: Channel) => {
      setChannelId(channel.id);
    });

    socket?.on.channelDisconnect(async () => {
      setChannelId(null);
    });

    socket?.on.RTCConnect(async (rtcConnections: string[]) => {
      // for (const rtcConnection of rtcConnections) {
      //   await createPeerConnection(rtcConnection);
      // }
    });

    socket?.on.RTCJoin(async (rtcConnection: string) => {
      await createPeerConnection(rtcConnection);
      try {
        // Create offer
        const offer = await peerConnections.current[
          rtcConnection
        ].createOffer();
        await peerConnections.current[rtcConnection].setLocalDescription(offer);

        // Send offer
        socket?.send.RTCOffer({
          to: rtcConnection,
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
        });

        console.log('WebRTC: send offer to', rtcConnection);
      } catch (error) {
        console.error('WebRTC: create or send Offer error:', error);
      }
    });

    socket?.on.RTCLeave(async (rtcConnection: string) => {
      await removePeerConnection(rtcConnection);
    });

    interface RTCOfferProps {
      from: string;
      offer: {
        type: RTCSdpType;
        sdp: string;
      };
    }
    socket?.on.RTCOffer(async ({ from, offer }: RTCOfferProps) => {
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
        socket.send.RTCAnswer({
          to: from,
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        });

        console.log('WebRTC: send answer to', from);
      } catch (error) {
        console.error('WebRTC: handle Offer error:', error);
      }
    });

    interface RTCAnswerProps {
      from: string;
      answer: {
        type: RTCSdpType;
        sdp: string;
      };
    }
    socket?.on.RTCAnswer(async ({ from, answer }: RTCAnswerProps) => {
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
    });

    interface RTCIceCandidateProps {
      from: string;
      candidate: {
        candidate: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
        usernameFragment: string | null;
      };
    }
    socket?.on.RTCIceCandidate(
      async ({ from, candidate }: RTCIceCandidateProps) => {
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
      },
    );
  }, [socket]);

  const createPeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: create peer connection, target user:', rtcConnection);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate
        socket?.send.RTCIceCandidate({
          to: rtcConnection,
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment,
          },
        });

        console.log('WebRTC: send ICE candidate to', rtcConnection);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log(
        'WebRTC: ICE connection state changed:',
        peer.iceConnectionState,
      );
    };

    peer.ontrack = (event) => {
      console.log('WebRTC: receive remote audio track');
      if (!peerAudioRefs.current[rtcConnection]) {
        peerAudioRefs.current[rtcConnection] = document.createElement('audio');
        peerAudioRefs.current[rtcConnection].autoplay = true;
      }
      peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
      setPeers((prev) => ({ ...prev, [rtcConnection]: event.streams[0] }));
    };

    peerConnections.current[rtcConnection] = peer;
  };

  const removePeerConnection = async (rtcConnection: string) => {
    console.log('WebRTC: remove peer connection, target user:', rtcConnection);
    peerConnections.current[rtcConnection].close();
    delete peerConnections.current[rtcConnection];
    setPeers((prev) => {
      const newPeers = { ...prev };
      delete newPeers[rtcConnection];
      return newPeers;
    });
  };

  const joinVoiceChannel = (channelId: string) => {
    socket?.send.connectChannel({ channelId });
  };

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
    <WebRTCContext.Provider
      value={{ joinVoiceChannel, leaveVoiceChannel, toggleMute, isMute }}
    >
      {Object.keys(peers).map((userId) => (
        <audio
          key={userId}
          ref={(el) => {
            if (el) el.srcObject = peers[userId];
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
