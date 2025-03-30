import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// CSS
import homePage from '@/styles/homePage.module.css';

// Components
import ServerListViewer from '@/components/viewers/ServerList';

// Type
import {
  PopupType,
  Server,
  SocketServerEvent,
  User,
  ServerListSectionProps,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

interface HomePageProps {
  user: User;
  handleUserUpdate: (data: Partial<User> | null) => void;
}

const ServerListSection: React.FC<ServerListSectionProps> = ({
  title,
  servers,
  user,
}) => {
  const lang = useLanguage();

  const [expanded, setExpanded] = useState(false);

  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const hasMore = servers.length > 6;
  return (
    <div className={homePage['myGroupsItem']}>
      <div className={homePage['myGroupsTitle']}>{title}</div>
      <ServerListViewer user={user} servers={displayedServers} />
      {hasMore && (
        <button
          className={`
            ${homePage['viewMoreBtn']} 
            ${expanded ? homePage['more'] : homePage['less']}
          `}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? lang.tr.viewLess : lang.tr.viewMore}
        </button>
      )}
    </div>
  );
};

// 新增搜尋結果項目組件
const SearchResultItem: React.FC<{
  server: Server;
  onClick: () => void;
}> = ({ server, onClick }) => (
  <div className={homePage['dropdownItem']} onClick={onClick}>
    <div
      className={homePage['serverAvatar']}
      style={{
        backgroundImage: `url(${server.avatarUrl})`,
      }}
    />
    <div className={homePage['serverInfo']}>
      <div className={homePage['serverName']}>{server.name}</div>
      <div className={homePage['serverIdBox']}>
        <div className={homePage['idIcon']} />
        <div className={homePage['serverId']}>{server.displayId}</div>
      </div>
    </div>
  </div>
);

