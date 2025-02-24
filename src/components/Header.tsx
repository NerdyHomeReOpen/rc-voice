import React, { useState } from 'react';

// CSS
import styles from '@/styles/common/header.module.css';

// Services
import { electronService } from '@/services/electron.service';

interface HeaderProps {
  title?: string;
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, onClose }) => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      electronService.getAvailability()
        ? electronService.window.maximize()
        : document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      electronService.getAvailability()
        ? electronService.window.unmaximize()
        : document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMinimize = () => {
    if (electronService.getAvailability()) electronService.window.minimize();
    else console.warn('IPC not available - not in Electron environment');
  };

  const handleClose = () => {
    if (electronService.getAvailability()) electronService.window.close();
    else console.warn('IPC not available - not in Electron environment');
  };

  return (
    <div className={styles['header']}>
      {title && <div className={styles['title']}>{title}</div>}
      <div className={styles['buttons']}>
        <div className={styles['minimize']} onClick={handleMinimize} />
        <div
          className={isFullscreen ? styles['restore'] : styles['maxsize']}
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Restore' : 'Maximize'}
        />
        <div className={styles['close']} onClick={handleClose} />
      </div>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
