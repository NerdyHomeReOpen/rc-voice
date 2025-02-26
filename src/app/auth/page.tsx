/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Pages
import LoginPage from '@/components/pages/LoginPage';
import RegisterPage from '@/components/pages/RegisterPage';

// Services
import { ipcService } from '@/services/ipc.service';

const Header: React.FC = React.memo(() => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
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
    <div className={`${header['header']}`}>
      {/* Title */}
      <div className={header['appIcon']} />
      {/* Buttons */}
      <div className={header['buttons']}>
        <div className={header['minimize']} onClick={handleMinimize} />
        <div
          className={isFullscreen ? header['restore'] : header['maxsize']}
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        />
        <div className={header['close']} onClick={handleClose} />
      </div>
    </div>
  );
});

Header.displayName = 'Header';

const Auth: React.FC = () => {
  // State
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const handleLogin = (sessionId: string) => {
    ipcService.auth.login(sessionId);
  };

  return (
    <>
      {/* Top Navigation */}
      <Header />
      {/* Main Content */}
      <div className="content">
        {isLogin ? (
          <LoginPage
            onLoginSuccess={(sessionId) => handleLogin(sessionId)}
            onRegisterClick={() => setIsLogin(false)}
          />
        ) : (
          <RegisterPage onRegisterSuccess={() => setIsLogin(true)} />
        )}
      </div>
    </>
  );
};

Auth.displayName = 'Auth';

export default Auth;
