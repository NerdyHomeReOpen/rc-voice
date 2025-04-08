import React, { useCallback, useEffect, useState, useRef } from 'react';

// Types
import { PopupType, SocketServerEvent, User, Channel } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';
// import {CategoryTab} from '@/providers/'

// CSS
import serverPage from '@/styles/serverPage.module.css';
import popup from '@/styles/common/popup.module.css';
import changeChannelOrder from '@/styles/popups/changeChannelOrder.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

interface ChangeChannelOrderPopupProps {
  userId: string;
  serverId: string;
  channel: Channel;
  expanded: Record<string, boolean>;
}

const ChangeChannelOrderPopup: React.FC<ChangeChannelOrderPopupProps> =
  React.memo((initialData: ChangeChannelOrderPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshed = useRef(false);

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [channelList, setChannelList] = useState<Channel[]>();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [channelActiveId, setChannelActiveId] = useState<string | null>(null);

    // Variables
    const { userId, serverId } = initialData;

    const handleChannelListUpdate = (data: Channel[] | null): void => {
      if (!data) data = [];
      setChannelList(data);
    };

    useEffect(() => {
      if (!userId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        Promise.all([
          refreshService.serverChannels({
            serverId,
          }),
        ]).then(([userServers]) => {
          handleChannelListUpdate(userServers);
        });
      };
      refresh();
    }, [userId]);

    // Effect
    useEffect(() => {
      if (!channelList || !expanded) return;
      for (const channel of channelList) {
        setExpanded((prev) => ({
          ...prev,
          [channel.id]: true,
        }));
      }
    }, [channelList]);

    // Handlers
    const handleChangeChannelOrder = (searchQuery: string) => {
      if (!socket) return;
      socket.send.searchUser({ query: searchQuery });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const renderGroupedChannels = () => {
      if (!channelList) return null;

      const categories = channelList.filter(
        (c) => (c.type as string) === 'category',
      );
      const standaloneChannels = channelList.filter(
        (c) => c.type === 'channel' && !c.categoryId,
      );

      const renderChannel = (channel: Channel) => (
        <div
          key={channel.id}
          className={`${changeChannelOrder['changeOrderTab']} ${
            serverPage['channelTab']
          } ${
            (channel.type as string) === 'category'
              ? changeChannelOrder['categoryTab']
              : ''
          } ${channel.categoryId ? changeChannelOrder['changeOrderSub'] : ''} ${
            channelActiveId === channel.id
              ? changeChannelOrder['channelActive']
              : ''
          }`}
          onClick={() => setChannelActiveId(channel.id)}
        >
          <div
            className={`${serverPage['tabIcon']}
              ${expanded[channel.id] ? serverPage['expanded'] : ''}
              ${serverPage[channel.visibility]}
              ${channel.isLobby ? serverPage['lobby'] : ''}`}
          ></div>
          <div className={serverPage['channelTabLable']}>{channel.name}</div>
        </div>
      );

      return (
        <>
          {/* 非分類的 channel */}
          {standaloneChannels
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(renderChannel)}

          {/* 分類與其底下的頻道 */}
          {categories
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((category) => {
              const children = channelList
                .filter((c) => c.categoryId === category.id)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

              return (
                <div
                  key={category.id}
                  className={changeChannelOrder['categoryWrapper']}
                >
                  {/* 顯示分類本身 */}
                  {renderChannel(category)}

                  {/* 子頻道 */}
                  <div className={serverPage['channelList']}>
                    {children.map(renderChannel)}
                  </div>
                </div>
              );
            })}
        </>
      );
    };

    const channelListItem = (
      <div
        className={`${changeChannelOrder['changeOrderChannelList']} ${serverPage['channelList']}`}
      >
        {renderGroupedChannels()}
      </div>
    );

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={changeChannelOrder['body']}>
            <div className={changeChannelOrder['toolsBar']}>
              <div className={`${changeChannelOrder['addChannelBtn']}`}>
                新建
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['changeChannelNameBtn']}`}
              >
                改名
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['deleteChannelBtn']}`}
              >
                刪除
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['upChannelOrderBtn']}`}
              >
                上移
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['downChannelOrderBtn']}`}
              >
                下移
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['topChannelOrderBtn']}`}
              >
                置頂
              </div>
              <div
                className={`${changeChannelOrder['disabledBtn']} ${changeChannelOrder['bottomChannelOrderBtn']}`}
              >
                置底
              </div>
            </div>
            {channelListItem}
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !searchQuery.trim() ? popup['disabled'] : ''
            }`}
            disabled={!searchQuery.trim()}
            onClick={() => handleChangeChannelOrder(searchQuery)}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  });

ChangeChannelOrderPopup.displayName = 'ChangeChannelOrderPopup';

export default ChangeChannelOrderPopup;
