/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import React, { useEffect, useState } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Pages
import LoginPage from '@/components/pages/LoginPage';
import RegisterPage from '@/components/pages/RegisterPage';

// Services
import { ipcService } from '@/services/ipc.service';
import authService from '@/services/auth.service';

const Header: React.FC = React.memo(() => {
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
      {/* Title */}
      <div className={`${header['titleBox']} ${header['big']}`}>
        <div className={header['appIcon']} />
      </div>
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

  // Wait socket is ready before auto login
  useEffect(() => {
    setTimeout(() => {
      authService.autoLogin();
    }, 500); // Can be change to when socket is onReady not just specific time
  }, []);

  return (
    <>
      {/* Top Navigation */}
      <Header />
      {/* Main Content */}
      <div className="content">
        {isLogin ? (
          <LoginPage
            onLoginSuccess={() => {}}
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
