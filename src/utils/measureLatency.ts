import { API_URL } from '@/services/api.service';

export const measureLatency = async (): Promise<string> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const xhr = new XMLHttpRequest();

    xhr.onloadend = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((Date.now() - startTime).toString());
      } else {
        resolve('999');
      }
    };

    xhr.onerror = () => {
      resolve('999');
    };

    try {
      xhr.open('GET', API_URL);
      xhr.send();
    } catch {
      resolve('999');
    }

    // Set timeout to resolve after 5 seconds if no response
    setTimeout(() => resolve('999'), 5000);
  });
};
