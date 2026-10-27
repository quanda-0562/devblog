import assert from "node:assert/strict";
import { test } from "node:test";
import { debounce, throttle, formatDate } from "../../app/utils/index.js";

test("debounce chờ lần gọi cuối, giữ this và tham số, hỗ trợ cancel", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const owner = {
    name: "DevBlog",
    run: debounce(function (...args) {
      calls.push([this.name, ...args]);
    }, 100),
  };

  owner.run("cũ");
  t.mock.timers.tick(80);
  owner.run("mới", 2);
  t.mock.timers.tick(99);
  assert.deepEqual(calls, []);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, [["DevBlog", "mới", 2]]);

  owner.run("hủy");
  owner.run.cancel();
  t.mock.timers.tick(100);
  assert.equal(calls.length, 1);
  owner.run("chạy lại");
  t.mock.timers.tick(100);
  assert.equal(calls[1][1], "chạy lại");
});

test("các closure debounce hoạt động độc lập", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const a = debounce(() => calls.push("A"), 100);
  const b = debounce(() => calls.push("B"), 100);
  a();
  b();
  a.cancel();
  t.mock.timers.tick(100);
  assert.deepEqual(calls, ["B"]);
});

test("throttle chạy đầu khoảng chờ, giữ this, bỏ lần gọi sau và không chạy bù", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const owner = {
    name: "DevBlog",
    run: throttle(function (value) {
      calls.push([this.name, value]);
      return value;
    }, 100),
  };
  assert.equal(owner.run(1), 1);
  t.mock.timers.tick(99);
  assert.equal(owner.run(2), undefined);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, [["DevBlog", 1]]);
  owner.run(3);
  assert.equal(calls.length, 2);
  owner.run.cancel();
  owner.run(4);
  assert.equal(calls.length, 3);
});

test("các closure throttle độc lập; wait bằng 0 vẫn mở khóa ở timer tiếp theo", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let count = 0;
  const a = throttle(() => count++, 0);
  const b = throttle(() => count++, 100);
  a();
  a();
  b();
  assert.equal(count, 2);
  t.mock.timers.tick(1);
  a();
  assert.equal(count, 3);
});

test("formatDate nhận Date, ISO, timestamp; cho phép đổi locale và múi giờ", () => {
  const iso = "2026-10-26T18:00:00Z";
  const date = new Date(iso);
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  assert.equal(formatDate(iso, options), "27/10/2026");
  assert.equal(formatDate(date, options), "27/10/2026");
  assert.equal(formatDate(date.getTime(), options), "27/10/2026");
  assert.equal(formatDate(iso, { ...options, timeZone: "UTC" }, "en-US"), "10/26/2026");
  assert.equal(date.toISOString(), "2026-10-26T18:00:00.000Z");
});

test("từ chối callback, thời gian chờ và ngày không hợp lệ", () => {
  for (const wrap of [debounce, throttle]) {
    assert.throws(() => wrap(null), TypeError);
    for (const wait of [-1, NaN, Infinity, "100"]) {
      assert.throws(() => wrap(() => {}, wait), RangeError);
    }
  }
  for (const value of ["không phải ngày", new Date(NaN), NaN]) {
    assert.throws(() => formatDate(value), RangeError);
  }
  assert.throws(() => formatDate(null), TypeError);
});
