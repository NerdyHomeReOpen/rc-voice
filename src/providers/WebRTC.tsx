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
  speakingUsers?: string[];
  updateSpeakingStatus?: (userId: string, isSpeaking: boolean) => void;
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
  const [isMute, setIsMute] = useState<boolean>(true);
  const [bitrate, setBitrate] = useState<number>(128000);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [speakingUsers, setSpeakingUsers] = useState<string[]>([]);

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
  const iceCandidateQueue = useRef<{ [id: string]: RTCIceCandidate[] }>({});

  // Hooks
  const socket = useSocket();

  const handleRTCJoin = async (rtcConnection: string) => {
    try {
      if (peerConnections.current[rtcConnection])
        await removePeerConnection(rtcConnection);

      await createPeerConnection(rtcConnection);

      if (!localStream.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStream.current = stream;
        stream.getTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      const offer = await peerConnections.current[rtcConnection].createOffer();
      await peerConnections.current[rtcConnection].setLocalDescription(offer);
      handleSendRTCOffer(rtcConnection, offer);
    } catch (error) {
      console.error('Error in handleRTCJoin:', error);
      if (peerConnections.current[rtcConnection]) {
        await removePeerConnection(rtcConnection);
      }
    }
  };

  const handleRTCLeave = async (rtcConnection: string) => {
    try {
      if (!peerConnections.current[rtcConnection]) return;

      if (peerStreams.current[rtcConnection]) {
        peerStreams.current[rtcConnection]
          .getTracks()
          .forEach((track) => track.stop());
      }

      await removePeerConnection(rtcConnection);
    } catch (error) {
      console.error('Error in handleRTCLeave:', error);
    }
  };

  const handleRTCOffer = async ({ from, offer }: Offer) => {
    try {
      if (peerConnections.current[from]) {
        await removePeerConnection(from);
      }

      await createPeerConnection(from);
      const connection = peerConnections.current[from];

      const offerDes = new RTCSessionDescription({
        type: offer.type,
        sdp: offer.sdp,
      });
      await connection.setRemoteDescription(offerDes);

      await processIceCandidateQueue(from);

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      handleSendRTCAnswer(from, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
      if (peerConnections.current[from]) {
        await removePeerConnection(from);
      }
    }
  };

  const handleRTCAnswer = async ({ from, answer }: Answer) => {
    if (!peerConnections.current[from]) return;
    try {
      const connection = peerConnections.current[from];

      if (connection.signalingState === 'stable') {
        console.warn('Connection already in stable state, ignoring answer');
        return;
      }

      const answerDes = new RTCSessionDescription({
        type: answer.type,
        sdp: answer.sdp,
      });
      await connection.setRemoteDescription(answerDes);

      await processIceCandidateQueue(from);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleRTCIceCandidate = async ({ from, candidate }: IceCandidate) => {
    if (!peerConnections.current[from]) return;
    try {
      const connection = peerConnections.current[from];
      const iceCandidate = new RTCIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      });

      if (!connection.remoteDescription) {
        if (!iceCandidateQueue.current[from]) {
          iceCandidateQueue.current[from] = [];
        }
        iceCandidateQueue.current[from].push(iceCandidate);
        return;
      }

      await connection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Error adding ice candidate:', error);
    }
  };

  const processIceCandidateQueue = async (rtcConnection: string) => {
    if (
      !iceCandidateQueue.current[rtcConnection] ||
      !peerConnections.current[rtcConnection]
    )
      return;

    const connection = peerConnections.current[rtcConnection];
    const queue = iceCandidateQueue.current[rtcConnection];

    while (queue.length > 0) {
      const candidate = queue.shift();
      if (!candidate) continue;

      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error processing queued ice candidate:', error);
        queue.unshift(candidate);
        break;
      }
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

      // 修改音频处理逻辑
      peerConnection.ontrack = (event) => {
        if (!peerAudioRefs.current[rtcConnection]) {
          peerAudioRefs.current[rtcConnection] =
            document.createElement('audio');
          peerAudioRefs.current[rtcConnection].autoplay = true;
        }
        peerAudioRefs.current[rtcConnection].srcObject = event.streams[0];
        peerStreams.current[rtcConnection] = event.streams[0];

        // 创建音频上下文进行音量检测
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const isSpeaking = average > 10;
          updateSpeakingStatus(rtcConnection, isSpeaking);
          requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
      };

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

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream.current!);
        });
      }

      peerConnections.current[rtcConnection] = peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  const removePeerConnection = async (rtcConnection: string) => {
    if (!peerConnections.current[rtcConnection]) return;
    try {
      if (peerStreams.current[rtcConnection]) {
        peerStreams.current[rtcConnection]
          .getTracks()
          .forEach((track) => track.stop());
      }

      peerConnections.current[rtcConnection].close();

      delete peerConnections.current[rtcConnection];
      delete peerStreams.current[rtcConnection];
      delete peerAudioRefs.current[rtcConnection];
      delete iceCandidateQueue.current[rtcConnection];
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

  const updateSpeakingStatus = (userId: string, isSpeaking: boolean) => {
    setSpeakingUsers((prev) => {
      if (isSpeaking) {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      } else {
        if (!prev.includes(userId)) return prev;
        return prev.filter((id) => id !== userId);
      }
    });
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
          track.enabled = false;
          Object.values(peerConnections.current).forEach((peerConnection) => {
            peerConnection.addTrack(track, stream);
          });
        });

        // 添加本地音频检测
        const localAudioContext = new AudioContext();
        const localSource = localAudioContext.createMediaStreamSource(stream);
        const localAnalyser = localAudioContext.createAnalyser();
        localAnalyser.fftSize = 256;
        localAnalyser.smoothingTimeConstant = 0.8;
        localSource.connect(localAnalyser);

        const bufferLength = localAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkLocalAudioLevel = () => {
          localAnalyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const isSpeaking = average > 10;
          updateSpeakingStatus('local', isSpeaking);
          requestAnimationFrame(checkLocalAudioLevel);
        };

        checkLocalAudioLevel();
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
    // if (!deviceId) return;
    // const newStream = await navigator.mediaDevices.getUserMedia({
    //   audio: { deviceId: { exact: deviceId } },
    // });
    // newStream.getAudioTracks().forEach((track) => {
    //   track.enabled = !isMute;
    // });
    // if (localStream.current) {
    //   localStream.current.getTracks().forEach((track) => track.stop());
    // }
    // localStream.current = newStream;
    // Object.values(peerConnections.current).forEach((peerConnection) => {
    //   const senders = peerConnection.getSenders();
    //   senders.forEach((sender) => {
    //     if (sender.track?.kind === 'audio') {
    //       sender.replaceTrack(newStream.getAudioTracks()[0]);
    //     }
    //   });
    // });
  };

  const updateOutputDevice = async (deviceId: string) => {
    // if (!deviceId) return;
    // Object.values(peerAudioRefs.current).forEach((audio) => {
    //   audio
    //     .setSinkId(deviceId)
    //     .catch((err) => console.error('更新音訊輸出裝置失敗:', err));
    // });
  };

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
        speakingUsers,
        updateSpeakingStatus,
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
