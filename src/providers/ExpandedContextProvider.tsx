import { createContext, useContext, useRef } from 'react';

interface ExpandedContextType {
  setCategoryExpanded: React.RefObject<React.Dispatch<
    React.SetStateAction<boolean>
  > | null>;
  setChannelExpanded: React.RefObject<React.Dispatch<
    React.SetStateAction<boolean>
  > | null>;
}

const ExpandedContext = createContext<ExpandedContextType | null>(null);

export const useExpandedContext = () => {
  const context = useContext(ExpandedContext);
  if (!context) {
    throw new Error('useExpandedContext 必須在 ExpandedContext 內使用');
  }
  return context;
};

const ExpandedProvider = ({ children }: { children: React.ReactNode }) => {
  // Refs
  const setCategoryExpandedRef = useRef<React.Dispatch<
    React.SetStateAction<boolean>
  > | null>(null);
  const setChannelExpandedRef = useRef<React.Dispatch<
    React.SetStateAction<boolean>
  > | null>(null);

  return (
    <ExpandedContext.Provider
      value={{
        setCategoryExpanded: setCategoryExpandedRef,
        setChannelExpanded: setChannelExpandedRef,
      }}
    >
      {children}
    </ExpandedContext.Provider>
  );
};

ExpandedProvider.displayName = 'ExpandedProvider';

export default ExpandedProvider;
