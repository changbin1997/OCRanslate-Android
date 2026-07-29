import BaiduTranslation from './BaiduTranslation.js';
import YoudaoTranslation from './YoudaoTranslation.js';
import AliyunTranslation from './AliyunTranslation.js';
import TencentTranslation from './TencentTranslation.js';
import XunfeiTranslation from './XunfeiTranslation.js';
import DateTime from './DateTime.js';
import data from './Data.js';

export default class Translation {
  options = null;
  apiList = {
    baidu: '百度翻译',
    tencent: '腾讯翻译',
    ali: '阿里翻译',
    youdao: '有道翻译',
    xunfei: '讯飞翻译'
  };

  constructor(options) {
    this.options = options;
  }

  /**
   * 根据 API 调用翻译
   * @param {string} provider API 名称
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<*>} 返回翻译结果
   */
  async submit(provider, q, from , to) {
    const result = await this[provider](q, from, to);
    // 成功就添加历史记录
    if (result.result === 'success') {
      // 使用提供商名称获取 API 名称
      const apiName = this.apiList[provider];
      // 生成时间戳
      const created = DateTime.timestamp();
      // 统计字数
      const wordCount = q.length;
      data.addTranslationHistory(apiName, provider, created, wordCount);
    }
    return result;
  }

  /**
   * 百度翻译
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<Object>} 返回翻译结果
   */
  async baidu(q, from = 'auto' ,to = 'zh') {
    // 检查 API 是否填写
    if (this.options.baidu_translation_app_id === '' || this.options.baidu_translation_api_key === '') {
      return {result: 'error', msg: '您还没有填写百度翻译 API 信息！'};
    }
    const baiduTranslation = new BaiduTranslation(
      this.options.baidu_translation_app_id,
      this.options.baidu_translation_api_key
    );
    const result = await baiduTranslation.send(q, from, to);
    return result;
  }

  /**
   * 有道翻译
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<Object>} 返回翻译结果
   */
  async youdao(q, from = 'auto' ,to = 'zh') {
    // 检查 API
    if (this.options.youdao_ocr_app_id === '' || this.options.youdao_ocr_app_key === '') {
      return {result: 'error', msg: '您还没有填写有道 API 信息！'};
    }
    const youdaoTranslation = new YoudaoTranslation(
      this.options.youdao_ocr_app_id,
      this.options.youdao_ocr_app_key
    );
    const result = await youdaoTranslation.submit(q, from, to);
    return result;
  }

  /**
   * 阿里翻译
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<Object>} 返回翻译结果
   */
  async ali(q, from = 'auto' ,to = 'zh') {
    // 检查 API
    if (this.options.aliyun_access_key_id === '' || this.options.aliyun_access_key_secret === '') {
      return {result: 'error', msg: '您还没有填写阿里云 API 信息！'};
    }
    const aliyunTranslation = new AliyunTranslation(
      this.options.aliyun_access_key_id,
      this.options.aliyun_access_key_secret
    );
    const result = aliyunTranslation.translateGeneral(q, from, to);
    return result;
  }

  /**
   * 腾讯翻译
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<Object>} 返回翻译结果
   */
  async tencent(q, from = 'auto' ,to = 'zh') {
    // 检查 API
    if (this.options.tencent_ocr_secret_id === '' || this.options.tencent_ocr_secret_key === '') {
      return {result: 'error', msg: '您还没有填写腾讯 API 信息！'};
    }
    const tencentTranslation = new TencentTranslation(
      this.options.tencent_ocr_secret_id,
      this.options.tencent_ocr_secret_key
    );
    const result = await tencentTranslation.textTranslate(q, from, to);
    return result;
  }

  /**
   * 讯飞翻译
   * @param {string} q 要翻译的内容
   * @param {string} from 原文语言
   * @param {string} to 译文语言
   * @returns {Promise<Object>} 返回翻译结果
   */
  async xunfei(q, from = 'auto' ,to = 'zh') {
    // 检查 API
    if (
      this.options.xunfei_ocr_app_id === '' ||
      this.options.xunfei_ocr_api_secret === '' ||
      this.options.xunfei_ocr_api_key === ''
    ) {
      return {result: 'error', msg: '您还没有填写讯飞 API 信息！'};
    }
    const xunfeiTranslation = new XunfeiTranslation(
      this.options.xunfei_ocr_app_id,
      this.options.xunfei_ocr_api_secret,
      this.options.xunfei_ocr_api_key
    );
    const result = xunfeiTranslation.submit(q, from, to);
    return result;
  }
}