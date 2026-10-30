import type { AsyncState, Author, Comment, Post } from "../../app/types";
import type { fetchPost, fetchPosts, Post as ClientPost } from "../../app/api/client";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
export type DomainChecks = [
  Assert<Equal<ReturnType<typeof fetchPosts>, Promise<Post[]>>>,
  Assert<Equal<ReturnType<typeof fetchPost>, Promise<Post>>>,
  Assert<Equal<Post["author"], Author>>,
  Assert<Equal<Comment["author"], Author>>,
  Assert<Equal<Comment["postId"], Post["id"]>>,
  Assert<Equal<ClientPost, Post>>,
];

// Chỉ kiểm tra bằng tsc, không thực thi các ví dụ cố ý sai.
export function checkAsyncState(state: AsyncState<Post[]>) {
  switch (state.status) {
    case "loading":
      // @ts-expect-error Nhánh loading không chứa data.
      return state.data;
    case "success":
      state.data.map((post) => post.author.name);
      // @ts-expect-error Nhánh success không chứa error.
      return state.error;
    case "error":
      state.error.message.toUpperCase();
      // @ts-expect-error Nhánh error không chứa data.
      return state.data;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

export function checkInvalidDomainValues() {
  const loading: AsyncState<Post[]> = { status: "loading" };
  const success: AsyncState<Post[]> = { status: "success", data: [] };
  const failure: AsyncState<Post[]> = { status: "error", error: new Error("Không tải được") };
  // @ts-expect-error Success bắt buộc có data.
  const missingData: AsyncState<Post[]> = { status: "success" };
  // @ts-expect-error Data phải đúng kiểu generic.
  const wrongData: AsyncState<Post[]> = { status: "success", data: "posts" };
  // @ts-expect-error Error bắt buộc có error.
  const missingError: AsyncState<Post[]> = { status: "error" };
  // @ts-expect-error error phải là Error, không phải string.
  const wrongError: AsyncState<Post[]> = { status: "error", error: "Lỗi" };
  // @ts-expect-error Post.author đã chuyển sang domain Author.
  const wrongAuthor: Post["author"] = "Nguyễn An";
  void [loading, success, failure, missingData, wrongData, missingError, wrongError, wrongAuthor];
}
