import { createContext, useContext, useRef } from 'react';

interface ExpandedContextType {
  setCategoryExpanded: React.RefObject<() => void>;
  setChannelExpanded: React.RefObject<() => void>;
  handleSetCategoryExpanded: () => void;
  handleSetChannelExpanded: () => void;
}

const ExpandedContext = createContext<ExpandedContextType | null>(null);

export const useExpandedContext = () => {
  const context = useContext(ExpandedContext);
  if (!context) {
    throw new Error(
      'useExpandedContext must be used within an ExpandedProvider',
    );
  }
  return context;
};

const ExpandedProvider = ({ children }: { children: React.ReactNode }) => {
  // Refs
  const setCategoryExpanded = useRef<() => void>(() => {});
  const setChannelExpanded = useRef<() => void>(() => {});

  // Handlers
  const handleSetCategoryExpanded = () => setCategoryExpanded.current();
  const handleSetChannelExpanded = () => setChannelExpanded.current();

  return (
    <ExpandedContext.Provider
      value={{
        setCategoryExpanded,
        setChannelExpanded,
        handleSetCategoryExpanded,
        handleSetChannelExpanded,
      }}
    >
      {children}
    </ExpandedContext.Provider>
  );
};

ExpandedProvider.displayName = 'ExpandedProvider';

export default ExpandedProvider;
