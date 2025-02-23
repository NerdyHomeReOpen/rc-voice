import { electronService } from '@/services/electron.service';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

// CSS
import header from '@/styles/common/header.module.css';

// Pages
import LoginPage from '@/components/pages/LoginPage';
import RegisterPage from '@/components/pages/RegisterPage';

interface HeaderProps {
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ onClose }) => {
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

  const handleMinimize = () => {
    electronService.window.minimize();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      electronService.window.close();
    }
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
  // Redux
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // State
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const handleLogin = () => {
    if (sessionId) {
      console.log('Login Success');
    }
    window.location.href = '/';
  };

  return (
    <>
      {/* Top Navigation */}
      <Header />
      {/* Main Content */}
      <div className="content">
        {isLogin ? (
          <LoginPage
            onLoginSuccess={() => handleLogin()}
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
