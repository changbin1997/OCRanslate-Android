import axios from 'axios';
import CryptoJS from 'crypto-js';

export default class TencentTranslation {
  /**
   * 初始化腾讯云机器翻译模块
   * @param {string} secretId 腾讯云 SecretId
   * @param {string} secretKey 腾讯云 SecretKey
   * @param {string} region 地域，默认 ap-guangzhou (广州数据中心，覆盖全国速度较好，你也可以传入 ap-shanghai 或 ap-beijing)
   */
  constructor(secretId, secretKey, region = 'ap-guangzhou') {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.region = region;
    this.host = 'tmt.tencentcloudapi.com';
    this.service = 'tmt';
    this.version = '2018-03-21';
  }

  // 计算 SHA256 哈希值 (返回 Hex 字符串)
  _getHash(message) {
    return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
  }

  // 获取 UTC 日期字符串格式 YYYY-MM-DD
  _getDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  /**
   * 核心请求与签名方法
   * @param {string} action API 操作名
   * @param {object} payload 请求参数体
   */
  async _requestAPI(action, payload) {
    try {
      const payloadString = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const date = this._getDate(timestamp);

      // ************* 步骤 1：拼接规范请求串 *************
      const signedHeaders = 'content-type;host';
      const hashedRequestPayload = this._getHash(payloadString);
      const httpRequestMethod = 'POST';
      const canonicalUri = '/';
      const canonicalQueryString = '';
      const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.host}\n`;

      const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

      // ************* 步骤 2：拼接待签名字符串 *************
      const algorithm = 'TC3-HMAC-SHA256';
      const hashedCanonicalRequest = this._getHash(canonicalRequest);
      const credentialScope = `${date}/${this.service}/tc3_request`;
      const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

      // ************* 步骤 3：计算签名 *************
      // 注意：CryptoJS.HmacSHA256 默认返回 WordArray 对象，这正好对应 Node.js 中不传编码格式返回 Buffer 的行为
      const kDate = CryptoJS.HmacSHA256(date, 'TC3' + this.secretKey);
      const kService = CryptoJS.HmacSHA256(this.service, kDate);
      const kSigning = CryptoJS.HmacSHA256('tc3_request', kService);
      // 最后一步需要输出 hex 字符串
      const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

      // ************* 步骤 4：拼接 Authorization *************
      const authorization = `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      // ************* 步骤 5：构造并发起请求 *************
      const headers = {
        'Authorization': authorization,
        'Content-Type': 'application/json; charset=utf-8',
        'X-TC-Action': action,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Version': this.version,
        'X-TC-Region': this.region
      };

      const response = await axios.post(`https://${this.host}`, payloadString, { headers, timeout: 15000});

      // 检查腾讯云 API 内部定义的业务错误 (HTTP 状态码为 200，但实际逻辑报错)
      if (response.data && response.data.Response && response.data.Response.Error) {
        return {
          result: 'error',
          msg: response.data.Response.Error.Message
        };
      }

      // 请求成功，直接返回接收到的完整内容
      return response.data;

    } catch (error) {
      // 提取 HTTP 层或 axios 拦截到的报错信息
      let msg = error.message;
      if (error.response && error.response.data) {
        if (error.response.data.Response && error.response.data.Response.Error) {
          msg = error.response.data.Response.Error.Message;
        } else if (error.response.data.Error && error.response.data.Error.Message) {
          msg = error.response.data.Error.Message;
        } else {
          msg = JSON.stringify(error.response.data);
        }
      }
      return {
        result: 'error',
        msg: msg
      };
    }
  }

  /**
   * 文本翻译
   * @param {string} q 要翻译的文字
   * @param {string} from 原文语言 (如 'zh', 'en', 'auto')
   * @param {string} to 目标语言 (如 'en', 'zh')
   */
  async textTranslate(q, from, to) {
    // 去除原文内容的空行
    q = q.replace(/^\s*[\r\n]/gm, '');
    const payload = {
      SourceText: q,
      Source: from,
      Target: to,
      ProjectId: 0
    };
    const result = await this._requestAPI('TextTranslate', payload);
    if (result.Response.TargetText === undefined || result.result === 'error') {
      return result;
    }
    const dst = result.Response.TargetText.split('\n');
    const src = q.split('\n');
    // 按照百度翻译的格式返回
    const transResult = {from: from, to: to, trans_result: []};
    for (let i = 0;i < dst.length;i ++) {
      transResult.trans_result.push({
        src: src[i],
        dst: dst[i]
      });
    }

    return {result: 'success', data: transResult};
  }

  /**
   * LLM 图片翻译
   * @param {string} base64Img 图片的 base64 字符串
   * @param {string} to 目标语言
   */
  async imageTranslateLLM(base64Img, to) {
    // 自动清理 base64 前缀（如果传入了 "data:image/png;base64," 等头信息，腾讯云 API 会报错，这里做一个安全过滤）
    const cleanBase64 = base64Img.replace(/^data:image\/\w+;base64,/, '');

    const payload = {
      Data: cleanBase64,
      Target: to,
      ProjectId: 0
    };
    return await this._requestAPI('ImageTranslateLLM', payload);
  }
}