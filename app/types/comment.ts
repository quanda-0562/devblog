import type { Author } from "./author";
import type { Post } from "./post";

export type Comment = {
  id: number;
  postId: Post["id"];
  author: Author;
  content: string;
  /** Chuỗi ngày giờ ISO 8601. */
  createdAt: string;
};
