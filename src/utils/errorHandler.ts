export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 先創起來放，錯誤統一管理
export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR");
  }

  return new AppError("未知錯誤", "UNKNOWN_ERROR");
};

//錯誤處理介面
export class ResponseError {
  constructor(
    private error: unknown,
    private externalErrorHandleMethod: () => void
  ) {
    const _error = handleError(this.error);
    alert(_error.message);
    this.externalErrorHandleMethod();
  }
}