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
      console.error('Error handling RTC join:', error);
    }
  };

  const handleRTCLeave = async (rtcConnection: string) => {
    try {
      if (!peerConnections.current[rtcConnection]) return;
      // Remove peer connection
      await removePeerConnection(rtcConnection);
    } catch (error) {
      console.error('Error handling RTC leave:', error);
    }
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
  };

  const handleRTCIceCandidate = async ({ from, candidate }: IceCandidate) => {
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
      // peerConnection.oniceconnectionstatechange = () => {
      //   console.log('Connection State:', peerConnection.connectionState);
      //   if (
      //     ['disconnected', 'failed', 'closed'].includes(
      //       peerConnection.connectionState,
      //     )
      //   ) {
      //     removePeerConnection(rtcConnection);
      //   }
      // };
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
          peerAudioRefs.current[rtcConnection].volume = speakerVolume / 100;
        }
        peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
        peerStreams.current[rtcConnection] = event.streams[0];
      };
      peerConnections.current[rtcConnection] = peerConnection;

      if (!destinationNode.current) return;

      if (destinationNode.current.stream.getAudioTracks().length > 0) {
        const processedAudioTrack =
          destinationNode.current.stream.getAudioTracks()[0];
        if (processedAudioTrack) {
          peerConnection.addTrack(
            processedAudioTrack,
            destinationNode.current.stream,
          );
        }
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
      lastBitrateRef.current = newBitrate;
      setBitrate(newBitrate);
    } catch (error) {
      console.error('Error updating bitrate:', error);
    }
  };

  const updateMicVolume = (volume: number) => {
    if (!localStream.current) return;
    try {
      if (
        !audioContext.current ||
        !gainNode.current ||
        !sourceNode.current ||
        !destinationNode.current
      ) {
        // Initialize Audio Context
        audioContext.current = new AudioContext();
        sourceNode.current = audioContext.current.createMediaStreamSource(
          localStream.current,
        );
        gainNode.current = audioContext.current.createGain();
        destinationNode.current =
          audioContext.current.createMediaStreamDestination();

        // Connect nodes
        sourceNode.current.connect(gainNode.current);
        gainNode.current.connect(destinationNode.current);

        // Set gain value
        gainNode.current.gain.value = volume / 100;
      }

      // Process audio tracks
      if (destinationNode.current.stream.getAudioTracks().length > 0) {
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

  const updateInputDevice = async (deviceId: string) => {
    try {
      if (!deviceId) return;

      // Get new audio stream
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

      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.log('New input stream device info:', deviceInfo);

      // Process the new stream and update peer connections
      updateMicVolume(micVolume);
    } catch (err) {
      console.error('Error accessing microphone device:', err);
    }
  };

  const updateOutputDevice = async (deviceId: string) => {
    try {
      if (!deviceId) return;

      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.log('New output stream device info:', deviceInfo);

      // Check if browser supports setSinkId API
      // if (typeof HTMLMediaElement.prototype.setSinkId === 'function') {
      //   Object.values(peerAudioRefs.current).forEach((audio) => {
      //     audio
      //       .setSinkId(deviceId)
      //       .catch((err) =>
      //         console.error(
      //           'Error updating audio output device (peerAudioRefs):',
      //           err,
      //         ),
      //       );
      //   });

      // Update hidden audio elements
      Object.values(peerAudioRefs.current).forEach((audio) =>
        audio
          .setSinkId(deviceId)
          .catch((err) =>
            console.error(
              'Error updating hidden audio element output device:',
              err,
            ),
          ),
      );

      // Update speaker volume
      updateSpeakerVolume(speakerVolume);
    } catch (err) {
      console.error('Error setting audio output device:', err);
    }
  };

  // Effects
  useEffect(() => {
    if (!localStream.current) return;

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
      sourceNode.current = audioContext.current.createMediaStreamSource(
        localStream.current,
      );
      gainNode.current = audioContext.current.createGain();
      destinationNode.current =
        audioContext.current.createMediaStreamDestination();

      gainNode.current.gain.value = micVolume / 100;
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, [localStream.current]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStream.current = stream;
        updateMicVolume(micVolume); // Process the initial stream
      })
      .catch((err) => console.error('Error accessing microphone', err));

    // ipcService.audio.get('input', (input) => {
    //   updateInputDevice(input || '');
    // });
    // ipcService.audio.get('output', (output) => {
    //   updateOutputDevice(output || '');
    // });

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
    ipcService.audio.update('input', (input) => {
      updateInputDevice(input || '');
    });
    ipcService.audio.update('output', (output) => {
      updateOutputDevice(output || '');
    });
  }, []);

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
