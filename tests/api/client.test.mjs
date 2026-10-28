import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, fetchPost, fetchPosts } from "../../app/api/client.ts";

test("fetchPosts và fetchPost trả Promise, danh sách và chi tiết nhất quán", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const listPromise = fetchPosts();
  const postPromise = fetchPost(1);
  assert.ok(listPromise instanceof Promise);
  assert.ok(postPromise instanceof Promise);
  t.mock.timers.tick(400);
  const [posts, post] = await Promise.all([listPromise, postPromise]);
  assert.equal(posts.length, 3);
  assert.deepEqual(post, posts.find((item) => item.id === 1));
  assert.ok(post.title && post.content && post.slug && post.author);
  assert.ok(Number.isFinite(Date.parse(post.publishedAt)));
});

test("sửa dữ liệu trả về không thay đổi dữ liệu gốc", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const first = fetchPosts();
  t.mock.timers.tick(400);
  const posts = await first;
  const originalTitle = posts[0].title;
  posts[0].title = "Đã sửa";
  posts.pop();
  const second = fetchPost(1);
  t.mock.timers.tick(400);
  const post = await second;
  assert.equal(post.title, originalTitle);
  post.title = "Sửa chi tiết";
  const third = fetchPosts();
  t.mock.timers.tick(400);
  const fresh = await third;
  assert.equal(fresh.length, 3);
  assert.equal(fresh[0].title, originalTitle);
});

test("ID không hợp lệ và không tồn tại trả ApiError có code/status", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const invalid = [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1"];
  const checks = invalid.map((id) => assert.rejects(fetchPost(id), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, "INVALID_ID");
    assert.equal(error.status, 400);
    return true;
  }));
  checks.push(assert.rejects(fetchPost(999), { name: "ApiError", code: "NOT_FOUND", status: 404 }));
  t.mock.timers.tick(400);
  await Promise.all(checks);
});

test("signal hủy sẵn được reject ngay và giữ nguyên reason", async () => {
  const controller = new AbortController();
  const reason = new Error("Không còn cần kết quả");
  controller.abort(reason);
  await assert.rejects(fetchPosts({ signal: controller.signal }), (error) => error === reason);
  await assert.rejects(fetchPost(1, { signal: controller.signal }), (error) => error === reason);
});

test("hủy khi đang chờ; request khác vẫn hoàn tất", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const checks = [
    assert.rejects(fetchPosts(options), { name: "AbortError" }),
    assert.rejects(fetchPost(1, options), { name: "AbortError" }),
  ];
  const independent = fetchPosts();
  t.mock.timers.tick(100);
  controller.abort();
  await Promise.all(checks);
  t.mock.timers.tick(300);
  assert.equal((await independent).length, 3);
});

test("hủy ngay sau khi timer xong vẫn ngăn trả dữ liệu cũ", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const controller = new AbortController();
  const check = assert.rejects(fetchPosts({ signal: controller.signal }), { name: "AbortError" });
  t.mock.timers.tick(400);
  controller.abort();
  await check;
});
