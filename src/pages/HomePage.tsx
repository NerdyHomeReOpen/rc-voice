import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { searchServers, calculateSimilarity } from '@/utils/searchServers';

// Type
import type { ServerList, Server, User } from '@/types';

// Redux
import { useSelector } from 'react-redux';

// ServerCard Component
interface ServerCardProps {
  server: Server;
  onServerSelect: (serverId: string) => void;
}
const ServerCard: React.FC<ServerCardProps> = React.memo(
  ({ server, onServerSelect }) => (
    <button
      className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-white hover:bg-gray-50 w-full"
      onClick={() => onServerSelect(server.id)}
    >
      <img src="/logo_server_def.png" alt="" className="w-14 h-14 rounded" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-[#4A6B9D] text-start truncate">
          {server.name}
        </h3>
        <p className="text-xs text-gray-500 text-start">
          ID:{server.displayId}
        </p>
        {server.announcement && (
          <p className="text-xs text-gray-500 text-start truncate">
            {server.announcement}
          </p>
        )}
      </div>
    </button>
  ),
);
ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerGridProps {
  serverList: ServerList;
  onServerSelect: (serverId: string) => void;
}
const ServerGrid: React.FC<ServerGridProps> = React.memo(
  ({ serverList, onServerSelect }) => {
    console.log('serverList', serverList);
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Object.values(serverList).map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            onServerSelect={onServerSelect}
          />
        ))}
      </div>
    );
  },
);
ServerGrid.displayName = 'ServerGrid';

// Header Component
interface HeaderProps {
  onSearch: (query: string) => void;
  onCreateServer: () => void;
}
const Header: React.FC<HeaderProps> = React.memo(
  ({ onSearch, onCreateServer }) => (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-8 py-2">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <input
              type="text"
              placeholder="輸入群ID或群名稱"
              className="w-48 h-6 px-2 pr-8 border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none"
              onChange={(e) => onSearch(e.target.value)}
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex space-x-4 items-center">
          <button
            className="text-gray-600 hover:text-gray-900 text-sm"
            onClick={onCreateServer}
          >
            創建語音群
          </button>
        </div>
      </div>
    </header>
  ),
);
Header.displayName = 'Header';

// HomePage Component
interface HomePageProps {
  onSelectServer: (serverId: string) => void;
  onOpenCreateServer: () => void;
}
const HomePage: React.FC<HomePageProps> = React.memo(
  ({ onSelectServer, onOpenCreateServer }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const serverList = useSelector(
      (state: { serverList: ServerList }) => state.serverList,
    );

    // Search Control
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ServerList>({});

    useEffect(() => {
      if (searchQuery) {
        console.log('serverLis111t', serverList);
        const results = Object.values(serverList)
          .filter(
            (server) =>
              //TODO: id之後不支援
              server.id?.toString() === searchQuery.trim() ||
              server.displayId?.toString() === searchQuery.trim() ||
              server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              calculateSimilarity(
                server.name.toLowerCase(),
                searchQuery.toLowerCase(),
              ) > 0.6,
          )
          .sort((a, b) => {
            const simA = calculateSimilarity(
              a.name.toLowerCase(),
              searchQuery.toLowerCase(),
            );
            const simB = calculateSimilarity(
              b.name.toLowerCase(),
              searchQuery.toLowerCase(),
            );
            return simB - simA;
          })
          .reduce((acc, server) => {
            acc[server.id] = server;
            return acc;
          }, {} as ServerList);

        setSearchResults(results);
      }
    }, [searchQuery]);

    console.log('user', user);

    return (
      <div className="flex flex-1 flex-col">
        <Header
          onSearch={(query: string) => setSearchQuery(query)}
          onCreateServer={onOpenCreateServer}
        />

        <main className="flex flex-1 min-h-0 bg-gray-100">
          <div className="flex flex-1 flex-col item-center space-y-6 p-8 overflow-y-auto">
            {searchQuery ? (
              <section>
                <h2 className="text-lg font-bold mb-3">搜尋結果</h2>
                {Object.keys(searchResults).length > 0 ? (
                  <ServerGrid
                    serverList={searchResults}
                    onServerSelect={onSelectServer}
                  />
                ) : (
                  <div>
                    <p className="text-center text-gray-500 py-8">
                      沒有找到相關的語音群
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <>
                <section className="mb-6">
                  <h2 className="text-lg font-bold mb-3">推薦語音群</h2>
                  <ServerGrid
                    serverList={user.recommendedServers}
                    onServerSelect={onSelectServer}
                  />
                </section>

                <section>
                  <h2 className="text-lg font-bold mb-3">我的語音群</h2>
                  <ServerGrid
                    serverList={user.joinedServers}
                    onServerSelect={onSelectServer}
                  />
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    );
  },
);
HomePage.displayName = 'HomePage';

export default HomePage;
