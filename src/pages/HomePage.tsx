import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

// Components
import CreateServerModal from '@/modals/CreateServerModal';

// Utils
import { calculateSimilarity } from '@/utils/searchServers';

// Type
import type { Server, User } from '@/types';

// Redux
import { useSelector } from 'react-redux';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// ServerCard Component
interface ServerCardProps {
  server: Server;
}
const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  // Redux
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket Control
  const sokcet = useSocket();

  const handleServerSelect = (serverId: string) => {
    sokcet?.emit('connectServer', { serverId, sessionId });
  };

  return (
    <button
      className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-white hover:bg-gray-50 w-full"
      onClick={() => handleServerSelect(server.id)}
    >
      <img
        src={`${server.iconUrl ?? '/logo_server_def.png'}`}
        alt=""
        className="w-14 h-14 rounded"
      />
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
  );
});
ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerGridProps {
  servers: Server[];
}
const ServerGrid: React.FC<ServerGridProps> = React.memo(({ servers }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {servers?.map(
        (server) => server && <ServerCard key={server?.id} server={server} />,
      )}
    </div>
  );
});
ServerGrid.displayName = 'ServerGrid';

// Header Component
interface HeaderProps {
  onSearch: (query: string) => void;
}
const Header: React.FC<HeaderProps> = React.memo(({ onSearch }) => {
  // Create Server Modal Control
  const [showCreateServer, setShowCreateServer] = useState(false);

  const toggleCreateServer = (state?: boolean) =>
    setShowCreateServer(state ?? !showCreateServer);

  return (
    <>
      {showCreateServer && (
        <CreateServerModal onClose={() => toggleCreateServer(false)} />
      )}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-8 py-2">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <input
                type="text"
                placeholder="輸入群ID或群名稱"
                className="w-48 h-6 px-2 pr-8 border border-gray-200 rounded text-sm focus:border-blue-500 focus:outline-none select-none"
                onChange={(e) => onSearch(e.target.value)}
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex space-x-4 items-center">
            <button
              className="text-gray-600 hover:text-gray-900 text-sm select-none"
              onClick={() => toggleCreateServer()}
            >
              創建語音群
            </button>
          </div>
        </div>
      </header>
    </>
  );
});
Header.displayName = 'Header';

// HomePage Component
interface HomePageProps {}
const HomePage: React.FC<HomePageProps> = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Search Control
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Server[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const getResults = (servers: Server[]) => {
        return servers
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
          });
      };
      setSearchResults(
        getResults([
          ...(user.recommendedServers ?? []),
          ...(user.joinedServers ?? []),
        ]),
      );
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-1 flex-col">
      <Header onSearch={(query: string) => setSearchQuery(query)} />

      <main className="flex flex-1 min-h-0 bg-gray-100">
        <div className="flex flex-1 flex-col item-center space-y-6 p-8 overflow-y-auto">
          {searchQuery ? (
            <section>
              <h2 className="text-lg font-bold mb-3">搜尋結果</h2>
              {searchResults.length > 0 ? (
                <ServerGrid servers={searchResults || []} />
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
                <ServerGrid servers={user.recommendedServers || []} />
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">我的語音群</h2>
                <ServerGrid servers={user.joinedServers || []} />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
});
HomePage.displayName = 'HomePage';

export default HomePage;
