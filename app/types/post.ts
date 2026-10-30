import type { Author } from "./author";

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: Author;
  /** Chuỗi ngày giờ ISO 8601, thuận tiện truyền qua JSON. */
  publishedAt: string;
};
