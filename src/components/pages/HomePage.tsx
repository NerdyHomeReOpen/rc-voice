import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

// CSS
import homePage from '@/styles/homePage.module.css';

// Components
import ServerListViewer from '@/components/viewers/ServerListViewer';

// Type
import { PopupType, Server, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface HomePageProps {
  user: User;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user }) => {
  // Hooks
  const lang = useLanguage();
  const socket = useSocket();

  // Variables
  const userName = user.name;
  const userOwnedServers = user.ownedServers || [];
  const userRecentServers = user.recentServers || [];
  const userFavServers = user.favServers || [];

  // States
  const [searchResults, setSearchResults] = useState<Server[]>([]);

  // Handlers
  const handleSearchServer = (query: string) => {
    if (!socket) return;
    socket.send.searchServer({ query });
  };

  const handleServerSearch = (servers: Server[]) => {
    setSearchResults(servers);
  };

  const handleOpenCreateServerPopup = () => {
    ipcService.popup.open(PopupType.CREATE_SERVER);
    ipcService.initialData.onRequest(PopupType.CREATE_SERVER, { user: user });
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.SERVER_SEARCH]: handleServerSearch,
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
    if (!socket) return;
    socket.send.refreshUser(null);
  }, [socket]);

  useEffect(() => {
    if (!lang) return;
    ipcService.discord.updatePresence({
      details: lang.tr.RPCHomePage,
      state: `${lang.tr.RPCUser} ${userName}`,
      largeImageKey: 'app_icon',
      largeImageText: 'RC Voice',
      smallImageKey: 'home_icon',
      smallImageText: lang.tr.RPCHome,
      timestamp: Date.now(),
      buttons: [
        {
          label: lang.tr.RPCJoinServer,
          url: 'https://discord.gg/adCWzv6wwS',
        },
      ],
    });
  }, [lang, userName]);

  return (
    <div className={homePage['homeWrapper']}>
      {/* Header */}
      <header className={homePage['homeHeader']}>
        <div className={homePage['left']}>
          <div className={homePage['backBtn']} />
          <div className={homePage['forwardBtn']} />
          <div className={homePage['searchBar']}>
            <input
              type="search"
              placeholder={lang.tr.searchPlaceholder}
              data-placeholder="60021"
              className={homePage['searchInput']}
              onKeyDown={(e) => {
                if (e.key != 'Enter') return;
                if (e.currentTarget.value.trim() === '') return;
                handleSearchServer(e.currentTarget.value);
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
            {lang.tr.home}
          </button>
          <button className={homePage['navegateItem']} data-key="40007">
            <div></div>
            {lang.tr.game}
          </button>
          <button className={homePage['navegateItem']} data-key="30375">
            <div></div>
            {lang.tr.live}
          </button>
        </div>
        <div className={homePage['right']}>
          <button
            className={homePage['navegateItem']}
            data-key="30014"
            onClick={() => handleOpenCreateServerPopup()}
          >
            <div></div>
            {lang.tr.createGroup}
          </button>
          <button className={homePage['navegateItem']} data-key="60004">
            <div></div>
            {lang.tr.personalExclusive}
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
                  {lang.tr.recentVisits}
                </div>
                <ServerListViewer user={user} servers={searchResults} />
              </div>
            )}
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                {lang.tr.recentVisits}
              </div>
              <ServerListViewer user={user} servers={userRecentServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="30283">
                {lang.tr.myGroups}
              </div>
              <ServerListViewer user={user} servers={userOwnedServers} />
            </div>
            <div className={homePage['myGroupsItem']}>
              <div className={homePage['myGroupsTitle']} data-key="60005">
                {lang.tr.favoriteGroups}
              </div>
              <ServerListViewer user={user} servers={userFavServers} />
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
