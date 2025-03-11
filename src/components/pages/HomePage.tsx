/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/homePage.module.css';

// Type
import { popupType, type Server, type User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// ServerCard Component
interface ServerCardProps {
  server: Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  // Redux
  const user = useSelector((state: { user: User | null }) => state.user);

  // Socket Control
  const socket = useSocket();

  const handleServerSelect = (serverId: string) => {
    socket?.send.connectServer({ serverId });
  };

  // Variables
  const serverAvatar = server?.avatar || '/logo_server_def.png';
  const serverName = server.name ?? '';
  const serverDisplayId = server.displayId ?? '';
  const serverSlogan = server.slogan ?? '';

  return (
    <>
      <div
        className={styles['myGroupsRoomItemBox']}
        onClick={() => handleServerSelect(server.id)}
      >
        <div
          className={styles['myGroupsRoomAvatarPicture']}
          style={{
            backgroundImage: `url(${serverAvatar})`,
            backgroundSize: 'cover',
            backgroundPosition: '0 0',
          }}
        ></div>
        <div className={styles['myGroupsRoomInfo']}>
          <div className={styles['myGroupsRoomName']}>{serverName}</div>
          <div className={styles['myGroupsRoomIDBox']}>
            <div
              className={`${styles['myGroupsRoomIDTitle']} ${
                server.ownerId === user?.id ? styles['IsOwner'] : ''
              }`}
              data-key="10063"
            >
              ID:
            </div>
            <div className={styles['myGroupsRoomID']}>{serverDisplayId}</div>
          </div>
          <div className={styles['myGroupsRoomSlogen']}>{serverSlogan}</div>
        </div>
      </div>
    </>
  );
});

ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerGridProps {
  servers: Server[];
}

const ServerGrid: React.FC<ServerGridProps> = React.memo(({ servers }) => {
  return (
    <div className={styles['myGroupsRoomItems']}>
      {servers.map(
        (server) => server && <ServerCard key={server?.id} server={server} />,
      )}
    </div>
  );
});

ServerGrid.displayName = 'ServerGrid';

const HomePageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User | null }) => state.user);

  // Variables
  const userName = user?.name || 'Unknown';
  const userOwnedServers = user?.ownedServers || [];
  const userRecentServers = user?.recentServers || [];
  const userFavServers = user?.favServers || [];

  // Socket Control
  const socket = useSocket();

  const handleSearch = (query: string) => {
    socket?.send.searchServer({ query });
    socket?.on.serverSearch((results: Server[]) => {
      setSearchResults(results);
    });
  };

  // Search Results Control
  const [searchResults, setSearchResults] = useState<Server[]>([]);

  // Update Discord Presence
  useEffect(() => {
    ipcService.discord.updatePresence({
      details: `正在瀏覽主頁`,
      state: `使用者: ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: '主頁',
      timestamp: Date.now(),
      buttons: [
        {
          label: '加入我們的Discord伺服器',
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, []);

  // Refresh User
  useEffect(() => {
    socket?.send.refreshUser(null);
  }, []);

  return (
    <div className={styles['homeWrapper']}>
      <header className={styles['homeHeader']}>
        <div className={styles['left']}>
          <div className={styles['backBtn']} />
          <div className={styles['forwardBtn']} />
          <div className={styles['searchBar']}>
            <input
              type="search"
              placeholder="輸入群ID或群名稱"
              data-placeholder="60021"
              className={styles['searchInput']}
              onKeyDown={(e) => {
                if (e.key != 'Enter') return;
                if (e.currentTarget.value.trim() === '') return;
                handleSearch(e.currentTarget.value);
              }}
            />
            <div className={styles['searchIcon']} />
          </div>
        </div>
        <div className={styles['mid']}>
          <button
            className={`${styles['navegateItem']} ${styles['active']}`}
            data-key="60060"
          >
            <div></div>
            主頁
          </button>
          <button className={styles['navegateItem']} data-key="40007">
            <div></div>
            遊戲
          </button>
          <button className={styles['navegateItem']} data-key="30375">
            <div></div>
            秀場
          </button>
        </div>
        <div className={styles['right']}>
          <button
            className={styles['navegateItem']}
            data-key="30014"
            onClick={() => {
              ipcService.popup.open(popupType.CREATE_SERVER, 407, 550);
              ipcService.initialData.onRequest(popupType.CREATE_SERVER, {
                user: user,
              });
            }}
          >
            <div></div>
            創建語音群
          </button>
          <button className={styles['navegateItem']} data-key="60004">
            <div></div>
            個人專屬
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className={styles['myGroupsWrapper']}>
        <div className={styles['myGroupsContain']}>
          <div className={styles['myGroupsView']}>
            {searchResults.length > 0 && (
              <div className={styles['myGroupsItem']}>
                <div className={styles['myGroupsTitle']} data-key="60005">
                  搜尋結果
                </div>
                <ServerGrid servers={searchResults} />
              </div>
            )}
            <div className={styles['myGroupsItem']}>
              <div className={styles['myGroupsTitle']} data-key="60005">
                最近訪問
              </div>
              <ServerGrid servers={userRecentServers} />
            </div>
            <div className={styles['myGroupsItem']}>
              <div className={styles['myGroupsTitle']} data-key="30283">
                我的語音群
              </div>
              <ServerGrid servers={userOwnedServers} />
            </div>
            <div className={styles['myGroupsItem']}>
              <div className={styles['myGroupsTitle']} data-key="60005">
                收藏的語音群
              </div>
              <ServerGrid servers={userFavServers} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
