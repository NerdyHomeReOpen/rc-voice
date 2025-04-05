import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/Markdown';
import MessageViewer from '@/components/viewers/Message';
import ChannelViewer from '@/components/viewers/Channel';
import MessageInputBox from '@/components/MessageInputBox';

// Types
import {
  User,
  Server,
  Message,
  Channel,
  Member,
  SocketServerEvent,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ServerPageProps {
  user: User;
  server: Server;
  handleServerUpdate: (data: Partial<Server> | null) => void;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(
  ({ user, server, handleServerUpdate }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const webRTC = useWebRTC();
    const contextMenu = useContextMenu();

    // Refs
    const refreshed = useRef(false);

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [currentChannel, setCurrentChannel] = useState<Channel>(
      createDefault.channel(),
    );
    const [member, setMember] = useState<Member>(createDefault.member());
    const [showMicVolume, setShowMicVolume] = useState(false);
    const [showSpeakerVolume, setShowSpeakerVolume] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());

    // Variables
    const { id: userId, currentChannelId: userCurrentChannelId } = user;
    const {
      id: serverId,
      name: serverName,
      announcement: serverAnnouncement,
      users: serverUsers = [],
    } = server;
    const {
      id: currentChannelId,
      messages: channelMessages = [],
      bitrate: channelBitrate,
      voiceMode: channelVoiceMode,
      forbidText: channelForbidText,
      forbidGuestText: channelForbidGuestText,
      guestTextMaxLength: channelGuestTextMaxLength,
      guestTextWaitTime: channelGuestTextWaitTime,
      guestTextGapTime: channelGuestTextGapTime,
    } = currentChannel;
    const {
      permissionLevel: memberPermissionLevel,
      lastMessageTime: memberLastMessageTime,
      lastJoinChannelTime: memberLastJoinChannelTime,
    } = member;
    const leftGapTime =
      channelGuestTextGapTime -
      Math.floor((currentTime - memberLastJoinChannelTime) / 1000);
    const leftWaitTime =
      channelGuestTextWaitTime -
      Math.floor((currentTime - memberLastMessageTime) / 1000);
    const isForbidByChatMode = channelForbidText && memberPermissionLevel < 3;
    const isForbidByGuestText =
      channelForbidGuestText && memberPermissionLevel === 1;
    const isForbidByGuestTextGap =
      channelGuestTextGapTime && leftGapTime > 0 && memberPermissionLevel === 1;
    const isForbidByGuestTextWait =
      channelGuestTextWaitTime &&
      leftWaitTime > 0 &&
      memberPermissionLevel === 1;
    const textMaxLength =
      memberPermissionLevel === 1 ? channelGuestTextMaxLength || 100 : 2000;

    // Handlers
    const handleSendMessage = (
      message: Partial<Message>,
      userId: User['id'],
      serverId: Server['id'],
      channelId: Channel['id'],
    ): void => {
      if (!socket) return;
      socket.send.message({ message, channelId, serverId, userId });
    };

    const handleUpdateChannel = (
      channel: Partial<Channel>,
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateChannel({ channel, channelId, serverId });
    };

    const handleChannelUpdate = (data: Partial<Channel> | null): void => {
      if (!data) data = createDefault.channel();
      setCurrentChannel((prev) => ({ ...prev, ...data }));
    };

    const handleMemberUpdate = (data: Partial<Member> | null): void => {
      if (!data) data = createDefault.member();
      setMember((prev) => ({ ...prev, ...data }));
    };

    const handleStartResizing = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    const handleStopResizing = useCallback(() => {
      setIsResizing(false);
    }, []);

    const handleResize = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(270, Math.min(e.clientX, maxWidth));
        setSidebarWidth(newWidth);
      },
      [isResizing],
    );

    const handleClickOutside = useCallback((e: MouseEvent) => {
      const micContainer = document.querySelector(
        `.${styles['micVolumeContainer']}`,
      );
      const speakerContainer = document.querySelector(
        `.${styles['speakerVolumeContainer']}`,
      );

      if (
        !micContainer?.contains(e.target as Node) &&
        !speakerContainer?.contains(e.target as Node)
      ) {
        setShowMicVolume(false);
        setShowSpeakerVolume(false);
      }
    }, []);

    // Effects
    useEffect(() => {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, [handleClickOutside]);

    useEffect(() => {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleStopResizing);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleStopResizing);
      };
    }, [handleResize, handleStopResizing]);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
        [SocketServerEvent.MEMBER_UPDATE]: handleMemberUpdate,
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
      if (!userId || !serverId || !userCurrentChannelId || refreshed.current)
        return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.server({
            serverId: serverId,
          }),
          refreshService.channel({
            channelId: userCurrentChannelId,
          }),
          refreshService.member({
            userId: userId,
            serverId: serverId,
          }),
        ]).then(([server, channel, member]) => {
          handleServerUpdate(server);
          handleChannelUpdate(channel);
          handleMemberUpdate(member);
        });
      };
      refresh();
    }, [userId, serverId, userCurrentChannelId, handleServerUpdate]);

    useEffect(() => {
      ipcService.discord.updatePresence({
        details: `${lang.tr.in} ${serverName}`,
        state: `${lang.tr.chatWithMembers.replace(
          '{0}',
          serverUsers.length.toString(),
        )}`,
        largeImageKey: 'app_icon',
        largeImageText: 'RC Voice',
        smallImageKey: 'home_icon',
        smallImageText: lang.tr.RPCServer,
        timestamp: Date.now(),
        buttons: [
          {
            label: lang.tr.RPCJoinServer,
            url: 'https://discord.gg/adCWzv6wwS',
          },
        ],
      });
    }, [lang, serverName, serverUsers]);

    useEffect(() => {
      if (!webRTC.updateBitrate || !channelBitrate) return;
      webRTC.updateBitrate(channelBitrate);
    }, [webRTC.updateBitrate, channelBitrate]);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className={styles['serverWrapper']}>
        {/* Main Content */}
        <main className={styles['serverContent']}>
          {/* Left Sidebar */}
          <div
            className={styles['sidebar']}
            style={{ width: `${sidebarWidth}px` }}
          >
            <ChannelViewer
              user={user}
              server={server}
              member={member}
              currentChannel={currentChannel}
            />
          </div>
          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={handleStartResizing}
            onMouseUp={handleStopResizing}
          />
          {/* Right Content */}
          <div className={styles['mainContent']}>
            <div className={styles['announcementArea']}>
              <MarkdownViewer markdownText={serverAnnouncement} />
            </div>
            <div className={styles['messageArea']}>
              <MessageViewer messages={channelMessages} />
            </div>
            <div className={styles['inputArea']}>
              <MessageInputBox
                onSendMessage={(msg) => {
                  handleSendMessage(
                    { type: 'general', content: msg },
                    userId,
                    serverId,
                    currentChannelId,
                  );
                }}
                disabled={
                  isForbidByGuestText ||
                  isForbidByGuestTextGap ||
                  isForbidByGuestTextWait ||
                  isForbidByChatMode
                }
                placeholder={
                  isForbidByChatMode
                    ? lang.tr.forbidOnlyAdminText
                    : isForbidByGuestText
                    ? lang.tr.forbidGuestText
                    : isForbidByGuestTextGap
                    ? `${lang.tr.guestTextGapTime} ${leftGapTime} ${lang.tr.seconds}`
                    : isForbidByGuestTextWait
                    ? `${lang.tr.guestTextWaitTime} ${leftWaitTime} ${lang.tr.seconds}`
                    : lang.tr.inputMessage
                }
                maxLength={textMaxLength}
              />
            </div>
            <div className={styles['buttonArea']}>
              <div className={styles['buttons']}>
                {memberPermissionLevel >= 3 && (
                  <div
                    className={styles['voiceModeDropdown']}
                    onClick={(e) =>
                      contextMenu.showContextMenu(e.clientX, e.clientY, [
                        {
                          id: 'freeSpeech',
                          label: lang.tr.freeSpeech,
                          onClick: () => {
                            handleUpdateChannel(
                              { voiceMode: 'free' },
                              currentChannelId,
                              serverId,
                            );
                          },
                        },
                        {
                          id: 'forbiddenSpeech',
                          label: lang.tr.forbiddenSpeech,
                          onClick: () => {
                            handleUpdateChannel(
                              { voiceMode: 'forbidden' },
                              currentChannelId,
                              serverId,
                            );
                          },
                        },
                        {
                          id: 'queue',
                          label: lang.tr.queue,
                          icon: 'submenu',
                          hasSubmenu: true,
                          onClick: () => {
                            handleUpdateChannel(
                              { voiceMode: 'queue' },
                              currentChannelId,
                              serverId,
                            );
                          },
                          submenuItems: [
                            {
                              id: 'forbiddenQueue',
                              label: lang.tr.forbiddenQueue,
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'forbidden' }, currentChannelId, serverId);
                              },
                            },
                            {
                              id: 'controlQueue',
                              label: lang.tr.controlQueue,
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'control' }, currentChannelId, serverId);
                              },
                            },
                          ],
                        },
                      ])
                    }
                  >
                    {channelVoiceMode === 'queue'
                      ? lang.tr.queue
                      : channelVoiceMode === 'free'
                      ? lang.tr.freeSpeech
                      : channelVoiceMode === 'forbidden'
                      ? lang.tr.forbiddenSpeech
                      : ''}
                  </div>
                )}
              </div>
              <div
                className={`
                  ${styles['micButton']} 
                  ${webRTC.isMute ? '' : styles['active']}`}
                onClick={() => webRTC.toggleMute?.()}
              >
                <div
                  className={`
                    ${styles['micIcon']} 
                    ${
                      webRTC.volumePercent
                        ? styles[
                            `level${Math.ceil(webRTC.volumePercent / 10) - 1}`
                          ]
                        : ''
                    }
                  `}
                />
                <div className={styles['micText']}>
                  {webRTC.isMute ? lang.tr.takeMic : lang.tr.takenMic}
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkgModeButton']}>{lang.tr.mixing}</div>
                <div className={styles['saperator']} />
                <div className={styles['micVolumeContainer']}>
                  <div
                    className={`
                      ${styles['micModeButton']} 
                      ${
                        webRTC.isMute || webRTC.micVolume === 0
                          ? styles['muted']
                          : styles['active']
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMicVolume(!showMicVolume);
                      setShowSpeakerVolume(false);
                    }}
                  />
                  {showMicVolume && (
                    <div className={styles['volumeSlider']}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={webRTC.micVolume}
                        onChange={(e) => {
                          webRTC.updateMicVolume?.(parseInt(e.target.value));
                        }}
                        className={styles['slider']}
                      />
                    </div>
                  )}
                </div>
                <div className={styles['speakerVolumeContainer']}>
                  <div
                    className={`${styles['speakerButton']} ${
                      webRTC.speakerVolume === 0 ? styles['muted'] : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeakerVolume(!showSpeakerVolume);
                      setShowMicVolume(false);
                    }}
                  />
                  {showSpeakerVolume && (
                    <div className={styles['volumeSlider']}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={webRTC.speakerVolume}
                        onChange={(e) => {
                          webRTC.updateSpeakerVolume?.(
                            parseInt(e.target.value),
                          );
                        }}
                        className={styles['slider']}
                      />
                    </div>
                  )}
                </div>
                <div className={styles['recordModeButton']} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  },
);

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;
