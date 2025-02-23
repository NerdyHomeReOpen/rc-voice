export {};

declare global {
  interface Window {
    electron?: {
        openPopup: (page: string) => void
        openWindow: (page: string) => void
        close: () => void
        minimize: () => void
        reload: () => void,
    };
  }
}
