// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Channel, User } from '@/types';
// import { useSelector } from 'react-redux';
// import { Socket } from 'socket.io-client';

// interface UserCall {
//     userId: string;
//     username: string;
//     isSpeaker: boolean;
//     isMuted: boolean;
// }

// class Call {
//     // socket: Socket;
//     currentRoom: string;
//     isSpeaker: boolean;
//     sendAudioContext!: AudioContext;
//     audioContext!: AudioContext;
//     sourceNode!: MediaStreamAudioSourceNode;
//     isMuted: boolean;
//     stream!: MediaStream;
//     currentUsers: UserCall[] = []; // Initialize with empty array of User type
//     channel: Channel;
//     user: User;
//     userListDiv: any;
//     source!: AudioBufferSourceNode;
//     username!: string;
//     workletNode!: AudioWorkletNode;
//     analyser!: AnalyserNode;
//     isConnect: boolean;
//     animationFrameId: number;
//     receiveWorkletNode!: AudioWorkletNode;

//     constructor(channel: Channel = {
//         id: '',
//         name: '',
//         isCategory: false,
//         isLobby: false,
//         serverId: '',
//         settings: {
//             bitrate: 0,
//             slowmode: false,
//             userLimit: 0,
//             visibility: 'public'
//         },
//         createdAt: 0,
//         isRoot: false,
//         voiceMode: 'free',
//         chatMode: 'free',
//         order: 0
//     }) {
//         // this.socket = socket;
//         const user = useSelector((state: { user: User | null }) => state.user);
//         this.user = user!;
//         this.username = this.user.id;
//         this.channel = channel;
//         this.currentRoom = "";
//         this.isSpeaker = false;
//         this.isMuted = false;
//         this.isConnect = false;
//         this.animationFrameId = 0;
//         this.setupAudioPlayback();
//         this.setupReceiveWorklet();
//         // if (this.socket) this.initialize();
//     }
//     initialize() {
//         // this.isConnect = true;
//         // this.socket.on("update-users-list", (users: User[]) =>
//         //     {if (this.isConnect) console.log("Call users list: ",users)});
//         // this.socket.on("audio-stream", (
//         //     { from, data }: { from: string, data: ArrayBuffer }) =>
//         //         this.playAudioStream(from, data));
//         // this.socket.on("update-disconnect", () => this.disconnectAudioStream());

//         // console.log("call socket initialized", this.socket);
//         // this.socket.on("user-speaking",
//         //     ({ userId, isSpeaking, volume }:
//         //         { userId: string, isSpeaking: boolean, volume: number }) =>
//         //             this.handleUserSpeaking(userId, isSpeaking, volume));
//         // this.socket.on("room-list", (rooms: string[]) => this.displayRooms(rooms));
//         // this.socket.emit("get-rooms");
//     }
//     /** 加入頻道 */
//     joinChannel(channel: Channel) {
//         this.isConnect = true;
//         this.channel = channel;
//         console.log("Call channel: ", channel)
//         this.joinRoom(this.channel.id);
//     }
//     /** 加入房間 */
//     async joinRoom(room: string): Promise<void> {
//         // this.isSpeaker = confirm("是否要開啟麥克風？（取消則進入旁聽模式）");
//         this.isSpeaker = true;
//         if (this.isSpeaker) {
//             try {
//                 this.stream = await navigator.mediaDevices.getUserMedia({
//                     audio: {
//                         echoCancellation: true,
//                         noiseSuppression: true,
//                         autoGainControl: true,
//                     }
//                 });
//                 this.startBroadcasting();
//             } catch (error) {
//                 alert("無法存取麥克風，已進入旁聽模式");
//                 // this.isSpeaker = false;
//             }
//         }
//         this.currentRoom = room;
//         if (this.socket && this.socket.connected)
//             this.socket.emit("join-room", {
//                 room,
//                 isSpeaker: this.isSpeaker,
//                 username: this.username
//             });
//         console.log("Call room: ", room)
//     }
//     /** 開始廣播 */
//     async startBroadcasting() {
//         this.sourceNode = this.sendAudioContext.createMediaStreamSource(this.stream);
//         this.analyser = this.sendAudioContext.createAnalyser(); // 在主執行緒建立 AnalyserNode
//         this.analyser.smoothingTimeConstant = 0.8;
//         this.analyser.fftSize = 512;

