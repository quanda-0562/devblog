/**
 * Chạy callback với tham số của lần gọi cuối, sau wait ms không có lần gọi mới.
 * Timer nằm trong closure riêng của mỗi hàm debounce được tạo.
 *
 * @template {unknown[]} Args
 * @template Result, Context
 * @param {(this: Context, ...args: Args) => Result} callback
 * @param {number} wait Thời gian chờ (ms), hữu hạn và không âm.
 */
export function debounce(callback, wait = 300) {
  if (typeof callback !== "function") {
    throw new TypeError("callback phải là một hàm");
  }
  if (!Number.isFinite(wait) || wait < 0) {
    throw new RangeError("wait phải là số hữu hạn không âm");
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @this {Context} @param {Args} args */
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      callback.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
