/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
  useCallback,
} from 'react';

// Providers
import { useSocket } from '@/providers/Socket';

// Types
import { SocketServerEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

type Offer = {
  from: string;
  offer: {
    type: RTCSdpType;
    sdp: string;
  };
};

type Answer = {
  from: string;
  answer: {
    type: RTCSdpType;
    sdp: string;
  };
};

type IceCandidate = {
  from: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment: string | null;
  };
};

interface WebRTCContextType {
  toggleMute?: () => void;
  updateBitrate?: (newBitrate: number) => void;
  updateMicVolume?: (volume: number) => void;
  updateSpeakerVolume?: (volume: number) => void;
  isMute?: boolean;
  bitrate?: number;
  micVolume?: number;
  speakerVolume?: number;
}

const WebRTCContext = createContext<WebRTCContextType>({});

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context)
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  // States
  const [isMute, setIsMute] = useState<boolean>(false);
  const [bitrate, setBitrate] = useState<number>(128000);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);

  // Refs
  const mutedVolume = useRef<number>(0);
  const localStream = useRef<MediaStream | null>(null);
  const peerStreams = useRef<{ [id: string]: MediaStream }>({});
  const peerAudioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const sourceNode = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationNode = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Hooks
  const socket = useSocket();

  // Handlers
  const toggleMute = () => {
    try {
      if (isMute) {
        updateMicVolume(mutedVolume.current);
      } else {
        mutedVolume.current = micVolume;
        updateMicVolume(0);
      }
      setIsMute(!isMute);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const updateBitrate = (newBitrate: number) => {
    try {
      if (newBitrate === bitrate) {
        console.log(`Bitrate already set to ${newBitrate}, skipping...`);
        return;
      }

      Object.values(peerConnections.current).forEach(async (connection) => {
        const senders = connection.getSenders();
        for (const sender of senders) {
          const parameters = sender.getParameters();
          if (!parameters.encodings) {
            parameters.encodings = [{}];
          }
          parameters.encodings[0].maxBitrate = newBitrate;
          await sender.setParameters(parameters);
        }
      });
      setBitrate(newBitrate);
    } catch (error) {
      console.error('Error updating bitrate:', error);
    }
  };

  const updateMicVolume = useCallback(
    (volume: number | null) => {
      try {
        if (!audioContext.current) {
          console.log('No audio context');
          return;
        }
        if (!gainNode.current) {
          console.log('No gain node');
          return;
        }
        if (!sourceNode.current) {
          console.log('No source node');
          return;
        }
        if (!destinationNode.current) {
          console.log('No destination node');
          return;
        }
        if (destinationNode.current.stream.getAudioTracks().length === 0) {
          console.log('No audio tracks');
          return;
        }

        // Set gain value
        const newVolume = volume !== null ? volume : micVolume;
        gainNode.current.gain.value = newVolume / 100;

        // Process audio tracks
        const processedTrack =
          destinationNode.current.stream.getAudioTracks()[0];
        Object.values(peerConnections.current).forEach((connection) => {
          const senders = connection.getSenders();
          const audioSender = senders.find((s) => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender
              .replaceTrack(null)
              .then(() =>
                audioSender
                  .replaceTrack(processedTrack)
                  .catch((error) =>
                    console.error('Error replacing audio track:', error),
                  ),
              )
              .catch((error) =>
                console.error('Error removing audio track:', error),
              );
          }
        });
        setMicVolume(newVolume);
      } catch (error) {
        console.error('Error updating microphone volume:', error);
      }
    },
    [micVolume],
  );

  const updateSpeakerVolume = useCallback(
    (volume: number | null) => {
      try {
        // Set volume
        const newVolume = volume !== null ? volume : speakerVolume;
        Object.values(peerAudioRefs.current).forEach((audio) => {
          audio.volume = newVolume / 100;
        });
        setSpeakerVolume(newVolume);
      } catch (error) {
        console.error('Error updating speaker volume:', error);
      }
    },
    [speakerVolume],
  );

  const updateInputStream = useCallback(
    (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        })
        .then((stream) => {
          localStream.current = stream;
          audioContext.current = new AudioContext();
          sourceNode.current =
            audioContext.current.createMediaStreamSource(stream);
          gainNode.current = audioContext.current.createGain();
          destinationNode.current =
            audioContext.current.createMediaStreamDestination();
          sourceNode.current.connect(gainNode.current);
          gainNode.current.connect(destinationNode.current);
        })
        .catch((err) => console.error('Error accessing microphone', err));
      updateMicVolume(null);
    },
    [updateMicVolume],
  );

  const updateOutputStream = useCallback(
    async (deviceId: string) => {
      Object.values(peerAudioRefs.current).forEach((audio) =>
        audio
          .setSinkId(deviceId)
          .catch((err) => console.error('Error accessing speaker:', err)),
      );
      updateSpeakerVolume(null);
    },
    [updateSpeakerVolume],
  );

  const handleSendRTCOffer = useCallback(
    (to: string, offer: RTCSessionDescriptionInit) => {
      if (!socket) return;
      socket.send.RTCOffer({
        to: to,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    },
    [socket],
  );

  const handleSendRTCAnswer = useCallback(
    (to: string, answer: RTCSessionDescriptionInit) => {
      if (!socket) return;
      socket.send.RTCAnswer({
        to: to,
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      });
    },
    [socket],
  );

  const handleSendRTCIceCandidate = useCallback(
    (to: string, candidate: RTCIceCandidate) => {
      if (!socket) return;
      socket.send.RTCIceCandidate({
        to: to,
        candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragment: candidate.usernameFragment,
        },
      });
    },
    [socket],
  );

  const removePeerConnection = useCallback(async (rtcConnection: string) => {
    if (!peerConnections.current[rtcConnection]) return;
    try {
      peerConnections.current[rtcConnection].close();
      delete peerConnections.current[rtcConnection];
      delete peerAudioRefs.current[rtcConnection];
    } catch (error) {
      console.error('Error removing peer connection:', error);
    }
  }, []);

  const createPeerConnection = useCallback(
    async (rtcConnection: string) => {
      if (peerConnections.current[rtcConnection]) return;
      try {
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
        peerConnection.oniceconnectionstatechange = () => {
          console.log('Connection State:', peerConnection.connectionState);
          if (
            ['disconnected', 'failed', 'closed'].includes(
              peerConnection.connectionState,
            )
          ) {
            removePeerConnection(rtcConnection);
          }
        };
        peerConnection.onconnectionstatechange = () => {
          console.log('Connection State:', peerConnection.connectionState);
          if (
            ['disconnected', 'failed', 'closed'].includes(
              peerConnection.connectionState,
            )
          ) {
            removePeerConnection(rtcConnection);
          }
        };
        peerConnection.onsignalingstatechange = () => {
          console.log('Signaling State:', peerConnection.signalingState);
          if (
            ['disconnected', 'failed', 'closed'].includes(
              peerConnection.signalingState,
            )
          ) {
            removePeerConnection(rtcConnection);
          }
        };
        peerConnection.ontrack = (event) => {
          if (!peerAudioRefs.current[rtcConnection]) {
            peerAudioRefs.current[rtcConnection] = document.body.appendChild(
              document.createElement('audio'),
            );
            peerAudioRefs.current[rtcConnection].autoplay = true;
            peerAudioRefs.current[rtcConnection].oncanplay = () => {
              updateSpeakerVolume(null);
            };
          }
          peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
          peerStreams.current[rtcConnection] = event.streams[0];
        };
        peerConnections.current[rtcConnection] = peerConnection;

        if (!destinationNode.current) {
          console.log('No destination node');
          return;
        }

        if (destinationNode.current.stream.getAudioTracks().length === 0) {
          console.log('No audio tracks');
          return;
        }

        const processedAudioTrack =
          destinationNode.current.stream.getAudioTracks()[0];
        if (processedAudioTrack) {
          peerConnection.addTrack(
            processedAudioTrack,
            destinationNode.current.stream,
          );
        }
      } catch (error) {
        console.error('Error creating peer connection:', error);
      }
    },
    [removePeerConnection, updateSpeakerVolume, handleSendRTCIceCandidate],
  );

  const handleRTCJoin = useCallback(
    async (rtcConnection: string) => {
      try {
        // Remove peer connection if it exists
        if (peerConnections.current[rtcConnection])
          await removePeerConnection(rtcConnection);
        // Create peer connection
        await createPeerConnection(rtcConnection);
        // Create offer
        const offer = await peerConnections.current[
          rtcConnection
        ].createOffer();
        await peerConnections.current[rtcConnection].setLocalDescription(offer);
        // Send offer
        handleSendRTCOffer(rtcConnection, offer);
      } catch (error) {
        console.error('Error handling RTC join:', error);
      }
    },
    [createPeerConnection, removePeerConnection, handleSendRTCOffer],
  );

  const handleRTCLeave = useCallback(
    async (rtcConnection: string) => {
      try {
        if (!peerConnections.current[rtcConnection]) return;
        // Remove peer connection
        await removePeerConnection(rtcConnection);
      } catch (error) {
        console.error('Error handling RTC leave:', error);
      }
    },
    [removePeerConnection],
  );

  const handleRTCOffer = useCallback(
    async ({ from, offer }: Offer) => {
      try {
        if (!peerConnections.current[from]) {
          await createPeerConnection(from);
        } else if (peerConnections.current[from].signalingState === 'stable') {
          console.warn(
            'Connection already in stable state, preparing to handle new offer',
          );
          await removePeerConnection(from);
          await createPeerConnection(from);
        }
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
        console.error('Error setting remote description:', error);
      }
    },
    [createPeerConnection, removePeerConnection, handleSendRTCAnswer],
  );

  const handleRTCAnswer = useCallback(async ({ from, answer }: Answer) => {
    try {
      if (!peerConnections.current[from]) return;
      // Check if connection is already in stable state
      if (peerConnections.current[from].signalingState === 'stable') {
        console.warn('Connection already in stable state, ignoring answer');
        return;
      }
      // Receive answer
      const answerDes = new RTCSessionDescription({
        type: answer.type,
        sdp: answer.sdp,
      });
      await peerConnections.current[from].setRemoteDescription(answerDes);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  }, []);

  const handleRTCIceCandidate = useCallback(
    async ({ from, candidate }: IceCandidate) => {
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
        console.error('Error adding ice candidate:', error);
      }
    },
    [],
  );

  useEffect(() => {
    updateInputStream('');
    updateOutputStream('');

    ipcService.audio.get('input', async (deviceId) => {
      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.log('New input stream device info:', deviceInfo);
      updateInputStream(deviceId || '');
    });
    ipcService.audio.get('output', async (deviceId) => {
      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.log('New output stream device info:', deviceInfo);
      updateOutputStream(deviceId || '');
    });

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
      if (gainNode.current) {
        gainNode.current = null;
      }
      if (sourceNode.current) {
        sourceNode.current = null;
      }
      if (destinationNode.current) {
        destinationNode.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('speakerVolume: ', speakerVolume);
  }, [speakerVolume]);

  useEffect(() => {
    console.log('micVolume: ', micVolume);
  }, [micVolume]);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
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
  }, [
    socket,
    isMute,
    micVolume,
    speakerVolume,
    bitrate,
    handleRTCJoin,
    handleRTCLeave,
    handleRTCOffer,
    handleRTCAnswer,
    handleRTCIceCandidate,
  ]);

  return (
    <WebRTCContext.Provider
      value={{
        toggleMute,
        updateBitrate,
        updateMicVolume,
        updateSpeakerVolume,
        isMute,
        bitrate,
        micVolume,
        speakerVolume,
      }}
    >
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