//         try {
//             await this.sendAudioContext.audioWorklet.addModule('/audio-worklet-processor.js');
//             this.workletNode = new AudioWorkletNode(this.sendAudioContext, 'my-audio-processor');

//             this.workletNode.port.onmessage = (event) => {
//                 const { audioData } = event.data;
//                 if (this.socket && this.socket.connected && !this.socket.disconnected)
//                     this.socket.emit("audio-data", {
//                         room: this.currentRoom,
//                         data: audioData,
//                         username:this.username
//                     });
//             };

//             const silentGain = this.sendAudioContext.createGain();
//             silentGain.gain.value = 0;
//             this.sourceNode.connect(this.analyser);
//             this.analyser.connect(this.workletNode);
//             this.workletNode.connect(silentGain);
//             silentGain.connect(this.sendAudioContext.destination);
//         } catch (error) {
//             console.error("Failed to load audio worklet module:", error);
//             return;
//         }

//         //  音量分析迴圈 (主執行緒)
//         const processVolume = () => {
//             const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
//             this.analyser.getByteFrequencyData(dataArray);
//             let volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
//             let isSpeaking = volume > 10;

//             if (this.isMuted) {
//                 volume = 0;
//                 isSpeaking = false;
//             }
//             if (this.socket && this.socket.connected)
//                 this.socket.emit("user-speaking", {
//                     room: this.currentRoom,
//                     isSpeaking,
//                     volume,
//                     username:this.username
//                 });
//             this.animationFrameId = requestAnimationFrame(processVolume);
//         };
//         processVolume();
//     }
//     /** 轉換結構 */
//     convertFloat32ToInt16(buffer: Float32Array): Int16Array {
//         const int16Array = new Int16Array(buffer.length);
//         for (let i = 0; i < buffer.length; i++) {
//             int16Array[i] = buffer[i] * 32767;
//         }
//         return int16Array;
//     }
//     /** 設定音流播放 */
//     setupAudioPlayback() {
//         this.sendAudioContext = new (window.AudioContext)({ sampleRate: 192000 });
//         this.audioContext = new (window.AudioContext)({ sampleRate: 192000 });
//     }
//     async setupReceiveWorklet() {
//         try {
//             await this.audioContext.audioWorklet.addModule('/audio-worklet-processor-receiver.js');
//             this.receiveWorkletNode = new AudioWorkletNode(
//                 this.audioContext, 'my-receive-audio-processor');
//             this.receiveWorkletNode.connect(this.audioContext.destination);
//         } catch (error) {
//             console.error("載入接收端 AudioWorklet 模組失敗:", error);
//         }
//     }
//     /** 播放音流 */
//     playAudioStream(from: string, data: ArrayBuffer) {
//         if (!this.isConnect) return;
//         if (from == this.username) return;
//         if (!data || !(data instanceof ArrayBuffer))
//             return console.error("Invalid audio data received");
//         if (this.receiveWorkletNode)
//             this.receiveWorkletNode.port.postMessage({ audioData: data });
//     }

