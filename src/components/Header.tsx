import React, { useState } from 'react';

// CSS
import styles from '@/styles/common/header.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

interface HeaderProps {
  title?: string;
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, onClose }) => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      ipcService.getAvailability()
        ? ipcService.window.maximize()
        : document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      ipcService.getAvailability()
        ? ipcService.window.unmaximize()
        : document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMinimize = () => {
    if (ipcService.getAvailability()) ipcService.window.minimize();
    else console.warn('IPC not available - not in Electron environment');
  };

  const handleClose = () => {
    if (ipcService.getAvailability()) ipcService.window.close();
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
