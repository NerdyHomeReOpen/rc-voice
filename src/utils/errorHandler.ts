export class SocketError extends Error {
  constructor(
    message: string,
    public part: string = 'UNKNOWN_PART',
    public tag: string = 'UNKNOWN_ERROR',
    public status_code: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 先創起來放，錯誤統一管理
export const standardizedError = (
  error: unknown,
  part?: string,
  tag?: string,
): SocketError => {
  if (error instanceof SocketError) {
    return error;
  }

  if (error instanceof Error) {
    return new SocketError(error.message, part, tag);
  }

  return new SocketError('未知錯誤', 'UNKNOWN_ERROR');
};

export class errorHandler {
  private static logError(error: SocketError): void {
    alert(`${error.message}\n\nThe error at ${error.part} with tag ${error.tag}`);
    const situation = (() => {
      switch (error.status_code) {
        case 400:
          return 'request error';
        case 404:
          return 'not found';
        case 500:
          return 'internal server error';
        default:
          return 'unknown error';
      }
    })();
    console.error(
      `${error.message}:The error at ${error.part} with tag ${error.tag} is ${situation}`,
    );
  }
  public static ResponseError(error: SocketError): void {
    this.logError(error);
    errorHandler.handle();
    errorHandler.handle = () => {};
  }

  public static handle = () => {}; //外包函數
}