//     /** 停止播放音流 */
//     disconnectAudioStream() {
//         this.isConnect = false;
//         cancelAnimationFrame(this.animationFrameId);
//         if (this.source) this.source.stop();
//         this.sourceNode.disconnect();
//         this.analyser.disconnect();
//         this.workletNode.disconnect();
//         console.log("Call disconnected");
//     }
//     /** 切換靜音(個人) */
//     toggleMute() {
//         this.isMuted = !this.isMuted;
//         this.stream.getAudioTracks().forEach(track => {
//             track.enabled = !this.isMuted;
//         });
//         if (this.socket && this.socket.connected)
//             this.socket.emit("toggle-mute", {
//                 room: this.currentRoom,
//                 userId: this.socket.id,
//                 isMuted: this.isMuted
//             });
//     }
//     /** 更新使用者列表 */
// 	updateUserList(users: UserCall[]) {
// 		this.currentUsers = users;
// 		this.userListDiv.innerHTML = "";
// 		users.forEach((user: UserCall) => {
// 			// 使用者ID
// 			const userItem = document.createElement("div");
// 			userItem.id = `user-${user.userId}`;
// 			userItem.style.display = "flex";
// 			userItem.style.alignItems = "center";
// 			userItem.style.marginBottom = "5px";

// 			// 使用者名稱
// 			const usernameText = document.createElement("span");
// 			usernameText.textContent = `${user.username} (${user.isSpeaker ? "發言者" : "聽眾"})`;
// 			usernameText.style.width = "150px";
// 			usernameText.style.textAlign = "left";

// 			// 靜音emoji
// 			const muteIcon = document.createElement("span");
// 			muteIcon.id = `mute-icon-${user.userId}`;
// 			muteIcon.textContent = user.isMuted ? "🔇" : "";
// 			muteIcon.style.marginLeft = "5px";
// 			muteIcon.style.color = "red";

// 			// 背景音量條
// 			const volumeBar = document.createElement("div");
// 			volumeBar.id = `volume-${user.userId}`;
// 			volumeBar.style.width = "100px";
// 			volumeBar.style.height = "10px";
// 			volumeBar.style.backgroundColor = "#ccc";
// 			volumeBar.style.borderRadius = "5px";
// 			volumeBar.style.marginLeft = "10px";

// 			// 綠色音量條
// 			const volumeFill = document.createElement("div");
// 			volumeFill.style.height = "100%";
// 			volumeFill.style.width = "0%";
// 			volumeFill.style.backgroundColor = "limegreen";
// 			volumeFill.style.borderRadius = "5px";
// 			volumeFill.style.transition = "width 0.1s linear";
// 			volumeFill.id = `volume-fill-${user.userId}`;

// 			volumeBar.appendChild(volumeFill);
// 			userItem.appendChild(usernameText);
// 			userItem.appendChild(volumeBar);
// 			userItem.appendChild(muteIcon);
// 			this.userListDiv.appendChild(userItem);
// 		});
// 	}
//     /** 處理說話 */
//     handleUserSpeaking(userId: string, isSpeaking: boolean, volume: number) {
//         const volumeFill = document.getElementById(`volume-fill-${userId}`) as HTMLElement | null;
//         if (volumeFill) {
//             volumeFill.style.width = `${Math.min(100, Math.max(0, (volume / 50) * 100))}%`;
//         }
//         this.highlightUser(userId, isSpeaking);
//     }
//     /** 處理說話顏色、靜音 */
//     highlightUser(userId: string, isSpeaking: boolean) {
//         const userElement = document.getElementById(`user-${userId}`) as HTMLElement | null;
//         const muteIcon = document.getElementById(`mute-icon-${userId}`) as HTMLElement | null;
//         if (userElement) {
//             const userData = this.getUserDataById(userId);
//             if (userData && userData.isMuted) {
//                 userElement.style.color = "black";
//                 if (muteIcon) muteIcon.textContent = "🔇";
//             } else {
//                 userElement.style.color = isSpeaking ? "red" : "black";
//                 if (muteIcon) muteIcon.textContent = "";
//             }
//         }
//     }
//     /** 取得使用者ID */
//     getUserDataById(userId: string): UserCall | undefined {
//         const users = this.currentUsers || [];
//         return users.find(user => user.userId == userId);
//     }
// }

// export default Call;
