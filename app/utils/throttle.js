/**
 * Chạy ngay lần gọi đầu, bỏ qua các lần gọi trong wait ms tiếp theo.
 * Không chạy bù ở cuối khoảng chờ (leading: true, trailing: false).
 * Timer trong closure giúp các hàm throttle hoạt động độc lập.
 *
 * @template {unknown[]} Args
 * @template Result, Context
 * @param {(this: Context, ...args: Args) => Result} callback
 * @param {number} wait Thời gian chờ (ms), hữu hạn và không âm.
 */
export function throttle(callback, wait = 300) {
  if (typeof callback !== "function") {
    throw new TypeError("callback phải là một hàm");
  }
  if (!Number.isFinite(wait) || wait < 0) {
    throw new RangeError("wait phải là số hữu hạn không âm");
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @this {Context} @param {Args} args */
  function throttled(...args) {
    if (timer !== undefined) return;

    // Khóa trước khi gọi callback để cả lời gọi đệ quy cũng bị giới hạn.
    timer = setTimeout(() => {
      timer = undefined;
    }, wait);

    return callback.apply(this, args);
  }

  throttled.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return throttled;
}
