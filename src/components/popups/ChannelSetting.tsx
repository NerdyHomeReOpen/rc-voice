import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Types
import { Channel, Message, Server } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ChannelSettingPopupProps {
  serverId: string;
  channelId: string;
}

const ChannelSettingPopup: React.FC<ChannelSettingPopupProps> = React.memo(
  (initialData: ChannelSettingPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [channelName, setChannelName] = useState<Channel['name']>(
      createDefault.channel().name,
    );
    const [channelUserLimit, setChannelUserLimit] = useState<
      Channel['userLimit']
    >(createDefault.channel().userLimit);
    const [channelIsLobby, setChannelIsLobby] = useState<Channel['isLobby']>(
      createDefault.channel().isLobby,
    );
    const [channelVisibility, setChannelVisibility] = useState<
      Channel['visibility']
    >(createDefault.channel().visibility);
    const [channelOrder, setChannelOrder] = useState<Channel['order']>(
      createDefault.channel().order,
    );
    const [channelTextState, setChannelTextState] = useState<{
      current: Channel['chatMode'];
      original: Channel['chatMode'];
    }>({
      current: 'free',
      original: 'free',
    });
    const [channelVoiceState, setChannelVoiceState] = useState<{
      current: Channel['voiceMode'];
      original: Channel['voiceMode'];
    }>({
      current: 'free',
      original: 'free',
    });

    // Variables
    const { channelId, serverId } = initialData;

    // Handlers
    const handleUpdateChannel = (
      channel: Partial<Channel>,
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateChannel({ channel, channelId, serverId });
    };

    const handleSendMessage = (
      message: Partial<Message>,
      channelId: Channel['id'],
    ): void => {
      if (!socket) return;
      socket.send.message({ message, channelId });
    };

    const handleChannelUpdate = (data: Channel | null) => {
      if (!data) data = createDefault.channel();
      setChannelName(data.name);
      setChannelIsLobby(data.isLobby);
      setChannelVisibility(data.visibility);
      setChannelUserLimit(data.userLimit);
      const chatMode = data.chatMode || 'free';
      setChannelTextState({
        current: chatMode,
        original: chatMode,
      });
      const voiceMode = data.voiceMode || 'free';
      setChannelVoiceState({
        current: voiceMode,
        original: voiceMode,
      });
      setChannelOrder(data.order);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!channelId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const channel = await refreshService.channel({ channelId: channelId });
        handleChannelUpdate(channel);
      };
      refresh();
    }, [channelId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          {/* Left Sidebar */}
          <div className={setting['left']}>
            <div className={setting['tabs']}>
              {[
                lang.tr.basicInfo,
                lang.tr.channelAnnouncement,
                lang.tr.accessPermissions,
                lang.tr.speakingPermissions,
                lang.tr.textPermissions,
                lang.tr.channelManagement,
              ].map((title, index) => (
                <div
                  className={`${setting['item']} ${
                    activeTabIndex === index ? setting['active'] : ''
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                  key={index}
                >
                  {title}
                </div>
              ))}
            </div>
          </div>
          {/* Right Content */}
          <div className={setting['right']}>
            {activeTabIndex === 0 ? (
              <>
                <div className={popup['col']}>
                  <div className={popup['row']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>
                        {lang.tr.channelNameLabel}
                      </div>
                      <input
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                      />
                    </div>

                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>{lang.tr.userLimit}</div>
                      <input
                        type="number"
                        value={channelUserLimit}
                        disabled={
                          channelVisibility === 'readonly' || channelIsLobby
                        }
                        onChange={(e) =>
                          setChannelUserLimit(
                            Math.max(
                              0,
                              Math.min(999, parseInt(e.target.value) || 0),
                            ),
                          )
                        }
                      />
                    </div>

                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>
                        {lang.tr.channelOrder}
                      </div>
                      <input
                        type="number"
                        value={channelOrder}
                        min="-999"
                        max="999"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value || isNaN(parseInt(value)))
                            setChannelOrder(0);
                          else
                            setChannelOrder(
                              Math.max(-999, Math.min(999, parseInt(value))),
                            );
                        }}
                      />
                    </div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{lang.tr.channelMode}</div>
                    <div className={popup['selectBox']}>
                      <select
                        value={channelVoiceState.current}
                        onChange={(e) =>
                          setChannelVoiceState((prev) => ({
                            ...prev,
                            current: e.target.value as Channel['voiceMode'],
                          }))
                        }
                      >
                        <option value="free">{lang.tr.freeSpeech}</option>
                        <option value="forbidden">
                          {lang.tr.forbiddenSpeech}
                        </option>
                        <option value="queue">{lang.tr.queueSpeech}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className={setting['saperator']} />
                <div className={popup['col']}>
                  <div className={popup['label']}>
                    {lang.tr.channelAudioQuality}
                  </div>
                  <div className={popup['inputGroup']}>
                    <div
                      className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                    >
                      <input type="radio" name="voiceQuality" defaultChecked />
                      <div>
                        <label className={popup['label']}>
                          {lang.tr.chatMode}
                        </label>
                        <div className={popup['hint']}>
                          {lang.tr.chatModeDescription}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                    >
                      <input type="radio" name="voiceQuality" />
                      <div>
                        <label className={popup['label']}>
                          {lang.tr.entertainmentMode}
                        </label>
                        <div className={popup['hint']}>
                          {lang.tr.entertainmentModeDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTabIndex === 1 ? (
              <div className={popup['col']}>
                <div className={popup['label']}>
                  {lang.tr.inputAnnouncement}
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <textarea
                    style={{ minHeight: '200px' }}
                    // value={channelAnnouncement}
                    value={''}
                    // onChange={(e) => setChannelAnnouncement(e.target.value)}
                    onChange={() => {}}
                  />
                  <div className={popup['label']}>
                    {lang.tr.markdownSupport}
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 2 ? (
              <div className={popup['col']}>
                <label>{lang.tr.accessPermissions}</label>
                <div className={popup['inputGroup']}>
                  <div
                    className={`${popup['inputBox']} ${
                      channelIsLobby ? popup['disabled'] : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="voiceQuality"
                      checked={channelVisibility === 'public'}
                      onChange={() => {
                        setChannelVisibility('public');
                      }}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.channelPublic}
                      </label>
                    </div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${
                      channelIsLobby ? popup['disabled'] : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="voiceQuality"
                      checked={channelVisibility === 'member'}
                      onChange={() => {
                        setChannelVisibility('member');
                      }}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.channelMember}
                      </label>
                    </div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${
                      channelIsLobby ? popup['disabled'] : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="voiceQuality"
                      checked={channelVisibility === 'private'}
                      onChange={() => {
                        setChannelVisibility('private');
                      }}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.channelPrivate}
                      </label>
                    </div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${
                      channelIsLobby ? popup['disabled'] : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="voiceQuality"
                      checked={channelVisibility === 'readonly'}
                      onChange={() => {
                        setChannelVisibility('readonly');
                      }}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.channelReadonly}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 3 ? (
              <div className={popup['col']}>
                <label>{lang.tr.speakingPermissions}</label>
                <div className={popup['inputGroup']}>
                  <div className={`${popup['inputBox']} ${popup['disabled']}`}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.forbidGuestQueue}
                      </label>
                    </div>
                  </div>

                  <div className={`${popup['inputBox']} ${popup['disabled']}`}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <div>
                      <label className={popup['label']}>
                        {lang.tr.forbidGuestVoice}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 4 ? (
              <div className={popup['col']}>
                <label>{lang.tr.textPermissions}</label>
                <div className={popup['inputGroup']}>
                  <div className={popup['inputBox']}>
                    <input
                      type="checkbox"
                      checked={channelTextState.current == 'forbidden'}
                      onChange={(e) => {
                        const newMode = e.target.checked ? 'forbidden' : 'free';
                        setChannelTextState((prev) => ({
                          ...prev,
                          current: newMode,
                        }));
                      }}
                    />
                    <label className={popup['label']}>
                      {lang.tr.forbidOnlyAdminText}
                    </label>
                  </div>

                  <div className={`${popup['inputBox']} ${popup['disabled']}`}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <label className={popup['label']}>
                      {lang.tr.forbidGuestText}
                    </label>
                  </div>

                  <div className={`${popup['inputBox']} ${popup['disabled']}`}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                    />
                    <label className={popup['label']}>
                      {lang.tr.forbidGuestUrl}
                    </label>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                  >
                    <div className={popup['label']}>
                      {lang.tr.guestTextMaxLength}
                    </div>
                    <input
                      type="text"
                      value={0}
                      onChange={() => {}}
                      style={{ width: '60px' }}
                    />
                    <div className={popup['label']}>{lang.tr.characters}</div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                  >
                    <div className={popup['label']}>
                      {lang.tr.guestTextWaitTime}
                    </div>
                    <input
                      type="text"
                      value={0}
                      onChange={() => {}}
                      style={{ width: '60px' }}
                    />
                    <div className={popup['label']}>{lang.tr.seconds}</div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                  >
                    <div className={popup['label']}>
                      {lang.tr.guestTextInterval}
                    </div>
                    <input
                      type="text"
                      value={0}
                      onChange={() => {}}
                      style={{ width: '60px' }}
                    />
                    <div className={popup['label']}>{lang.tr.seconds}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            onClick={() => {
              if (channelTextState.current !== channelTextState.original) {
                handleSendMessage(
                  {
                    type: 'info',
                    content:
                      channelTextState.current === 'free'
                        ? 'TEXT_CHANGE_TO_FREE_SPEECH'
                        : 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH',
                    timestamp: 0,
                  },
                  channelId,
                );
              }

              if (channelVoiceState.current !== channelVoiceState.original) {
                handleSendMessage(
                  {
                    type: 'info',
                    content:
                      channelVoiceState.current === 'queue'
                        ? 'VOICE_CHANGE_TO_QUEUE'
                        : channelVoiceState.current === 'forbidden'
                        ? 'VOICE_CHANGE_TO_FORBIDDEN_SPEECH'
                        : 'VOICE_CHANGE_TO_FREE_SPEECH',
                    timestamp: 0,
                  },
                  channelId,
                );
              }

              handleUpdateChannel(
                {
                  name: channelName,
                  visibility: channelVisibility,
                  userLimit: channelUserLimit,
                  chatMode: channelTextState.current,
                  voiceMode: channelVoiceState.current,
                  order: channelOrder,
                },
                channelId,
                serverId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button
            type="button"
            className={popup['button']}
            onClick={() => handleClose()}
          >
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ChannelSettingPopup.displayName = 'ChannelSettingPopup';

export default ChannelSettingPopup;
