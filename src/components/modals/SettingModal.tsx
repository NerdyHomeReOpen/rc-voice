/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { version } from '../../../package.json';

// CSS
import EditServer from '@/styles/popups/editServer.module.css';
import Popup from '@/styles/common/popup.module.css';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import ipcService from '@/services/ipc.service';

const SettingModal: React.FC = React.memo(() => {
  // Hooks
  const lang = useLanguage();

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(false);
  const [startMinimized, setStartMinimized] = useState<boolean>(false);
  const [notificationSound, setNotificationSound] = useState<boolean>(true);

  useEffect(() => {
    ipcService.autoLaunch.get(setAutoLaunch);
  }, []);

  const handleAutoLaunchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setAutoLaunch(enabled);
    ipcService.autoLaunch.set(enabled);
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  useEffect(() => {
    // 獲取已保存的音訊設備設定
    ipcService.audio.get((devices) => {
      // 如果有保存的設定就使用保存的設定，否則使用默認裝置
      setSelectedInput(devices.input || '');
      setSelectedOutput(devices.output || '');
    });

    // 獲取可用的音訊設備
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    });
  }, []);

  useEffect(() => {
    if (selectedInput) {
      navigator.mediaDevices
        .getUserMedia({ audio: { deviceId: selectedInput } })
        .then((stream) => {
          console.log('使用選擇的輸入裝置:', selectedInput);
          // 這裡可以將 stream 傳遞給音訊處理的邏輯
        })
        .catch((err) => console.error('無法存取麥克風', err));
    }
  }, [selectedInput]);

  const handleConfirm = () => {
    // 保存設定
    ipcService.autoLaunch.set(autoLaunch);
    handleClose();
  };

  // 處理輸入設備變更
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedInput(deviceId);
    ipcService.audio.set(deviceId, 'input');
  };

  // 處理輸出設備變更
  const handleOutputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedOutput(deviceId);
    ipcService.audio.set(deviceId, 'output');
  };

  return (
    <div className={Popup['popupContainer']}>
      <div className={Popup['popupBody']}>
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
          {/* Left Sidebar */}
          <div className={EditServer['left']}>
            <div className={EditServer['tabs']}>
              {[
                lang.tr.basicSettings,
                lang.tr.voiceSettings,
                lang.tr.aboutUs,
              ].map((title, index) => (
                <div
                  className={`${EditServer['item']} ${
                    activeTabIndex === index ? EditServer['active'] : ''
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                  key={index}
                >
                  {title}
                </div>
              ))}
            </div>
          </div>
          {/* Right Content */}
          <div className={EditServer['right']}>
            <div className={EditServer['body']}>
              {activeTabIndex === 0 ? (
                <>
                  <div
                    className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                  >
                    <div className={Popup['label']}>
                      {lang.tr.generalSettings}
                    </div>
                    <div
                      className={`${Popup['inputBox']} ${Popup['col']}`}
                      style={{ gap: '16px', padding: '20px' }}
                    >
                      {/* Auto Startup */}
                      <div
                        className={`${Popup['row']}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.autoStartup}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {lang.tr.autoStartupDescription}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoLaunch}
                            onChange={handleAutoLaunchChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      {/* Minimize to Tray (Not implemented) */}
                      <div
                        className={`${Popup['row']}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.minimizeToTray} (Not implemented)
                          </div>
                          <div className="text-gray-500 text-sm">
                            {lang.tr.minimizeToTrayDescription}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={minimizeToTray}
                            onChange={(e) =>
                              setMinimizeToTray(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      {/* Start Minimized (Not implemented) */}
                      <div
                        className={`${Popup['row']}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.startMinimized} (Not implemented)
                          </div>
                          <div className="text-gray-500 text-sm">
                            {lang.tr.startMinimizedDescription}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={startMinimized}
                            onChange={(e) =>
                              setStartMinimized(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      {/* Notification Sound (Not implemented) */}
                      <div
                        className={`${Popup['row']}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.notificationSound} (Not implemented)
                          </div>
                          <div className="text-gray-500 text-sm">
                            {lang.tr.notificationSoundDescription}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSound}
                            onChange={(e) =>
                              setNotificationSound(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTabIndex === 1 ? (
                <>
                  <div
                    className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                  >
                    <div className={Popup['label']}>
                      {lang.tr.voiceSettings}
                    </div>
                    <div
                      className={`${Popup['inputBox']} ${Popup['col']}`}
                      style={{ gap: '20px', padding: '20px' }}
                    >
                      <div style={{ width: '100%' }}>
                        <div className={`${Popup['label']} mb-2`}>
                          {lang.tr.inputDevice}
                        </div>
                        <select
                          className={`${Popup['select']} w-full p-2 rounded border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors`}
                          value={selectedInput}
                          onChange={handleInputChange}
                        >
                          <option value="">
                            {lang.tr.defaultMicrophone} (
                            {inputDevices[0]?.label || lang.tr.unknownDevice})
                          </option>
                          {inputDevices.map((device) => (
                            <option
                              key={device.deviceId}
                              value={device.deviceId}
                            >
                              {device.label ||
                                `${lang.tr.microphone} ${
                                  inputDevices.indexOf(device) + 1
                                }`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '100%' }}>
                        <div className={`${Popup['label']} mb-2`}>
                          {lang.tr.outputDevice}
                        </div>
                        <select
                          className={`${Popup['select']} w-full p-2 rounded border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors`}
                          value={selectedOutput}
                          onChange={handleOutputChange}
                        >
                          <option value="">
                            {lang.tr.defaultSpeaker} (
                            {outputDevices[0]?.label || lang.tr.unknownDevice})
                          </option>
                          {outputDevices.map((device) => (
                            <option
                              key={device.deviceId}
                              value={device.deviceId}
                            >
                              {device.label ||
                                `${lang.tr.speaker} ${
                                  outputDevices.indexOf(device) + 1
                                }`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTabIndex === 2 ? (
                <>
                  <div
                    className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                  >
                    <div className={Popup['label']}>{lang.tr.aboutUs}</div>
                    <div
                      className={`${Popup['inputBox']} ${Popup['col']}`}
                      style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '20px 20px 100px 20px',
                        gap: '24px',
                      }}
                    >
                      <div className={Popup['row']}>
                        <div className={Popup['label']}>{lang.tr.version}</div>
                        <div className={Popup['value']}>v{version}</div>
                      </div>

                      <div className={Popup['row']}>
                        <div className={Popup['label']}>
                          {lang.tr.projectRepo} {lang.tr.projectRepoDescription}
                        </div>
                        <div className={Popup['value']}>
                          <div
                            onClick={() =>
                              ipcService.window.openExternal(
                                'https://github.com/NerdyHomeReOpen/RiceCall',
                              )
                            }
                            className="text-blue-500 hover:text-blue-700 transition-colors hover:underline cursor-pointer"
                          >
                            RiceCall
                          </div>
                        </div>
                      </div>

                      <div className={`${Popup['row']} flex-col items-start`}>
                        <div className={`${Popup['label']} mb-3`}>
                          {lang.tr.developmentTeam}
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {[
                            {
                              name: '🤓 NerdyHomeReOpen',
                              role: lang.tr.mainDeveloper,
                              github: 'https://github.com/NerdyHomeReOpen',
                            },
                            {
                              name: '🤓 JoshHuang9508',
                              role: lang.tr.mainDeveloper,
                              github: 'https://github.com/JoshHuang9508',
                            },
                            {
                              name: '🤓 yeci226',
                              role: lang.tr.mainDeveloper,
                              github: 'https://github.com/yeci226',
                            },
                            {
                              name: 'yayacat',
                              role: lang.tr.serverMaintainer,
                              github: 'https://github.com/yayacat',
                            },
                            {
                              name: 'cablate',
                              role: lang.tr.frontendDeveloper,
                              github: 'https://github.com/cablate',
                            },
                            {
                              name: 'cstrikeasia',
                              role: lang.tr.frontendDeveloper,
                              github: 'https://github.com/cstrikeasia',
                            },
                            {
                              name: 'lekoOwO',
                              role: lang.tr.backendDeveloper,
                              github: 'https://github.com/lekoOwO',
                            },
                            {
                              name: 'rytlebsk',
                              role: lang.tr.frontendDeveloper,
                              github: 'https://github.com/rytlebsk',
                            },
                          ].map((dev) => (
                            <div
                              key={dev.name}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div
                                onClick={() =>
                                  ipcService.window.openExternal(dev.github)
                                }
                                className="text-blue-500 hover:text-blue-700 transition-colors hover:underline cursor-pointer block mb-1"
                              >
                                {dev.name}
                              </div>
                              <span className="text-gray-600 text-sm block">
                                {dev.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${Popup['row']} mt-4 mb-2`}>
                        <div className={Popup['label']}>
                          {lang.tr.copyright}
                        </div>
                        <div className="text-gray-500 text-sm">
                          © {new Date().getFullYear()} NerdyHomeReOpen Team. All
                          rights reserved.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={Popup['popupFooter']}>
        <button className={Popup['button']} onClick={handleConfirm}>
          {lang.tr.confirm}
        </button>
        <button
          type="button"
          className={Popup['button']}
          onClick={() => handleClose()}
        >
          {lang.tr.cancel}
        </button>
      </div>
    </div>
  );
});

SettingModal.displayName = 'SettingModal';

export default SettingModal;
