import React, { useState } from 'react';
import { Minus, X, Minimize, Square } from 'lucide-react';

// CSS
import styles from '@/styles/home.module.css';

interface HeaderProps {
  children?: React.ReactNode;
  onClose?: () => void;
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

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={styles['header']}>
      {children}
      <div className={styles['buttons']}>
        <div className={styles['gift']} />
        <div className={styles['game']} />
        <div className={styles['notice']} />
        <div className={styles['spliter']} />
        <div className={styles['menu']} onClick={() => setShowMenu(!showMenu)}>
          <div
            className={`${styles['menuDropDown']} ${
              showMenu ? '' : styles['hidden']
            }`}
          >
            <div
              className={styles['menuOption']}
              data-type="system-setting"
              data-key="30066"
            >
              系統設定
            </div>
            <div
              className={styles['menuOption']}
              data-type="message-history"
              data-key="30136"
            >
              訊息紀錄
            </div>
            <div
              className={styles['menuOption']}
              data-type="change-theme"
              data-key="60028"
            >
              更換主題
            </div>
            <div
              className={styles['menuOption']}
              data-type="feed-back"
              data-key="30039"
            >
              意見反饋
            </div>
            <div
              className={`${styles['menuOption']} ${styles['hasSubmenu']}`}
              data-type="language-select"
            >
              <span data-key="30374">語言選擇</span>
              <div className={styles['submenu'] + ' hidden'}>
                <div className={styles['submenuOption']} data-lang="tw">
                  繁體中文
                </div>
                <div className={styles['submenuOption']} data-lang="cn">
                  简体中文
                </div>
                <div className={styles['submenuOption']} data-lang="en">
                  English
                </div>
                <div className={styles['submenuOption']} data-lang="jp">
                  日本語
                </div>
                <div className={styles['submenuOption']} data-lang="ru">
                  русский язык
                </div>
              </div>
            </div>
            <div
              className={styles['menuOption']}
              data-type="logout"
              data-key="30060"
            >
              登出
            </div>
            <div
              className={styles['menuOption']}
              data-type="exit"
              data-key="30061"
            >
              退出
            </div>
          </div>
        </div>
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
});

Header.displayName = 'Header';

export default Header;
