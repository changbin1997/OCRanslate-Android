import axios from 'axios';
import CryptoJS from 'crypto-js';

export default class TencentOCR {
  /**
   * 初始化腾讯云 OCR 客户端
   * @param {Object} params
   * @param {string} params.secretId - 腾讯云 SecretId
   * @param {string} params.secretKey - 腾讯云 SecretKey
   * @param {string} [params.region='ap-guangzhou'] - 地域，默认华南地区(广州)，方便服务中国绝大多数地区
   */
  constructor({ secretId, secretKey, region = 'ap-guangzhou' }) {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.region = region;
    this.host = 'ocr.tencentcloudapi.com';
    this.service = 'ocr';
    this.version = '2018-11-19';
    this.timeout = 15000; // 15秒超时
  }

  /**
   * 统一生成 UTC 日期字符串 (YYYY-MM-DD)
   */
  _getUTCDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  /**
   * 核心请求与签名方法
   * @param {string} action - 接口名称
   * @param {string} base64Image - 图片 base64 字符串
   */
  async _request(action, base64Image) {
    try {
      // 1. 清理 base64 头部（如果包含 data:image/xxx;base64,）
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      // 2. 构造请求 Payload
      // 默认不开启 IsWords (即不需要返回每个字的位置信息)，腾讯云 OCR 默认即为 false
      const payloadObj = {
        ImageBase64: cleanBase64
      };
      const payload = JSON.stringify(payloadObj);

      // 3. 时间戳准备
      const timestamp = Math.floor(Date.now() / 1000);
      const date = this._getUTCDate(timestamp);

      // 4. 步骤 1：拼接规范请求串
      const signedHeaders = 'content-type;host';
      const hashedRequestPayload = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
      const httpRequestMethod = 'POST';
      const canonicalUri = '/';
      const canonicalQueryString = '';
      const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.host}\n`;

      const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

      // 5. 步骤 2：拼接待签名字符串
      const algorithm = 'TC3-HMAC-SHA256';
      const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
      const credentialScope = `${date}/${this.service}/tc3_request`;
      const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

      // 6. 步骤 3：计算签名 (注意：crypto-js 链式计算时中间结果需保持 WordArray 格式)
      const kDate = CryptoJS.HmacSHA256(date, 'TC3' + this.secretKey);
      const kService = CryptoJS.HmacSHA256(this.service, kDate);
      const kSigning = CryptoJS.HmacSHA256('tc3_request', kService);
      const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

      // 7. 步骤 4：拼接 Authorization
      const authorization = `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      // 8. 构造 Headers
      const headers = {
        'Authorization': authorization,
        'Content-Type': 'application/json; charset=utf-8',
        'X-TC-Action': action,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Version': this.version,
        'X-TC-Region': this.region
      };

      // 9. 发起网络请求
      const response = await axios.post(`https://${this.host}`, payload, {
        headers,
        timeout: this.timeout
      });

      // 10. 处理腾讯云网关返回的内部错误（腾讯云在鉴权失败或业务失败时也会返回 HTTP 200）
      if (response.data && response.data.Response && response.data.Response.Error) {
        return {
          result: 'error',
          msg: response.data.Response.Error.Message || '腾讯云 OCR 接口调用错误'
        };
      }

      // 成功则直接返回接收到的完整内容
      return response.data;

    } catch (error) {
      // 捕获网络超时、跨域、4xx/5xx 等各类错误
      return {
        result: 'error',
        msg: error.message || '网络或服务器异常'
      };
    }
  }

  // ************* 以下为支持的 6 个 OCR 方法 *************

  /** 通用印刷体识别 */
  async GeneralBasicOCR(base64Image) {
    const result = await this._request('GeneralBasicOCR', base64Image);
    return this.transformApiResponse(result);
  }

  /** 通用印刷体识别（高精度版） */
  async GeneralAccurateOCR(base64Image) {
    const result = await this._request('GeneralAccurateOCR', base64Image);
    return this.transformApiResponse(result);
  }

  /** 手写体识别 */
  async GeneralHandwritingOCR(base64Image) {
    const result = await this._request('GeneralHandwritingOCR', base64Image);
    return this.transformApiResponse(result);
  }

  /** 广告文字识别 */
  async AdvertiseOCR(base64Image) {
    const result = await this._request('AdvertiseOCR', base64Image);
    return this.transformApiResponse(result);
  }

  /** 通用印刷体识别（精简版） */
  async GeneralEfficientOCR(base64Image) {
    const result = await this._request('GeneralEfficientOCR', base64Image);
    return this.transformApiResponse(result);
  }

  /** 通用印刷体识别（高速版） */
  async GeneralFastOCR(base64Image) {
    const result = await this._request('GeneralFastOCR', base64Image);
    return this.transformApiResponse(result);
  }

  transformApiResponse(data) {
    if (data.result === 'error' || data.Response?.TextDetections === undefined) {
      return data;
    }
    const list = [];
    data.Response.TextDetections.forEach(val => {
      list.push(val.DetectedText);
    });

    return {result: 'success', list: list};
  }
}