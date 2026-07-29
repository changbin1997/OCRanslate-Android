export default class DateTime {

  /**
   * 生成时间戳
   * @returns {number} 返回当前的时间戳
   */
  static timestamp() {
    return Math.round(new Date().getTime() / 1000);
  }

  /**
   * 生成本月第一天 00:00:00 的时间戳
   * @returns {number} 返回时间戳
   */
  static getFirstDayOfMonthTimestamp() {
    const now = new Date();
    // 创建一个当前年份和月份、日期为 1 号、时间为 00:00:00 的 Date 对象
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    // getTime() 返回的是毫秒数，除以 1000 并向下取整得到秒级时间戳
    return Math.floor(firstDay.getTime() / 1000);
  }

  /**
   * 格式化日期时间（类似 PHP 的 date 函数）
   *  @param {string} format 格式字符串，例如 "Y-m-d H:i:s"
   * @param {number|string|Date} [timestamp] 时间戳或 Date 对象。可选，默认当前时间。
   * @returns {string} 格式化后的字符串
   */
  static dateFormat(format, timestamp) {
    let date;

    // 1. 处理传入的 timestamp
    if (timestamp === undefined || timestamp === null) {
      date = new Date();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      // 兼容 PHP 习惯的 10 位时间戳（秒）和 JS 的 13 位时间戳（毫秒）
      let ms = String(timestamp).length <= 10 ? Number(timestamp) * 1000 : Number(timestamp);
      date = new Date(ms);
    }

    // 2. 检查日期是否有效
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // 3. 构建占位符和对应值的字典
    const formatMap = {
      'Y': date.getFullYear(),                                   // 4位年份
      'm': String(date.getMonth() + 1).padStart(2, '0'),         // 2位月份 (01-12)
      'd': String(date.getDate()).padStart(2, '0'),              // 2位日期 (01-31)
      'H': String(date.getHours()).padStart(2, '0'),             // 24小时制 (00-23)
      'h': String(date.getHours() % 12 || 12).padStart(2, '0'),  // 12小时制 (01-12)
      'i': String(date.getMinutes()).padStart(2, '0'),           // 分钟 (00-59)
      's': String(date.getSeconds()).padStart(2, '0')            // 秒钟 (00-59)
    };

    // 4. 使用正则匹配并替换字符串
    // /[YmdHhis]/g 会匹配字符串中所有在括号内的字符，并将其替换为 formatMap 中的值
    return format.replace(/[YmdHhis]/g, (match) => {
      return formatMap[match];
    });
  }
}