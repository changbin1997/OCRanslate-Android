import axios from 'axios';
import md5 from 'crypto-js/md5.js';

export default class BaiduTranslation {
  constructor(baiduTranslationAppID, baiduTranslationApiKey) {
    this.baiduTranslationAppID = baiduTranslationAppID;
    this.baiduTranslationApiKey = baiduTranslationApiKey;
  }

  /**
   * 生成签名
   * @param {string} query 查询字符串
   * @param {number} salt 随机数
   * @returns {string} 签名哈希值
   */
  signature(query, salt) {
    const str = this.baiduTranslationAppID + query + salt + this.baiduTranslationApiKey;
    // 使用 crypto-js 替代 Node 的 crypto 模块
    return md5(str).toString();
  }

  /**
   * 生成随机数
   * @param {number} max 最大值
   * @param {number} min 最小值
   * @returns {number} 随机数
   */
  rand(max, min) {
    const num = max - min;
    return Math.round(Math.random() * num + min);
  }

  /**
   * 发送翻译请求到百度翻译 API
   * @param {string} q 要翻译的文本
   * @param {string} from 源语言
   * @param {string} to 目标语言
   * @returns {Promise<Object>} 返回 {result, msg/data} 对象的 Promise
   */
  async send(q, from, to) {
    // 生成一个随机数
    const randerNum = this.rand(999999, 111111);
    // 获取签名
    const sign = this.signature(q, randerNum);

    // 要发送的数据
    const submitData = {
      q: q,
      from: from,
      to: to,
      appid: this.baiduTranslationAppID,
      salt: randerNum,
      sign: sign
    };

    // 在浏览器环境中，使用原生 URLSearchParams 替代 Node 的 querystring
    const params = new URLSearchParams(submitData);

    try {
      const result = await axios({
        url: 'https://api.fanyi.baidu.com/api/trans/vip/translate',
        method: 'post',
        data: params, // axios 会自动将 URLSearchParams 识别为 application/x-www-form-urlencoded
        timeout: 15000,
      });

      // 百度返回的不是 JSON 格式
      if (typeof result.data === "string") {
        return { result: 'error', msg: '百度翻译服务器未能返回翻译数据！' };
      }

      // API出错
      if (result.data.error_code !== undefined && result.data.error_msg !== undefined) {
        return { result: 'error', msg: `${result.data.error_code} ${result.data.error_msg}` };
      }

      // 百度服务器是否返回翻译结果
      if (result.data.trans_result === undefined || result.data.trans_result.length < 1) {
        return { result: 'error', msg: '百度翻译未能返回翻译结果！' };
      }

      return { result: 'success', data: result.data };

    } catch (error) {
      if (error.response) {
        return { result: 'error', msg: `${error.response.status} ${error.message}` };
      } else {
        return { result: 'error', msg: `${error.code || 'UNKNOWN_ERROR'} ${error.message}` };
      }
    }
  }
}