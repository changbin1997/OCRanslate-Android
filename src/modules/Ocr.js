import YoudaoOcr from './YoudaoOcr.js';
import BaiduOCR from './BaiduOCR.js';
import AliyunOCR from './AliyunOCR.js';
import TencentOCR from './TencentOCR.js';
import data from './Data.js';
import DateTime from './DateTime.js';

export default class Ocr {
  options = null;
  apiList = [
    {name: '百度云通用文字识别（标准版）', provider: 'baidu'},
    {name: '百度云通用文字识别（高精度版）', provider: 'baidu'},
    {name: '腾讯云通用印刷体识别', provider: 'tencent'},
    {name: '腾讯云通用印刷体识别（高精度版）', provider: 'tencent'},
    {name: '腾讯云通用手写体识别', provider: 'tencent'},
    {name: '腾讯云广告文字识别', provider: 'tencent'},
    {name: '腾讯云通用印刷体识别（精简版）', provider: 'tencent'},
    {name: '腾讯云通用印刷体识别（高速版）', provider: 'tencent'},
    {name: '有道智云通用文字识别', provider: 'youdao'},
    {name: '阿里云通用文字识别', provider: 'ali'},
    {name: '阿里云全文识别高精版', provider: 'ali'}
  ];

  constructor(options) {
    this.options = options;
  }

  /**
   * 获取 API 提供商，调用指定的 OCR 识别
   * @param base64Img 图片base64
   * @param apiName API 名称
   * @returns {Promise<*>}
   */
  async submit(base64Img, apiName) {
    const provider = this.apiList.find(item => item.name === apiName).provider;
    const result = await this[provider](base64Img, apiName);
    if (result.result === 'success') {
      // 生成时间戳
      const created = DateTime.timestamp();
      data.addOcrHistory(apiName, provider, created);
    }

    return result;
  }

  /**
   * 腾讯OCR
   * @param base64Img 图片base64
   * @param apiName API名称
   * @returns {Promise<Object>}
   */
  async tencent(base64Img, apiName) {
    // 检查 API 是否可用
    if (
      this.options.tencent_ocr_secret_id === '' ||
      this.options.tencent_ocr_secret_key === ''
    ) {
      return {result: 'error', msg: '您还没有填写腾讯 API 信息！'};
    }
    const tencentOcr = new TencentOCR({
      secretId: this.options.tencent_ocr_secret_id,
      secretKey: this.options.tencent_ocr_secret_key
    });
    let result = null;

    switch (apiName) {
      case '腾讯云通用印刷体识别':
        result = await tencentOcr.GeneralBasicOCR(base64Img);
        break;
      case '腾讯云通用印刷体识别（高精度版）':
        result = await tencentOcr.GeneralAccurateOCR(base64Img);
        break;
      case '腾讯云通用手写体识别':
        result = await tencentOcr.GeneralHandwritingOCR(base64Img);
        break;
      case '腾讯云广告文字识别':
        result = await tencentOcr.AdvertiseOCR(base64Img);
        break;
      case '腾讯云通用印刷体识别（精简版）':
        result = await tencentOcr.GeneralEfficientOCR(base64Img);
        break;
      case '腾讯云通用印刷体识别（高速版）':
        result = await tencentOcr.GeneralFastOCR(base64Img);
        break;
      default:
        result = {result: 'error', msg: `不支持的 API ${apiName}`};
        break;
    }

    return result;
  }

  /**
   * 阿里OCR
   * @param base64Img 图片base64
   * @param apiName API名称
   * @returns {Promise<Object>}
   */
  async ali(base64Img, apiName) {
    // 检查 API 是否可用
    if (this.options.aliyun_access_key_id === '' || this.options.aliyun_access_key_secret === '') {
      return {result: 'error', msg: '您还没有填写阿里云 API 信息！'};
    }
    const aliyunOcr = new AliyunOCR(
      this.options.aliyun_access_key_id,
      this.options.aliyun_access_key_secret
    );
    let result = null;
    if (apiName === '阿里云全文识别高精版') {
      result = await aliyunOcr.recognizeAdvanced(base64Img);
    }else {
      result = await aliyunOcr.recognizeGeneral(base64Img);
    }
    return result;
  }

  /**
   * 百度OCR
   * @param base64Img 图片base64
   * @param apiName API名称
   * @returns {Promise<Object>}
   */
  async baidu(base64Img, apiName) {
    // 检查 API 是否可用
    if (
      this.options.baidu_ocr_app_id === '' ||
      this.options.baidu_ocr_api_key === '' ||
      this.options.baidu_ocr_secret_key === ''
    ) {
      return {result: 'error', msg: '您还没有填写百度 API 信息！'};
    }
    const baiduOcr = new BaiduOCR(
      this.options.baidu_ocr_app_id,
      this.options.baidu_ocr_api_key,
      this.options.baidu_ocr_secret_key
    );
    let result = null;
    if (apiName === '百度云通用文字识别（高精度版）') {
      result = await baiduOcr.accurateBasic(base64Img);
    }else {
      result = await baiduOcr.generalBasic(base64Img);
    }
    return result;
  }

  /**
   * 有道OCR
   * @param base64Img 图片base64
   * @param apiName API名称
   * @returns {Promise<Object>}
   */
  async youdao(base64Img, apiName) {
    if (this.options.youdao_ocr_app_id === '' || this.options.youdao_ocr_app_key === '') {
      return {result: 'error', msg: '您还没有填写有道 API 信息！'};
    }
    const youdaoOcr = new YoudaoOcr(this.options.youdao_ocr_app_id, this.options.youdao_ocr_app_key);
    const result = await youdaoOcr.submit(base64Img);
    return result;
  }
}