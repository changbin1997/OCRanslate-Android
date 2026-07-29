/**
 * @file MimoTTS.js
 * @description MiMo-V2.5-TTS 语音合成客户端封装类
 */

/**
 * @callback OnStartCallback
 * @description 开始播放音频时的回调函数
 */

/**
 * @callback OnEndCallback
 * @description 已停止/播放完毕音频时的回调函数
 */

/**
 * @callback OnErrorCallback
 * @description 发生错误时的回调函数
 * @param {string} errorMessage - 详细错误描述信息
 */

/**
 * MiMo-V2.5-TTS 流式语音合成与播放管理类
 */
export default class MimoTTS {
  /**
   * 创建 MimoTTS 实例
   * @param {string} apiKey - 小米 MiMo 的 API Key
   * @param {string} [voice="冰糖"] - 发音角色，默认为 "冰糖"
   */
  constructor(apiKey, voice = '冰糖') {
    if (!apiKey) {
      throw new Error('MimoTTS: apiKey 为必填参数');
    }

    /** @type {string} API 密钥 */
    this.apiKey = apiKey;

    /** @type {string} 发音角色 */
    this.voice = voice;

    /** @type {AudioContext|null} Web Audio API 上下文实例 */
    this.audioCtx = null;

    /** @type {GainNode|null} 音量控制节点 */
    this.gainNode = null;

    /**
     * 音频缓存对象
     * @type {{ text: string, audioBuffer: AudioBuffer } | null}
     */
    this.cache = null;

    /** @type {AudioBufferSourceNode[]} 当前正在排期或播放的 AudioBufferSourceNode 节点数组 */
    this.activeSources = [];

    /** @type {number|null} 用于触发 onEnd 回调的定时器句柄 */
    this.endTimeoutId = null;
  }

  /**
   * 初始化 Web Audio API 上下文与音量控制节点
   * @private
   * @param {number} volume - 外部输入的音量数值 (0 - 10)
   */
  _initAudioContext(volume) {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
    }

