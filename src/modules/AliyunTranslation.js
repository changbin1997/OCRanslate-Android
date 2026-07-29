import axios from 'axios';
import CryptoJS from 'crypto-js';

/**
 * 阿里云翻译浏览器端/Capacitor 支持类
 */
export default class AliyunTranslation {
  /**
   * @param {string} accessKeyId - 阿里云 AccessKeyId
   * @param {string} accessKeySecret - 阿里云 AccessKeySecret
   * @param {string} [endpoint="https://mt.cn-hangzhou.aliyuncs.com"] - API 接入点
   */
  constructor(accessKeyId, accessKeySecret, endpoint = 'https://mt.cn-hangzhou.aliyuncs.com') {
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('accessKeyId 和 accessKeySecret 必须提供');
    }
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.endpoint = endpoint;
    this.timeout = 15000;
  }

  // RFC 3986 风格的 percent-encode
  _percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/\+/g, '%20')
        .replace(/%2A/g, '%2A')
        .replace(/%7E/g, '~');
  }

  // ISO8601 时间，去掉毫秒，示例：2025-12-24T10:41:57Z
  _nowISO8601() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  // 纯 JS 实现的 UUID，兼容浏览器环境
  _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // 降级方案，用于不支持 randomUUID 的旧 WebView 环境
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 构建签名过的请求 URL（把所有参数都作为 query string）
   * @param {object} params - 业务参数（SourceText, SourceLanguage, TargetLanguage, FormatType...）
   * @param {string} method - 'GET' 或 'POST'
   */
  _buildSignedUrl(params = {}, method = 'POST') {
    // 公共参数（RPC 风格）
    const baseParams = {
      Format: 'JSON',
      Version: '2018-10-12',
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: this._uuid(),
      Timestamp: this._nowISO8601(),
      Action: 'TranslateGeneral'
    };

    // 合并（业务参数覆盖 baseParams 中的同名键）
    const all = Object.assign({}, baseParams, params);

    // 过滤空值并排序
    const keys = Object.keys(all)
        .filter((k) => all[k] !== undefined && all[k] !== null && String(all[k]) !== '')
        .sort();

    // canonicalized query string (未包含 Signature)
    const canonical = keys
        .map((k) => `${this._percentEncode(k)}=${this._percentEncode(String(all[k]))}`)
        .join('&');

    // stringToSign
    const stringToSign = `${method.toUpperCase()}&${this._percentEncode('/')}&${this._percentEncode(canonical)}`;

    // 使用 crypto-js 替代 Node.js 原生的 crypto 模块生成 HMAC-SHA1 签名
    const hash = CryptoJS.HmacSHA1(stringToSign, this.accessKeySecret + '&');
    const signature = CryptoJS.enc.Base64.stringify(hash);

    // 最终 URL（把 Signature 放在 query 中）
    return `${this.endpoint}/?${canonical}&Signature=${this._percentEncode(signature)}`;
  }

  /**
   * 调用通用翻译接口
   * @param {string} text - 要翻译的文本（必填）
   * @param {string} [source='auto'] - 原文语言，如 'auto' 或 'en' 或 'zh' 等
   * @param {string} [target='zh'] - 目标语言
   * @returns {Promise<{result: 'success', data: {from: string, to: string, trans_result: Array<{src: string, dst: string}>, word_count: number}} | {result: 'error', msg: string}>}
   */
  async translateGeneral(text, source = 'auto', target = 'zh') {
    if (!text || typeof text !== 'string') {
      return { result: 'error', msg: 'text 必须是非空字符串' };
    }

    const bizParams = {
      FormatType: 'text',
      SourceLanguage: source,
      TargetLanguage: target,
      SourceText: text
    };

    const url = this._buildSignedUrl(bizParams, 'POST');

    try {
      // 使用浏览器原生的 URLSearchParams 替代 Node.js 的 querystring 模块
      const formBody = new URLSearchParams(bizParams).toString();

      const res = await axios.post(url, formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AliyunTranslate-CapacitorClient'
        },
        timeout: this.timeout
        // 移除了 maxContentLength 和 maxBodyLength，因为它们是 Node.js 环境下特有的配置
      });

      // 阿里服务器返回的错误信息
      if (res.data.Code !== 200 && res.data.Message !== undefined) {
        return { result: 'error', msg: res.data.Message };
      }

      // 如果服务器未按预期返回
      if (
          res.data.Data === undefined ||
          res.data.Data?.WordCount === undefined ||
          res.data.Data?.Translated === undefined
      ) {
        return { result: 'error', msg: '阿里服务器未能返回翻译结果' };
      }

      // 按照百度翻译的格式返回数据
      const returnData = {
        from: res.data.Data?.DetectedLanguage === undefined ? source : res.data.Data?.DetectedLanguage,
        to: target,
        trans_result: [],
        word_count: res.data.Data?.WordCount
      };

      // 把原文和译文使用换行符拆分为数组
      const src = text.split('\n');
      const dst = res.data.Data?.Translated.split('\n');

      // 把原文和译文加入翻译结果
      for (let i = 0; i < dst.length; i++) {
        returnData.trans_result.push({
          src: src[i],
          dst: dst[i]
        });
      }

      return { result: 'success', data: returnData };
    } catch (error) {
      // 使用可选链操作符 (?.) 提高安全性，防止对象为 undefined 时报错
      if (error?.response?.data?.Message !== undefined) {
        return { result: 'error', msg: error.response.data.Message };
      }

      if (error?.message !== undefined) {
        return { result: 'error', msg: error.message };
      }

      return { result: 'error', msg: '未知错误' };
    }
  }
}