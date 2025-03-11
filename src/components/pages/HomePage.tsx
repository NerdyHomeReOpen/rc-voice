/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// CSS
import homePage from '@/styles/homePage.module.css';

// Type
import { popupType, type Server, type User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// Components
import ServerListViewer from '../viewers/ServerListViewer';

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
    <div className={homePage['homeWrapper']}>
      <header className={homePage['homeHeader']}>
        <div className={homePage['left']}>
          <div className={homePage['backBtn']} />
          <div className={homePage['forwardBtn']} />
          <div className={homePage['searchBar']}>
            <input
              type="search"
              placeholder="輸入群ID或群名稱"
              data-placeholder="60021"
              className={homePage['searchInput']}
              onKeyDown={(e) => {
                if (e.key != 'Enter') return;
                if (e.currentTarget.value.trim() === '') return;
                handleSearch(e.currentTarget.value);
              }}
            />
            <div className={homePage['searchIcon']} />
          </div>
        </div>
        <div className={homePage['mid']}>
          <button
            className={`${homePage['navegateItem']} ${homePage['active']}`}
            data-key="60060"
          >
            <div></div>
            主頁
          </button>
          <button className={homePage['navegateItem']} data-key="40007">
            <div></div>
            遊戲
          </button>
          <button className={homePage['navegateItem']} data-key="30375">
            <div></div>
            秀場
          </button>
        </div>
        <div className={homePage['right']}>
          <button
            className={homePage['navegateItem']}
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
          <button className={homePage['navegateItem']} data-key="60004">
            <div></div>
            個人專屬
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className={homePage['myGroupsWrapper']}>
        <div className={homePage['myGroupsContain']}>
          <div className={homePage['myGroupsView']}>
            {searchResults.length > 0 && (
              <div className={homePage['myGroupsItem']}>
                <div className={homePage['myGroupsTitle']} data-key="60005">
                  搜尋結果
                </div>
                <ServerListViewer servers={searchResults} />
              </div>
            )}
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                最近訪問
              </div>
              <ServerListViewer servers={userRecentServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="30283">
                我的語音群
              </div>
              <ServerListViewer servers={userOwnedServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                收藏的語音群
              </div>
              <ServerListViewer servers={userFavServers} />
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
