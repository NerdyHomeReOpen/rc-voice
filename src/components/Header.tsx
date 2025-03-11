/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

interface TitleType {
  title?: string;
  button?: Array<string>;
}

interface HeaderProps {
  title?: TitleType;
}

const Header: React.FC<HeaderProps> = React.memo(({ title }) => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    isFullscreen
      ? ipcService.window.unmaximize()
      : ipcService.window.maximize();
    setIsFullscreen(!isFullscreen);
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={header['header']}>
      <div className={header['titleBox']}>
        {title?.title && <span className={header['title']}>{title.title}</span>}
      </div>
      <div className={header['buttons']}>
        {title?.button?.includes('minimize') && (
          <div className={header['minimize']} onClick={handleMinimize} />
        )}
        {title?.button?.includes('maxsize') && (
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={handleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          />
        )}
        <div className={header['close']} onClick={handleClose} />
      </div>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
