import axios from 'axios';
import SHA256 from 'crypto-js/sha256';

export default class YoudaoTranslation {
  constructor(appId, appKey) {
    this.appId = appId;
    this.appKey = appKey;
    // 初始设为 null，在每次请求时动态生成
    this.curtime = null;
    this.salt = null;
  }

  /**
   * 生成 UUID 的方法（兼容可能不支持 window.crypto.randomUUID 的旧版本 Android WebView）
   */
  _generateUUID() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 发送翻译请求到有道翻译 API
   * @param {string} q 要翻译的文本
   * @param {string} [from='auto'] 源语言，默认为自动识别
   * @param {string} [to='zh-CHS'] 目标语言，默认为简体中文
   * @returns {Promise<Object>} 返回 {result, msg/data} 对象的 Promise
   */
  async submit(q, from = 'auto', to = 'zh-CHS') {
    // 【重要改进】有道 API 要求时间戳和盐具有时效性。
    // 原代码在 constructor 中固定了时间和盐，如果单例复用该实例，超过 5 分钟后后续请求会因为时间戳超时导致签名失败。
    // 现改为每次调用 submit 时都生成最新的时间和盐。
    this.curtime = Math.round(Date.now() / 1000);
    this.salt = this._generateUUID();

    // 获取签名
    const sign = this.signature(q);

    // 要发送的内容
    const submitData = {
      q: q,
      from: from,
      to: to,
      appKey: this.appId,
      signType: 'v3',
      salt: this.salt,
      curtime: this.curtime,
      sign: sign
    };

    try {
      const result = await axios({
        url: 'https://openapi.youdao.com/api',
        method: 'post',
        // 使用浏览器原生的 URLSearchParams 替代 Node 的 querystring
        data: new URLSearchParams(submitData).toString(),
        timeout: 15000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      // 翻译出错
      if (result.data.errorCode !== '0') {
        return { result: 'error', msg: `Error ${result.data.errorCode}` };
      }

      // 把原文和译文按照行拆分为数组
      const dst = result.data.translation[0].split('\n');
      const src = result.data.query.split('\n');
      // 获取翻译语言
      const language = result.data.l.split('2');

      // 按照你原定的格式（类似百度翻译）返回数据
      const returnResult = {
        from: language[0],
        to: language[1],
        trans_result: []
      };

      // 把拆分的原文和译文加入到返回结果
      for (let i = 0; i < dst.length; i++) {
        returnResult.trans_result.push({
          src: src[i],
          dst: dst[i]
        });
      }

      return { result: 'success', data: returnResult };
    } catch (error) {
      if (error.response) {
        return { result: 'error', msg: `${error.response.status} ${error.message}` };
      } else {
        return { result: 'error', msg: `${error.code || 'UNKNOWN'} ${error.message}` };
      }
    }
  }

  /**
   * 生成签名
   * @param {string} q 要签名的文本
   * @returns {string} 签名哈希值
   */
  signature(q) {
    let input = q;
    if (q.length > 20) input = `${q.slice(0, 10)}${q.length}${q.slice(-10)}`;
    // 拼接签名
    const sign = `${this.appId}${input}${this.salt}${this.curtime}${this.appKey}`;

    // 【修改这里】直接使用引入的 SHA256 方法
    return SHA256(sign).toString();
  }
}