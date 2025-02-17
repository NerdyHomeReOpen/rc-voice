import React, { useState } from 'react';

// CSS
import styles from '@/styles/home.module.css';

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ title, onClose, children }) => {
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
      <div className={styles['header']}>
        {title && <div className={styles['title']}>{title}</div>}
        <div className={styles['buttons']}>
          <div className={styles['minimize']} />
          <div
            className={isFullscreen ? styles['restore'] : styles['maxsize']}
            onClick={handleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          />
          <div className={styles['close']} onClick={onClose} />
        </div>
      </div>
    );
  },
);

Header.displayName = 'Header';

export default Header;
