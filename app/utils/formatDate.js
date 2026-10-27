/**
 * Định dạng ngày bằng Intl.DateTimeFormat, không thay đổi Date đầu vào.
 * Dùng chuỗi ISO 8601 có múi giờ cho thời điểm, hoặc timestamp milliseconds.
 * Múi giờ mặc định cố định để server và trình duyệt hiển thị nhất quán.
 *
 * @param {Date | string | number} value
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string | string[]} locale
 * @returns {string}
 */
export function formatDate(value, options = {}, locale = "vi-VN") {
  if (!(value instanceof Date) && typeof value !== "string" && typeof value !== "number") {
    throw new TypeError("value phải là Date, chuỗi ngày hoặc timestamp milliseconds");
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Ngày không hợp lệ");
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  }).format(date);
}
