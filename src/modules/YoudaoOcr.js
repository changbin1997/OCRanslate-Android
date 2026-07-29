import axios from 'axios';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export default class YoudaoOcr {
  appId = null;
  appKey = null;

  /**
   * 初始化有道 OCR
   * @param {string} appId 应用 ID
   * @param {string} appKey 应用密钥
   */
  constructor(appId, appKey) {
    this.appId = appId;
    this.appKey = appKey;
  }

  /**
   * 提交 OCR 识别请求到有道 API
   * @param {string} base64Img Base64 编码的图片数据
   * @param {string} [langType='auto'] 语言类型，默认为自动识别
   * @returns {Promise<Object>} 返回 {result, list/msg} 对象的 Promise，成功时包含识别出的文字列表
   */
  async submit(base64Img, langType = 'auto') {
    // 获取要提交的数据
    const queryData = this.submitData(base64Img, langType);

    try {
      const result = await axios({
        url: 'https://openapi.youdao.com/ocrapi',
        method: 'post',
        data: queryData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // 是否出错
      if (result.data.errorCode !== '0' && result.data.msg !== undefined) {
        return { result: 'error', msg: `${result.data.errorCode} ${result.data.msg}` };
      }

      // 是否按照格式返回结果
      if (result.data.Result === undefined || result.data.Result.regions?.[0].lines?.[0].text === undefined) {
        return { result: 'error', msg: '有道服务器未能返回识别文字！' };
      }

      // 提取识别结果
      const textList = result.data.Result.regions.map(val => val.lines[0].text);
      return { result: 'success', list: textList };

    } catch (error) {
      if (error.response) {
        return { result: 'error', msg: `${error.response.status} ${error.message}` };
      } else {
        // 处理部分无错误码的异常
        return { result: 'error', msg: `${error.code || 'UNKNOWN'} ${error.message}` };
      }
    }
  }

  /**
   * 生成提交数据及签名
   * @param {string} base64Img Base64 编码的图片数据
   * @param {string} langType 语言类型
   * @returns {string} 返回 URL 编码的查询字符串数据
   */
  submitData(base64Img, langType) {
    const data = {
      // 使用 uuid 模块生成，彻底解决 WebView 兼容性问题
      salt: uuidv4(),
      // 语言
      langType: langType,
      // 按行识别：10012
      detectType: '10012',
      imageType: '1',
      appKey: this.appId,
      docType: 'json',
      signType: 'v3',
      curtime: Math.round(new Date().getTime() / 1000).toString(),
      angle: '0',
      // 是否按多列识别
      column: 'onecolumn',
      rotate: 'rotate',
      img: base64Img
    };

    // input的计算方式为：input=img前10个字符 + img长度 + img后十个字符
    const input = `${data.img.slice(0, 10)}${data.img.length}${data.img.slice(-10)}`;

    // 生成签名拼接字符串
    const signStr = `${data.appKey}${input}${data.salt}${data.curtime}${this.appKey}`;

    // 使用 crypto-js 生成 sha256 并转为 hex 格式
    data.sign = CryptoJS.SHA256(signStr).toString(CryptoJS.enc.Hex);

    // 把要提交的数据转换为 url query 字符串
    return new URLSearchParams(data).toString();
  }
}