import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';
import MessageViewer from '@/components/viewers/MessageViewer';
import ChannelViewer from '@/components/viewers/ChannelViewer';
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
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useWebRTC } from '@/providers/WebRTCProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useExpandedContext } from '@/providers/ExpandedContextProvider';

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
    const { setCategoryExpanded, setChannelExpanded } = useExpandedContext();

    // Refs
    const refreshed = useRef(false);

    // States
    const [sidebarWidth, setSidebarWidth] = useState<number>(256);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(
      user.favServers?.some((server) => server.id === server.id) || false,
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

    // Variables
    const { id: userId, currentChannelId: userCurrentChannelId } = user;
    const {
      id: serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
      announcement: serverAnnouncement,
      members: serverMembers = [],
    } = server;
    const {
      id: currentChannelId,
      messages: channelMessages = [],
      bitrate: channelBitrate,
      chatMode: channelChatMode,
      voiceMode: channelVoiceMode,
    } = currentChannel;
    const { permissionLevel: memberPermissionLevel } = member;

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
      setCategoryExpanded.current?.(true);
      setChannelExpanded.current?.(true);
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
        state: `${lang.tr.with} ${serverMembers.length} ${lang.tr.chatWithMembers}`,
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
    }, [lang, serverName, serverMembers]);

    useEffect(() => {
      if (!webRTC.updateBitrate || !channelBitrate) return;
      webRTC.updateBitrate(channelBitrate);
    }, [webRTC, webRTC.updateBitrate, channelBitrate]);

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
              <div className={styles['avatarBox']}>
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
                    {serverMembers.length}
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
                          id: 'setting',
                          label: '設定群組',
                          show: memberPermissionLevel > 4,
                          onClick: () =>
                            handleOpenServerSettings(userId, serverId),
                        },
                        {
                          id: 'invitation',
                          label: '申請會員',
                          show: memberPermissionLevel < 2,
                          onClick: () =>
                            handleOpenApplyMember(userId, serverId),
                        },
                        {
                          id: 'memberChat',
                          label: '會員群聊',
                          show: memberPermissionLevel > 2,
                          onClick: () => {},
                        },
                        {
                          id: 'admin',
                          label: '查看管理員',
                          onClick: () => {},
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'editNickname',
                          label: '編輯群名片',
                          onClick: () => handleOpenEditMember(serverId, userId),
                        },
                        {
                          id: 'locateMe',
                          label: '定位我自己',
                          onClick: () => handleLocateUser(),
                        },
                        {
                          id: 'separator',
                          label: '',
                        },
                        {
                          id: 'report',
                          label: '舉報',
                          onClick: () => {},
                        },
                        {
                          id: 'favorite',
                          label: isFavorite ? '取消收藏' : '加入收藏',
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
                locked={
                  channelChatMode === 'forbidden' && memberPermissionLevel < 3
                }
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
                            handleSendMessage(
                              {
                                type: 'info',
                                content: lang.tr.changeToFreeSpeech,
                                timestamp: 0,
                              },
                              currentChannelId,
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
                            handleSendMessage(
                              {
                                type: 'info',
                                content: lang.tr.changeToForbiddenSpeech,
                                timestamp: 0,
                              },
                              currentChannelId,
                            );
                          },
                        },
                        {
                          id: 'queue',
                          label: '排麥',
                          icon: 'submenu',
                          hasSubmenu: true,
                          onClick: () => {
                            handleUpdateChannel(
                              { voiceMode: 'queue' },
                              currentChannelId,
                              serverId,
                            );
                            handleSendMessage(
                              {
                                type: 'info',
                                content:
                                  '頻道被設為排麥才能發言，請點擊"拿麥發言"等候發言',
                                timestamp: 0,
                              },
                              currentChannelId,
                            );
                          },
                          submenuItems: [
                            {
                              id: 'forbiddenQueue',
                              label: '禁止排麥',
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'forbidden' }, currentChannelId, serverId);
                                handleSendMessage(
                                  {
                                    type: 'info',
                                    content: '排麥模式已變更為禁止',
                                  },
                                  currentChannelId,
                                );
                              },
                            },
                            {
                              id: 'controlQueue',
                              label: '控麥',
                              disabled: channelVoiceMode === 'queue',
                              onClick: () => {
                                // handleUpdateChannel({ queueMode: 'control' }, currentChannelId, serverId);
                                handleSendMessage(
                                  {
                                    type: 'info',
                                    content: '排麥模式已變更為控麥',
                                  },
                                  currentChannelId,
                                );
                              },
                            },
                          ],
                        },
                      ])
                    }
                  >
                    {channelVoiceMode === 'queue'
                      ? '排麥'
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
                        max="100"
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
