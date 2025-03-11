import { ipcService } from '@/services/ipc.service';
import { popupType } from '@/types';

export class StandardizedError extends Error {
  constructor(
    message: string,
    public name: string = 'Error',
    public part: string = 'UNKNOWN_PART',
    public tag: string = 'UNKNOWN_ERROR',
    public status_code: number = 500,
    public handler: () => void = () => {},
  ) {
    super(message);
  }
}

export class errorHandler {
  error: StandardizedError;

  constructor(error: StandardizedError) {
    this.error = error;
  }

  show() {
    const errorMessage = `[錯誤][${this.error.tag}] ${this.error.message}，錯誤代碼: ${this.error.status_code} (${this.error.part})`;

    ipcService.popup.open(popupType.DIALOG, 207, 412);
    ipcService.popup.onSubmit('error', () => {
      this.error.handler();
      console.log('Error handled.');
    });
    ipcService.initialData.onRequest(popupType.DIALOG, {
      iconType: 'error',
      title: errorMessage,
      submitTo: 'error',
    });
  }
}
