import MimoTTS from './MimoTTS.js';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/**
 * 文本转语音 (TTS) 封装模块
 * 支持本地离线语音 (基于 Capacitor) 和 MimoTTS 引擎
 */
export default class TTS {
  /** @type {string} 语音引擎，可选值：'离线语音' | 'MiMo-V2.5-TTS' */
  ttsEngine = '离线语音';
  
  /** @type {MimoTTS|null} MimoTTS 实例对象 */
  mimoTTS = null;
  
  /** @type {string} MimoTTS 的 API Key */
  mimoApiKey = '';
  
  /** @type {number} 语速。注意：离线语音的语速通常范围是 0.1 ~ 2.0（1.0 为正常语速） */
  speed = 5;
  
  /** @type {number} 音量 (0 ~ 10 之间) */
  volume = 9;
  
  /** @type {string} 发音角色 (仅 MimoTTS 适用) */
  mimoTTSVoice = '冰糖';

  /**
   * 构造函数初始化 TTS 模块
   * @param {Object} [options] - 配置选项
   * @param {string} [options.ttsEngine='离线语音'] - 指定使用的语音引擎
   * @param {string} [options.mimoApiKey=''] - Mimo 引擎的 API 密钥
   */
  constructor({ ttsEngine = '离线语音', mimoApiKey = '' } = {}) {
    this.ttsEngine = ttsEngine;
    this.mimoApiKey = mimoApiKey;

    if (this.ttsEngine === 'MiMo-V2.5-TTS') {
      // 使用小米 MiMo-V2.5-TTS
      this.mimoTTS = new MimoTTS(this.mimoApiKey);
    }
  }

  /**
   * 朗读指定文本
   * @param {string} text - 需要朗读的文本内容
   * @param {Function} [onStart] - 开始朗读时的回调函数
   * @param {Function} [onStop] - 朗读结束或停止时的回调函数
   * @param {Function} [onError] - 发生错误时的回调函数，接收错误信息作为参数
   * @returns {Promise<void>}
   */
  async speak(text, onStart, onStop, onError) {
    if (this.ttsEngine === 'MiMo-V2.5-TTS') {
      // 使用 MimoTTS 朗读
      await this.mimoTTS.speak(
        text,
        this.volume,
        this.mimoTTSVoice,
        () => {
          if (typeof onStart === 'function') onStart();
        },
        () => {
          if (typeof onStop === 'function') onStop();
        },
        (errorMessage) => {
          if (typeof onError === 'function') onError(errorMessage);
        }
      );
    } else {
      // 使用离线语音
      try {
        if (typeof onStart === 'function') onStart();
        
        await TextToSpeech.speak({
          text: text,
          rate: this.speed,
          volume: this.volume / 10,
          pitch: 1,
          category: 'ambient',
          queueStrategy: 0,
          lang: 'zh'
        });
        
        if (typeof onStop === 'function') onStop();
      } catch (errorObj) {
        if (typeof onError === 'function') onError(errorObj.message);
        if (typeof onStop === 'function') onStop();
      }
    }
  }

  /**
   * 停止当前朗读
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.ttsEngine === 'MiMo-V2.5-TTS') {
      if (this.mimoTTS) {
        this.mimoTTS.stop();
      }
    } else {
      await TextToSpeech.stop();
    }
  }
}