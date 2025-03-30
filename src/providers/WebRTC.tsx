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
import { useSocket } from '@/providers/Socket';

// Types
import { SocketServerEvent } from '@/types';

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
  updateInputDevice?: (deviceId: string) => void;
  updateOutputDevice?: (deviceId: string) => void;
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
  const lastBitrateRef = useRef<number>(128000);
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

  const handleRTCJoin = async (rtcConnection: string) => {
    try {
      // Remove peer connection if it exists
      if (peerConnections.current[rtcConnection])
        await removePeerConnection(rtcConnection);
      // Create peer connection
      await createPeerConnection(rtcConnection);
      // Create offer

      const offer = await peerConnections.current[rtcConnection].createOffer();
      await peerConnections.current[rtcConnection].setLocalDescription(offer);
      // Send offer
      handleSendRTCOffer(rtcConnection, offer);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleRTCLeave = async (rtcConnection: string) => {
    if (!peerConnections.current[rtcConnection]) return;
    // Remove peer connection
    await removePeerConnection(rtcConnection);
  };

  const handleRTCOffer = async ({ from, offer }: Offer) => {
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
  };

  const handleRTCAnswer = async ({ from, answer }: Answer) => {
    if (!peerConnections.current[from]) return;
    try {
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
  };

  const handleRTCIceCandidate = async ({ from, candidate }: IceCandidate) => {
    if (!peerConnections.current[from]) return;
    try {
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
  };

  const handleSendRTCOffer = (to: string, offer: RTCSessionDescriptionInit) => {
    if (!socket) return;
    socket.send.RTCOffer({
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
    if (!socket) return;
    socket.send.RTCAnswer({
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
  };

  const createPeerConnection = async (rtcConnection: string) => {
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
          peerAudioRefs.current[rtcConnection] =
            document.createElement('audio');
          peerAudioRefs.current[rtcConnection].autoplay = true;
        }
        peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
        peerStreams.current[rtcConnection] = event.streams[0];
      };
      peerConnections.current[rtcConnection] = peerConnection;

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream.current!);
        });
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  const removePeerConnection = async (rtcConnection: string) => {
    if (!peerConnections.current[rtcConnection]) return;
    try {
      peerConnections.current[rtcConnection].close();

      delete peerConnections.current[rtcConnection];

      delete peerAudioRefs.current[rtcConnection];
    } catch (error) {
      console.error('Error removing peer connection:', error);
    }
  };

  const toggleMute = () => {
    if (!localStream.current) return;
    try {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMute;
      });
      setIsMute(!isMute);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const updateBitrate = (newBitrate: number) => {
    if (newBitrate === lastBitrateRef.current) return;
    try {
      Object.entries(peerConnections.current).forEach(
        async ([_, connection]) => {
          const senders = connection.getSenders();
          for (const sender of senders) {
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }
            parameters.encodings[0].maxBitrate = newBitrate;
            await sender.setParameters(parameters);
          }
        },
      );
      lastBitrateRef.current = newBitrate;
      setBitrate(newBitrate);
    } catch (error) {
      console.error('Error updating bitrate:', error);
    }
  };

  const updateMicVolume = (volume: number) => {
    if (!localStream.current) return;
    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
        sourceNode.current = audioContext.current.createMediaStreamSource(
          localStream.current,
        );
        gainNode.current = audioContext.current.createGain();
        destinationNode.current =
          audioContext.current.createMediaStreamDestination();

        if (gainNode.current) {
          gainNode.current.gain.value = volume / 100;
        }

        sourceNode.current.connect(gainNode.current);
        gainNode.current.connect(destinationNode.current);

        if (destinationNode.current.stream.getAudioTracks().length > 0) {
          const processedTrack =
            destinationNode.current.stream.getAudioTracks()[0];
          Object.values(peerConnections.current).forEach((connection) => {
            const senders = connection.getSenders();
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(processedTrack).catch((error) => {
                console.error('Error replacing audio track:', error);
              });
            }
          });
        }
      }

      if (gainNode.current) {
        gainNode.current.gain.value = volume / 100;
      }

      setMicVolume(volume);
    } catch (error) {
      console.error('Error updating microphone volume:', error);
    }
  };

  const updateSpeakerVolume = (volume: number) => {
    try {
      Object.values(peerAudioRefs.current).forEach((audio) => {
        audio.volume = volume / 100;
      });
      setSpeakerVolume(volume);
    } catch (error) {
      console.error('Error updating speaker volume:', error);
    }
  };

  // Effects
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
  }, [socket]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStream.current = stream;
        stream.getTracks().forEach((track) => {
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

  const updateInputDevice = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      // Set mute state of new audio stream to match current state
      newStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMute;
      });

      // Stop all tracks of current stream
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }

      // Update local stream reference
      localStream.current = newStream;

      // If audio processing context exists, need to recreate
      if (audioContext.current) {
        // Disconnect old connection
        if (sourceNode.current) {
          sourceNode.current.disconnect();
        }

        // Create new audio source
        sourceNode.current =
          audioContext.current.createMediaStreamSource(newStream);

        // Connect to gain node and destination node
        if (gainNode.current && destinationNode.current) {
          sourceNode.current.connect(gainNode.current);
          gainNode.current.connect(destinationNode.current);

          // Get processed audio track
          const processedTrack =
            destinationNode.current.stream.getAudioTracks()[0];

          // Update all peer connection senders
          Object.values(peerConnections.current).forEach((peerConnection) => {
            const senders = peerConnection.getSenders();
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(processedTrack).catch((error) => {
                console.error('Error replacing audio track:', error);
              });
            }
          });
        } else {
          // If gain node is not set, use new track directly
          newStream.getAudioTracks().forEach((track) => {
            Object.values(peerConnections.current).forEach((peerConnection) => {
              const senders = peerConnection.getSenders();
              const audioSender = senders.find(
                (s) => s.track?.kind === 'audio',
              );
              if (audioSender) {
                audioSender.replaceTrack(track).catch((error) => {
                  console.error('Error replacing audio track:', error);
                });
              }
            });
          });
        }
      } else {
        // If audio processing context does not exist, update all connected tracks directly
        newStream.getAudioTracks().forEach((track) => {
          Object.values(peerConnections.current).forEach((peerConnection) => {
            const senders = peerConnection.getSenders();
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(track).catch((error) => {
                console.error('Error replacing audio track:', error);
              });
            }
          });
        });
      }
    } catch (err) {
      console.error('Error accessing microphone device:', err);
    }
  };

  const updateOutputDevice = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      // Check if browser supports setSinkId API
      if (typeof HTMLMediaElement.prototype.setSinkId === 'function') {
        Object.values(peerAudioRefs.current).forEach((audio) => {
          audio
            .setSinkId(deviceId)
            .catch((err) =>
              console.error('Error updating audio output device:', err),
            );
        });

        // Update hidden audio elements
        const audioElements = document.querySelectorAll(
          'audio[style*="display: none"]',
        );
        audioElements.forEach((audio) => {
          if (audio instanceof HTMLMediaElement && audio.setSinkId) {
            audio
              .setSinkId(deviceId)
              .catch((err) =>
                console.error(
                  'Error updating hidden audio element output device:',
                  err,
                ),
              );
          }
        });
      } else {
        console.warn(
          'This browser does not support setSinkId API, cannot switch audio output device',
        );
      }
    } catch (err) {
      console.error('Error setting audio output device:', err);
    }
  };

  // Clean up Audio Context when component unmounts
  useEffect(() => {
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, []);

  return (
    <WebRTCContext.Provider
      value={{
        toggleMute,
        updateBitrate,
        updateMicVolume,
        updateSpeakerVolume,
        updateInputDevice,
        updateOutputDevice,
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
