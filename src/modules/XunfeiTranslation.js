import axios from 'axios';
import CryptoJS from 'crypto-js';

export default class XunfeiTranslation {
  host = 'itrans.xfyun.cn';  // 请求主机
  urlPath = '/v2/its';       // 地址路径
  date = null;               // 时间戳
  APPId = '';
  APISecret = '';
  APIKey = '';

  /**
   * 初始化讯飞翻译
   * @param {string} APPId 应用 ID
   * @param {string} APISecret API 密钥
   * @param {string} APIKey API 钥匙
   */
  constructor(APPId, APISecret, APIKey) {
    this.APPId = APPId;
    this.APISecret = APISecret;
    this.APIKey = APIKey;
  }

  /**
   * 提交翻译请求到讯飞翻译 API
   * @param {string} text 要翻译的文本
   * @param {string} [from='en'] 源语言，默认为英文
   * @param {string} [to='cn'] 目标语言，默认为中文
   * @returns {Promise<Object>} 返回 {result, msg/data} 对象的 Promise
   */
  async submit(text, from = 'en', to = 'cn') {
    // 改进 1：每次请求时动态生成时间戳，避免因实例化时间过长导致鉴权因超时（Replay Attack 校验）失败
    this.date = new Date().toUTCString();

    // 改进 2：使用 crypto-js 进行标准的 Base64 编码
    const textBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));

    // 翻译内容是否超出限制
    if (textBase64.length > 1024) {
      return { result: 'error', msg: '翻译内容转换为 base64 后超过了 1024 字节！' };
    }

    // 要发送的数据
    const submitData = {
      common: {
        app_id: this.APPId
      },
      business: {
        from: from,
        to: to
      },
      data: {
        text: textBase64
      }
    };

    // 获取 authorization
    const authorization = this.getAuthorization(submitData);
    // 请求的 URL
    const url = `https://${this.host}${this.urlPath}`;
    // 发送的 headers
    const headers = {
      'Content-Type': 'application/json',
      Authorization: authorization.authorization,
      Host: this.host,
      Date: this.date,
      Digest: authorization.digest,
      Accept: 'application/json,version=1.0'
    };

    // 改进 3：使用 async/await 处理异步，相比之前的 new Promise 嵌套更加清晰
    try {
      const result = await axios({
        url: url,
        method: 'post',
        data: JSON.stringify(submitData),
        headers: headers
      });

      // 翻译是否出错
      if (result.data.message !== 'success') {
        return { result: 'error', msg: result.data.message };
      }

      // 讯飞服务器是否返回翻译结果
      if (!result.data.data?.result?.trans_result) {
        return { result: 'error', msg: '讯飞服务器未能返回翻译结果！' };
      }

      // 保持原有逻辑：把翻译结果对象转换为数组
      result.data.data.result.trans_result = [result.data.data.result.trans_result];

      return { result: 'success', data: result.data.data.result };
    } catch (error) {
      return { result: 'error', msg: error.message };
    }
  }

  /**
   * 生成 Authorization 认证头和 Digest 摘要
   * @param {Object} submitData 要提交的数据对象
   * @returns {Object} 返回 {authorization, digest} 对象
   */
  getAuthorization(submitData) {
    // 生成 Digest
    const submitDataStr = JSON.stringify(submitData);
    const digestBase64 = CryptoJS.SHA256(submitDataStr).toString(CryptoJS.enc.Base64);
    const Digest = `SHA-256=${digestBase64}`;

    // 生成 signature
    let signature = `host: ${this.host}\ndate: ${this.date}\nPOST ${this.urlPath} HTTP/1.1\ndigest: ${Digest}`;

    // 使用 hmac-sha256 算法结合 apiSecret 对 signature 签名
    const signatureBase64 = CryptoJS.HmacSHA256(signature, this.APISecret).toString(CryptoJS.enc.Base64);

    // 返回 authorization
    return {
      authorization: `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signatureBase64}"`,
      digest: Digest
    };
  }
}