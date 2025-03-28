import React from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

enum DIALOG_ICON {
  ALERT = 'alert',
  ALERT2 = 'alert2',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

interface DialogProps {
  iconType: keyof typeof DIALOG_ICON;
  title: React.ReactNode;
  submitTo: string;
}

const Dialog: React.FC<DialogProps> = (initialData: DialogProps) => {
  // Hooks
  const lang = useLanguage();

  // Variables
  const { iconType, title, submitTo } = initialData;

  // Handlers
  const handleClose = () => {
    ipcService.window.close();
  };

  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  return (
    <div className={popup['popupContainer']}>
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={`${popup['inputGroup']} ${popup['dialogCenter']}`}>
            <div className={`${popup['inputBox']} ${popup['dialogContent']}`}>
              <div
                className={`${popup['dialogIcon']} ${
                  popup[DIALOG_ICON[iconType]]
                }`}
              />
              <div className={popup['label']}>{title}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={() => handleSubmit()}>
          {lang.tr.confirm}
        </button>
      </div>
    </div>
  );
};

Dialog.displayName = 'Dialog';

export default Dialog;
