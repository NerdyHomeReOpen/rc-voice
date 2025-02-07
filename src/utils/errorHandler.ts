export class AppError extends Error {
  constructor(
    message: string,
    public part: string = "UNKNOWN_PART",
    public tag: string = "UNKNOWN_ERROR",
    public status_code: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 先創起來放，錯誤統一管理
export const standardizedError = (error: unknown, part?:string, tag?:string): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, part, tag);
  }

  return new AppError("未知錯誤", "UNKNOWN_ERROR");
};