const HomePageComponent: React.FC<HomePageProps> = React.memo(
  ({ user, handleUserUpdate }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshed = useRef(false);

    // States
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const [exactMatch, setExactMatch] = useState<Server | null>(null);
    const [personalResults, setPersonalResults] = useState<Server[]>([]);
    const [relatedResults, setRelatedResults] = useState<Server[]>([]);

    // Variables
    const {
      id: userId,
      name: userName,
      ownedServers: userOwnedServers = [],
      recentServers: userRecentServers = [],
      favServers: userFavServers = [],
    } = user;

    // Handlers
    const handleSearchServer = (query: string) => {
      if (!socket || query.trim() === '') {
        setExactMatch(null);
        setPersonalResults([]);
        setRelatedResults([]);
        return;
      }
      socket.send.searchServer({ query });
      setSearchQuery(query);
    };

    const handleServerSearch = useCallback(
      (servers: Server[], query: string) => {
        if (!query.trim()) {
          setExactMatch(null);
          setPersonalResults([]);
          setRelatedResults([]);
          return;
        }

        setExactMatch(null);
        setPersonalResults([]);
        setRelatedResults([]);

        if (!servers.length) return;

        const exact = servers.find(
          (server) => server.displayId.toString() === query.trim(),
        );

        if (exact) setExactMatch(exact);

        const sortedServers = servers.sort((a, b) => {
          const aHasId = a.displayId.toString().includes(query.trim());
          const bHasId = b.displayId.toString().includes(query.trim());
          if (aHasId && !bHasId) return -1;
          if (!aHasId && bHasId) return 1;
          return 0;
        });

        const personal = sortedServers.filter(
          (server) =>
            userRecentServers.some((recent) => recent.id === server.id) ||
            userFavServers.some((fav) => fav.id === server.id) ||
            userOwnedServers.some((owned) => owned.id === server.id),
        );
        setPersonalResults(personal);

        const related = sortedServers
          .filter((server) => !personal.includes(server))
          .filter((server) => server.visibility !== 'invisible');
        setRelatedResults(related);
      },
      [
        userRecentServers,
        userFavServers,
        userOwnedServers,
        setExactMatch,
        setPersonalResults,
        setRelatedResults,
      ],
    );

    const handleOpenCreateServer = (userId: User['id']) => {
      ipcService.popup.open(PopupType.CREATE_SERVER);
      ipcService.initialData.onRequest(PopupType.CREATE_SERVER, { userId });
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.SERVER_SEARCH]: (servers: Server[]) =>
          handleServerSearch(servers, searchQuery),
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket, searchQuery, handleServerSearch]);

    useEffect(() => {
      if (!userId || refreshed.current) return;
      const refresh = async () => {
        refreshed.current = true;
        const user = await refreshService.user({ userId: userId });
        handleUserUpdate(user);
      };
      refresh();
    }, [userId, handleUserUpdate]);

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

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          searchRef.current &&
          !searchRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.addEventListener('mousedown', handleClickOutside);
    }, []);

    // 優化後的 renderSearchBar
    const renderSearchBar = () => {
      const handleServerConnect = (serverId: string) => {
        if (socket) {
          socket.send.connectServer({
            serverId,
            userId: user.id,
          });
        }
        setShowDropdown(false);
        setSearchQuery('');
      };

      const hasResults =
        exactMatch || personalResults.length > 0 || relatedResults.length > 0;

      return (
        <div className={homePage['searchBar']} ref={searchRef}>
          <input
            type="search"
            placeholder={lang.tr.searchPlaceholder}
            className={homePage['searchInput']}
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              handleSearchServer(value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && exactMatch) {
                handleServerConnect(exactMatch.id);
              }
            }}
            onFocus={() => setShowDropdown(true)}
          />

          {showDropdown && hasResults && (
            <div className={homePage['searchDropdown']}>
              {exactMatch && (
                <span className={homePage['dropdownHeaderText']}>
                  {lang.tr.quickEnterServer}
                  {exactMatch.displayId}
                </span>
              )}

              {personalResults.length > 0 && (
                <>
                  <div className={homePage['dropdownHeader']}>
                    <span>{lang.tr.personalExclusive}</span>
                  </div>
                  {personalResults.map((server) => (
                    <SearchResultItem
                      key={server.id}
                      server={server}
                      onClick={() => handleServerConnect(server.id)}
                    />
                  ))}
                </>
              )}

              {relatedResults.length > 0 && (
                <>
                  <div className={homePage['dropdownHeader']}>
                    <span>{lang.tr.relatedSearch}</span>
                  </div>
                  {relatedResults.map((server) => (
                    <SearchResultItem
                      key={server.id}
                      server={server}
                      onClick={() => handleServerConnect(server.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={homePage['homeWrapper']}>
        {/* Header */}
        <header className={homePage['homeHeader']}>
          <div className={homePage['left']}>
            <div className={homePage['backBtn']} />
            <div className={homePage['forwardBtn']} />
            {renderSearchBar()}
          </div>
          <div className={homePage['mid']}>
            <button
              className={`${homePage['navegateItem']} ${homePage['active']}`}
              data-key="60060"
            >
              {lang.tr.home}
            </button>
            <button className={homePage['navegateItem']} data-key="30014">
              {lang.tr.game}
            </button>
            <button className={homePage['navegateItem']} data-key="30375">
              {lang.tr.live}
            </button>
          </div>
          <div className={homePage['right']}>
            <button
              className={homePage['navegateItem']}
              data-key="30014"
              onClick={() => handleOpenCreateServer(userId)}
            >
              {lang.tr.createGroup}
            </button>
            <button className={homePage['navegateItem']} data-key="60004">
              {lang.tr.personalExclusive}
            </button>
          </div>
        </header>
        {/* Main Content */}
        <main className={homePage['myGroupsWrapper']}>
          <div className={homePage['myGroupsContain']}>
            <div className={homePage['myGroupsView']}>
              <ServerListSection
                title={lang.tr.recentVisits}
                servers={userRecentServers}
                user={user}
              />
              <ServerListSection
                title={lang.tr.myGroups}
                servers={userOwnedServers}
                user={user}
              />
              <ServerListSection
                title={lang.tr.favoriteGroups}
                servers={userFavServers}
                user={user}
              />
            </div>
          </div>
        </main>
      </div>
    );
  },
);

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
