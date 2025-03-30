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
  PopupType,
  User,
  Server,
  Message,
  Channel,
  Member,
  SocketServerEvent,
  ContextMenuItem,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';
import { useExpandedContext } from '@/providers/Expanded';

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
    const { handleSetCategoryExpanded, handleSetChannelExpanded } =
      useExpandedContext();

    // Refs
    const refreshed = useRef(false);

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(256);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(
      user.favServers?.some((favServer) => favServer.id === server.id) || false,
    );
    const [currentChannel, setCurrentChannel] = useState<Channel>(
      createDefault.channel(),
    );
    const [member, setMember] = useState<Member>(createDefault.member());
    const [showMicVolume, setShowMicVolume] = useState(false);
    const [showSpeakerVolume, setShowSpeakerVolume] = useState(false);
    const [micVolume, setMicVolume] = useState(webRTC.micVolume || 100);
    const [speakerVolume, setSpeakerVolume] = useState(
      webRTC.speakerVolume || 100,
    );
    const [currentTime, setCurrentTime] = useState<number>(Date.now());

    // Variables
    const { id: userId, currentChannelId: userCurrentChannelId } = user;
    const {
      id: serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
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
      leftGapTime > 0 && memberPermissionLevel === 1;
    const isForbidByGuestTextWait =
      leftWaitTime > 0 && memberPermissionLevel === 1;
    const textMaxLength =
      memberPermissionLevel === 1 ? channelGuestTextMaxLength || 100 : 2000;

    // Handlers
    const handleSendMessage = (
      message: Partial<Message>,
      channelId: Channel['id'],
    ): void => {
      if (!socket) return;
      socket.send.message({ message, channelId });
    };

    const handleUpdateChannel = (
      channel: Partial<Channel>,
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateChannel({ channel, channelId, serverId });
    };

    // FIXME: logic is wrong
    const handleAddFavoriteServer = (serverId: Server['id']) => {
      if (!socket) return;
      socket.send.updateUser({
        userId,
        user: {
          ...user,
          favoriteServerId: serverId,
        },
      });
      setIsFavorite(!isFavorite);
    };

    const handleChannelUpdate = (data: Partial<Channel> | null): void => {
      if (!data) data = createDefault.channel();
      setCurrentChannel((prev) => ({ ...prev, ...data }));
    };

    const handleMemberUpdate = (data: Partial<Member> | null): void => {
      if (!data) data = createDefault.member();
      setMember((prev) => ({ ...prev, ...data }));
    };

    const handleOpenServerSettings = (
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_SERVER);
      ipcService.initialData.onRequest(PopupType.EDIT_SERVER, {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (server.receiveApply === false) {
        ipcService.popup.open(PopupType.DIALOG_ALERT2);
        ipcService.initialData.onRequest(PopupType.DIALOG_ALERT2, {
          title: lang.tr.cannotApply,
        });
        return;
      }

      ipcService.popup.open(PopupType.APPLY_MEMBER);
      ipcService.initialData.onRequest(PopupType.APPLY_MEMBER, {
        userId,
        serverId,
      });
    };

    const handleOpenEditMember = (
      serverId: Server['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_MEMBER);
      ipcService.initialData.onRequest(PopupType.EDIT_MEMBER, {
        serverId,
        userId,
      });
    };

    const handleLocateUser = () => {
      if (!handleSetCategoryExpanded || !handleSetChannelExpanded) return;
      handleSetCategoryExpanded();
      handleSetChannelExpanded();
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
        const newWidth = Math.max(250, Math.min(e.clientX, maxWidth));
        setSidebarWidth(newWidth);
      },
      [isResizing],
    );

    const handleMicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      setMicVolume(value);
      webRTC.updateMicVolume?.(value);
    };

    const handleSpeakerVolumeChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value = parseInt(e.target.value);
      setSpeakerVolume(value);
      webRTC.updateSpeakerVolume?.(value);
    };

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
        const server = await refreshService.server({ serverId: serverId });
        handleServerUpdate(server);
        const channel = await refreshService.channel({
          channelId: userCurrentChannelId,
        });
        handleChannelUpdate(channel);
        const member = await refreshService.member({
          userId: userId,
          serverId: serverId,
        });
        handleMemberUpdate(member);
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
    }, [webRTC, webRTC.updateBitrate, channelBitrate]);

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
            <div className={styles['sidebarHeader']}>
              <div
                className={styles['avatarBox']}
                onClick={() =>
                  memberPermissionLevel >= 5 &&
                  handleOpenServerSettings(userId, serverId)
                }
              >
                <div
                  className={styles['avatarPicture']}
                  style={{ backgroundImage: `url(${serverAvatarUrl})` }}
                />
              </div>
              <div className={styles['baseInfoBox']}>
                <div className={styles['container']}>
                  <div className={styles['name']}>{serverName} </div>
                </div>
                <div className={styles['container']}>
                  <div className={styles['idIcon']} />
                  <div className={styles['idText']}>{serverDisplayId}</div>
                  <div className={styles['memberIcon']} />
                  <div className={styles['memberText']}>
                    {serverUsers.length}
                  </div>
                </div>
              </div>
              <div className={styles['optionBox']}>
                <div
                  className={styles['invitation']}
                  onClick={() => {
                    // Handle invite friends
                  }}
                />
                <div className={styles['saperator']} />
                <div
                  className={styles['setting']}
                  onClick={(e) => {
                    contextMenu.showContextMenu(
                      e.clientX,
                      e.clientY,
                      [
                        {
                          id: 'invitation',
                          label: lang.tr.invitation,
                          show: memberPermissionLevel < 2,
                          icon: 'memberapply',
                          onClick: () =>
                            handleOpenApplyMember(userId, serverId),
                        },
                        // {
                        //   id: 'memberChat',
                        //   label: '會員群聊',
                        //   show: memberPermissionLevel > 2,
                        //   onClick: () => {},
                        // },
                        // {
                        //   id: 'admin',
                        //   label: '查看管理員',
                        //   onClick: () => {},
                        // },
                        {
                          id: 'separator',
                          label: '',
                          show: memberPermissionLevel < 2,
                        },
                        {
                          id: 'editNickname',
                          label: lang.tr.editNickname,
                          icon: 'editGroupcard',
                          onClick: () => handleOpenEditMember(serverId, userId),
                        },
                        {
                          id: 'locateMe',
                          label: lang.tr.locateMe,
                          icon: 'locateme',
                          onClick: () => handleLocateUser(),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        // {
                        //   id: 'report',
                        //   label: '舉報',
                        //   onClick: () => {},
                        // },
                        {
                          id: 'favorite',
                          label: isFavorite
                            ? lang.tr.unfavorite
                            : lang.tr.favorite,
                          icon: isFavorite ? 'collect' : 'uncollect',
                          onClick: () => handleAddFavoriteServer(serverId),
                        },
                      ].filter(Boolean) as ContextMenuItem[],
                    );
                  }}
                />
              </div>
            </div>
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
                    {
                      id: '',
                      type: 'general',
                      content: msg,
                      receiverId: serverId,
                      timestamp: 0,
                    },
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
                className={`${styles['micButton']} ${
                  webRTC.isMute ? '' : styles['active']
                }`}
                onClick={() => webRTC.toggleMute?.()}
              >
                <div className={styles['micIcon']} />
                <div className={styles['micText']}>
                  {webRTC.isMute ? lang.tr.takeMic : lang.tr.takenMic}
                </div>
              </div>
              <div className={styles['buttons']}>
                <div className={styles['bkgModeButton']}>{lang.tr.mixing}</div>
                <div className={styles['saperator']} />
                <div className={styles['micVolumeContainer']}>
                  <div
                    className={`${styles['micModeButton']} ${
                      webRTC.isMute || micVolume === 0
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
                        value={micVolume}
                        onChange={handleMicVolumeChange}
                        className={styles['slider']}
                      />
                    </div>
                  )}
                </div>
                <div className={styles['speakerVolumeContainer']}>
                  <div
                    className={`${styles['speakerButton']} ${
                      speakerVolume === 0 ? styles['muted'] : ''
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
                        value={speakerVolume}
                        onChange={handleSpeakerVolumeChange}
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
