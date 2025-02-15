import React, { useState } from 'react';
import { Minus, X, Minimize, Square } from 'lucide-react';

interface HeaderProps {
  onClose?: () => void;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = React.memo(({ onClose, children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  return (
    <div className="bg-blue-600 flex items-center justify-between text-white text-sm flex-none h-12 gap-3 min-w-max">
      {children}
      <div className="flex items-center space-x-2 min-w-max m-2">
        <button className="hover:bg-blue-700 p-2 rounded">
          <Minus size={16} />
        </button>
        <div
          className="hover:bg-blue-700 p-2 rounded"
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize size={16} /> : <Square size={16} />}
        </div>
        <button className="hover:bg-blue-700 p-2 rounded" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
