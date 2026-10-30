import type { Author, Post } from "../types";

// Giữ đường dẫn import type cũ cho các bên đang sử dụng client.
export type { Post } from "../types";

export type RequestOptions = {
  signal?: AbortSignal;
};

export type ApiErrorCode = "INVALID_ID" | "NOT_FOUND" | "REQUEST_FAILED";

/** Lỗi API có mã ổn định để giao diện xử lý mà không phải so sánh message. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly cause: unknown;

  constructor(message: string, code: ApiErrorCode, status: number, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

const authors = {
  an: { id: 1, name: "Nguyễn An" },
  binh: { id: 2, name: "Trần Bình" },
} satisfies Record<string, Author>;

// Dữ liệu riêng của module; các hàm trả bản sao để bên gọi không sửa dữ liệu gốc.
const posts: Post[] = [
  {
    id: 1,
    slug: "javascript-event-loop",
    title: "Hiểu JavaScript event loop",
    excerpt: "Call stack, microtask và macrotask hoạt động như thế nào?",
    content: "JavaScript chạy mã đồng bộ trước, xử lý microtask rồi mới đến macrotask tiếp theo.",
    author: authors.an,
    publishedAt: "2026-10-26T02:00:00Z",
  },
  {
    id: 2,
    slug: "promise-combinators",
    title: "Promise.all và Promise.allSettled",
    excerpt: "Chọn cách phối hợp các tác vụ bất đồng bộ độc lập.",
    content: "Promise.all reject ngay khi một tác vụ lỗi. Promise.allSettled chờ tất cả và trả trạng thái từng tác vụ.",
    author: authors.binh,
    publishedAt: "2026-10-27T02:00:00Z",
  },
  {
    id: 3,
    slug: "abort-controller",
    title: "Hủy request bằng AbortController",
    excerpt: "Hủy request cũ khi tìm kiếm hoặc khi component unmount.",
    content: "Truyền signal vào tác vụ bất đồng bộ và gọi controller.abort() khi không còn cần kết quả.",
    author: authors.an,
    publishedAt: "2026-10-27T03:00:00Z",
  },
];

/** Giả lập độ trễ mạng; hủy cả timer và listener khi kết thúc. */
function wait(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, 400);

    function onAbort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(signal?.reason);
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function request<T>(read: () => T, { signal }: RequestOptions): Promise<T> {
  try {
    await wait(signal);
    // Bao phủ cả trường hợp abort sau khi timer resolve, trước khi tiếp tục await.
    signal?.throwIfAborted();
    return read();
  } catch (error) {
    // Giữ nguyên lý do hủy (mặc định là DOMException tên AbortError).
    if (signal?.aborted || error instanceof ApiError) throw error;
    throw new ApiError("Không thể tải dữ liệu. Vui lòng thử lại.", "REQUEST_FAILED", 500, error);
  }
}

/** Lấy danh sách bài viết. Hỗ trợ fetchPosts({ signal }). */
export function fetchPosts(options: RequestOptions = {}): Promise<Post[]> {
  return request(() => posts.map(copyPost), options);
}

function copyPost(post: Post): Post {
  return { ...post, author: { ...post.author } };
}

/** Lấy bài viết theo ID nguyên dương; reject ApiError nếu ID sai hoặc không có bài. */
export function fetchPost(id: number, options: RequestOptions = {}): Promise<Post> {
  return request(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ApiError("ID bài viết phải là số nguyên dương an toàn.", "INVALID_ID", 400);
    }
    const post = posts.find((item) => item.id === id);
    if (!post) {
      throw new ApiError(`Không tìm thấy bài viết có ID ${id}.`, "NOT_FOUND", 404);
    }
    return copyPost(post);
  }, options);
}