    // 浏览器可能会挂起 AudioContext，需要在此恢复
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (!this.gainNode) {
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);
    }

    // 将 0-10 范围的音量映射转换为 Web Audio API 的 0.0 - 1.0 增益值
    const clampedVolume = Math.max(0, Math.min(10, volume));
    this.gainNode.gain.value = clampedVolume / 10.0;
  }

  /**
   * 停止当前所有正在播放或排期的音频节点，并清除定时器
   */
  stop() {
    if (this.endTimeoutId) {
      clearTimeout(this.endTimeoutId);
      this.endTimeoutId = null;
    }

    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // 忽略已停止节点抛出的异常
      }
    });

    this.activeSources = [];
  }

  /**
   * 播放已缓存的音频数据
   * @private
   * @param {OnStartCallback} [onStart] - 开始播放回调
   * @param {OnEndCallback} [onEnd] - 播放结束回调
   * @param {OnErrorCallback} [onError] - 错误回调
   */
  _playFromCache(onStart, onEnd, onError) {
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.cache.audioBuffer;
      source.connect(this.gainNode);

      this.activeSources.push(source);

      // 音频播放结束事件监听
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
        if (this.activeSources.length === 0 && typeof onEnd === 'function') {
          onEnd();
        }
      };

      if (typeof onStart === 'function') {
        onStart();
      }

      source.start(0);
    } catch (err) {
      if (typeof onError === 'function') {
        onError(`播放缓存音频失败: ${err.message || err}`);
      }
    }
  }

  /**
   * 发起 API 请求并流式合成/播放语音
   * @private
   * @param {string} text - 合成文本
   * @param {OnStartCallback} [onStart] - 开始播放回调
   * @param {OnEndCallback} [onEnd] - 播放结束回调
   * @param {OnErrorCallback} [onError] - 错误回调
   */
  async _fetchAndPlayStream(text, onStart, onEnd, onError) {
    let nextPlayTime = this.audioCtx.currentTime;
    let hasTriggeredStart = false;
    /** @type {Float32Array[]} 用于收集当前流中的 PCM 切片，播放完成后拼接并写入缓存 */
    const pcmChunks = [];

    try {
      const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mimo-v2.5-tts',
          messages: [
            {
              role: 'user',
              content: '说话语速很快。'
            },
            {
              role: 'assistant',
              content: text
            }
          ],
          audio: {
            format: 'pcm16',
            voice: this.voice
          },
          stream: true
        })
      });

      // HTTP 状态码异常处理
      if (!response.ok) {
        const errText = await response.text();
        if (typeof onError === 'function') {
          onError(`API 请求失败 [HTTP ${response.status}]: ${errText}`);
        }
        return;
      }

      if (!response.body) {
        if (typeof onError === 'function') {
          onError('服务器响应异常：未返回数据流 (response.body 为空)');
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let bufferStr = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferStr += decoder.decode(value, { stream: true });
        const lines = bufferStr.split('\n');
        bufferStr = lines.pop() || ''; // 保留未完整的末尾字符串

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const dataStr = trimmedLine.substring(6);
          if (dataStr === '[DONE]') continue;

          let chunkJson;
          try {
            chunkJson = JSON.parse(dataStr);
          } catch (e) {
            // 忽略单行格式异常的 JSON
            continue;
          }

          const audioBase64 = chunkJson.choices?.[0]?.delta?.audio?.data;

          if (audioBase64) {
            // 首次解码到有效音频数据时触发 onStart 回调
            if (!hasTriggeredStart) {
              hasTriggeredStart = true;
              if (typeof onStart === 'function') {
                onStart();
              }
            }

            // 1. Base64 解码为二进制数据
            const binaryString = atob(audioBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // 2. 将 PCM16 (Int16) 转换成 Float32 (-1.0 ~ 1.0)
            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              float32Array[i] = int16Array[i] / 32768.0;
            }

            // 收集 PCM 分片用于后续缓存
            pcmChunks.push(float32Array);

            // 3. 构建 AudioBuffer 并播放
            const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const source = this.audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.gainNode);

            this.activeSources.push(source);

            // 4. 无缝无卡顿的排期计算
            const playTime = Math.max(this.audioCtx.currentTime, nextPlayTime);
            source.start(playTime);

            nextPlayTime = playTime + audioBuffer.duration;
          }
        }
      }

      // 数据流接收完毕，整理全量音频并写入缓存
      if (pcmChunks.length > 0) {
        const totalSamples = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const mergedPCM = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of pcmChunks) {
          mergedPCM.set(chunk, offset);
          offset += chunk.length;
        }

        const fullAudioBuffer = this.audioCtx.createBuffer(1, totalSamples, 24000);
        fullAudioBuffer.getChannelData(0).set(mergedPCM);

        // 覆盖/更新缓存
        this.cache = {
          text: text,
          audioBuffer: fullAudioBuffer
        };

        // 计算所有音频块播放结束的时长，并设置定时器触发 onEnd 回调
        const delayMs = Math.max(0, (nextPlayTime - this.audioCtx.currentTime) * 1000);
        this.endTimeoutId = setTimeout(() => {
          this.activeSources = [];
          if (typeof onEnd === 'function') {
            onEnd();
          }
        }, delayMs);
      } else if (!hasTriggeredStart) {
        if (typeof onError === 'function') {
          onError('服务器成功响应，但未接收到有效音频片段');
        }
      }
    } catch (err) {
      if (typeof onError === 'function') {
        onError(`网络请求或播放异常: ${err.message || err}`);
      }
    }
  }

  /**
   * 触发语音合成并播放音频
   *
   * @param {string} text - 需要合成语音的文本内容
   * @param {number} [volume=5] - 音量大小 (0 - 10 之间的数字，默认 5)
   * @param {string} voice - 发音角色
   * @param {OnStartCallback} [onStart] - 开始播放音频的回调函数
   * @param {OnEndCallback} [onEnd] - 停止/播放完毕音频的回调函数
   * @param {OnErrorCallback} [onError] - 发生错误时的回调函数
   * @returns {Promise<void>}
   */
  async speak(text, volume = 5, voice = '冰糖', onStart, onEnd, onError) {
    this.voice = voice;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      if (typeof onError === 'function') {
        onError('传入的文本内容不能为空');
      }
      return;
    }

    // 在开始新播放前，打断并停止上一轮未播放完的音频
    this.stop();

    // 初始化/更新音频上下文及音量大小
    this._initAudioContext(volume);

    // 检查缓存：如果文本与上次相同，直接使用缓存播放，不请求 API
    if (this.cache && this.cache.text === text) {
      this._playFromCache(onStart, onEnd, onError);
      return;
    }

    // 文本不同，清除旧缓存
    this.cache = null;

    // 发起接口调用并进行流式播放
    await this._fetchAndPlayStream(text, onStart, onEnd, onError);
  }
}