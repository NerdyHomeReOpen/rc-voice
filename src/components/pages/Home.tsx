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
  UserServer,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

export interface ServerListSectionProps {
  title: string;
  servers: Server[];
  userId: string;
  onServerClick?: (server: Server) => void;
}

const ServerListSection: React.FC<ServerListSectionProps> = ({
  title,
  userId,
  servers,
  onServerClick,
}) => {
  // Hooks
  const lang = useLanguage();

  // States
  const [expanded, setExpanded] = useState(false);

  // Variables
  const displayedServers = expanded ? servers : servers.slice(0, 6);
  const canExpand = servers.length > 6;

  return (
    <div className={homePage['myGroupsItem']}>
      <div className={homePage['myGroupsTitle']}>{title}</div>
      <ServerListViewer
        userId={userId}
        servers={displayedServers}
        onServerClick={onServerClick}
      />
      {canExpand && (
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

interface HomePageProps {
  user: User;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ user }) => {
  // Hooks
  const lang = useLanguage();
  const socket = useSocket();

  // Refs
  const refreshed = useRef(false);

  // States
  const [userServers, setUserServers] = useState<UserServer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [exactMatch, setExactMatch] = useState<Server | null>(null);
  const [personalResults, setPersonalResults] = useState<Server[]>([]);
  const [relatedResults, setRelatedResults] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGroupID, setLoadingGroupID] = useState<string>();

  // Variables
  const { id: userId, name: userName } = user;
  const hasResults =
    exactMatch || personalResults.length > 0 || relatedResults.length > 0;

  // Handlers
  const handleUserServersUpdate = (data: UserServer[] | null) => {
    if (!data) data = [];
    setUserServers(data);
  };

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

  const handleConnectServer = (
    serverId: Server['id'],
    serverDisplayId: Server['displayId'],
  ) => {
    if (!socket) return;
    socket.send.connectServer({
      serverId,
      userId: userId,
    });
    setShowDropdown(false);
    setSearchQuery('');
    setIsLoading(true);
    setLoadingGroupID(serverDisplayId);
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
          userServers.some((s) => s.recent && s.id === server.id) ||
          userServers.some((s) => s.favorite && s.id === server.id) ||
          userServers.some((s) => s.owned && s.id === server.id),
      );
      setPersonalResults(personal);

      const related = sortedServers
        .filter((server) => !personal.includes(server))
        .filter((server) => server.visibility !== 'invisible');
      setRelatedResults(related);
    },
    [userServers, setExactMatch, setPersonalResults, setRelatedResults],
  );

  const handleOpenCreateServer = (userId: User['id']) => {
    ipcService.popup.open(PopupType.CREATE_SERVER);
    ipcService.initialData.onRequest(PopupType.CREATE_SERVER, { userId });
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  // Effects
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.addEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.SERVER_SEARCH]: (servers: Server[]) =>
        handleServerSearch(servers, searchQuery),
      [SocketServerEvent.USER_SERVERS_UPDATE]: handleUserServersUpdate,
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
      Promise.all([
        refreshService.userServers({
          userId: userId,
        }),
      ]).then(([userServers]) => {
        handleUserServersUpdate(userServers);
      });
    };
    refresh();
  }, [userId]);

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
                  handleConnectServer(exactMatch.id, exactMatch.displayId);
                }
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && hasResults && (
              <div className={homePage['searchDropdown']}>
                {exactMatch && (
                  <div className={homePage['dropdownHeaderText']}>
                    {lang.tr.quickEnterServer}
                    {exactMatch.displayId}
                  </div>
                )}

                {personalResults.length > 0 && (
                  <>
                    <div className={homePage['dropdownHeader']}>
                      <div>{lang.tr.personalExclusive}</div>
                    </div>
                    {personalResults.map((server) => (
                      <SearchResultItem
                        key={server.id}
                        server={server}
                        onClick={() =>
                          handleConnectServer(server.id, server.displayId)
                        }
                      />
                    ))}
                  </>
                )}

                {relatedResults.length > 0 && (
                  <>
                    <div className={homePage['dropdownHeader']}>
                      <div>{lang.tr.relatedSearch}</div>
                    </div>
                    {relatedResults.map((server) => (
                      <SearchResultItem
                        key={server.id}
                        server={server}
                        onClick={() =>
                          handleConnectServer(server.id, server.displayId)
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
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
              servers={userServers.filter((s) => s.recent)}
              userId={userId}
              onServerClick={(server) => {
                setIsLoading(true);
                setLoadingGroupID(server.displayId);
              }}
            />
            <ServerListSection
              title={lang.tr.myGroups}
              servers={userServers.filter((s) => s.owned)}
              userId={userId}
              onServerClick={(server) => {
                setIsLoading(true);
                setLoadingGroupID(server.displayId);
              }}
            />
            <ServerListSection
              title={lang.tr.favoriteGroups}
              servers={userServers.filter((s) => s.favorite)}
              userId={userId}
              onServerClick={(server) => {
                setIsLoading(true);
                setLoadingGroupID(server.displayId);
              }}
            />
          </div>
        </div>
      </main>
      {isLoading && (
        <div className={homePage['loadingWrapper']}>
          <div className={homePage['loadingBox']}>
            <div className={homePage['loadingTitleContain']}>
              <div>{lang.tr.connectingServer}</div>
              <div className={homePage['loadingGroupID']}>{loadingGroupID}</div>
            </div>
            <div className={homePage['loadingGif']}></div>
            <div
              className={homePage['loadingCloseBtn']}
              onClick={() => setIsLoading(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

// use dynamic import to disable SSR
const HomePage = dynamic(() => Promise.resolve(HomePageComponent), {
  ssr: false,
});

export default HomePage;
