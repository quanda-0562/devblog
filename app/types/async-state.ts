/** Kiểm tra status trước khi đọc data hoặc error để TypeScript narrowing. */
export type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
