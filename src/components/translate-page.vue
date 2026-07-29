<template>
  <div id="translate-page" v-show="showTranslatePage">
    <!--语言选择区域-->
    <div class="language-select-box">
      <t-button :disabled="btnDisabled" @click="showSrcLanguageList = true" class="language-select-btn" size="medium" theme="primary" variant="outline">{{srcLanguageName}}</t-button>
      <t-button :disabled="btnDisabled" @click="exchangeLanguage" aria-label="交换语言" id="exchange-language" size="medium" theme="light" :icon="icon.ArrowLeftRight1Icon"></t-button>
      <t-button :disabled="btnDisabled" @click="showDstLanguageList = true" class="language-select-btn" size="medium" theme="primary" variant="outline">{{dstLanguageName}}</t-button>
    </div>
    <div class="text-box">
      <!--原文输入区域-->
      <div id="src-box">
        <t-textarea v-model="srcText" id="src-textarea" :indicator="true" autosize placeholder="请输入要翻译的内容"></t-textarea>
      </div>
      <!--原文工具栏-->
      <div class="toolbar" role="toolbar" v-show="srcText.length">
        <t-button @click="clear" aria-label="清空" size="small" theme="primary" variant="text" :icon="icon.CloseIcon"></t-button>
        <t-button @click="copyText('src')" aria-label="拷贝" size="small" theme="primary" variant="text" :icon="icon.CopyIcon"></t-button>
      </div>
      <hr v-show="dstTextList.length">
      <div id="dst-box">
        <p v-for="item in dstTextList">{{item}}</p>
      </div>
      <!--译文工具栏-->
      <div class="toolbar" role="toolbar" v-if="dstTextList.length">
        <t-button @click="speak" aria-label="朗读" size="small" theme="light" :icon="icon.VoiceWaveIcon"></t-button>
        <t-button @click="copyText('dst')" aria-label="拷贝" size="small" theme="primary" variant="text" :icon="icon.CopyIcon"></t-button>
      </div>
    </div>
    <!--翻译按钮区域-->
    <div class="translate-btn-box">
      <t-button :disabled="btnDisabled" @click="startCamera" aria-label="拍照" size="large" theme="light" :icon="icon.CameraIcon"></t-button>
      <t-button :disabled="btnDisabled" @click="submit" size="large" theme="primary">翻译</t-button>
      <t-button :disabled="btnDisabled" @click="showTranslateApi = true" aria-label="翻译接口" size="large" theme="light" :icon="icon.AppIcon"></t-button>
    </div>
    <!--翻译接口选择-->
    <t-popup v-model="showTranslateApi" placement="bottom">
      <t-picker title="翻译引擎" @cancel="showTranslateApi = false" @confirm="translateApiSelectComplete" :columns="[translateApiList]" v-model="translateApiSelected"></t-picker>
    </t-popup>
    <!--原文语言选择-->
    <t-popup v-model="showSrcLanguageList" placement="bottom">
      <t-picker title="原文语言" @cancel="showSrcLanguageList = false" @confirm="srcLanguageSelectComplete" :columns="[srcLanguageList]" v-model="srcLanguageSelected"></t-picker>
    </t-popup>
    <!--译文语言选择-->
    <t-popup v-model="showDstLanguageList" placement="bottom">
      <t-picker title="译文语言" @cancel="showDstLanguageList = false" @confirm="dstLanguageSelectComplete" :columns="[dstLanguageList]" v-model="dstLanguageSelected"></t-picker>
    </t-popup>
  </div>
  <!--程序相机组件-->
  <camera ref="cameraRef" @cameraStopped="showTranslatePage = true" @takePhoto="photographyComplete" />
</template>

<script setup>
document.title  = '翻译 - OCRanslate';
import {h, ref, inject, onBeforeUnmount, onMounted} from 'vue';
import languageList from './../modules/language-list.js';
import Translation from './../modules/Translation.js';
import {Clipboard} from '@capacitor/clipboard';
import {Toast} from '@capacitor/toast';
import { Camera } from '@capacitor/camera';
import {Dialog} from '@capacitor/dialog';
import Ocr from './../modules/Ocr.js';
import camera from './camera.vue';
import TTS from './../modules/TTS.js';
import { ScreenReader } from '@capacitor/screen-reader';

// 引入图标
import {
  ArrowLeftRight1Icon,
  CopyIcon,
  CloseIcon,
  VoiceWaveIcon,
  CameraIcon,
  AppIcon
} from 'tdesign-icons-vue-next'
// 注册图标
const icon = {
  ArrowLeftRight1Icon: h(ArrowLeftRight1Icon),
  CopyIcon: h(CopyIcon),
  CloseIcon: h(CloseIcon),
  VoiceWaveIcon: h(VoiceWaveIcon),
  CameraIcon: h(CameraIcon),
  AppIcon: h(AppIcon)
};

const srcText = ref('');  // 原文
const dstTextList = ref([]);  // 译文
const showTranslateApi = ref(false);  // 显示翻译提供商选择
const translateApiSelected = ref(['baidu']);  // 默认使用的翻译提供商
// 翻译提供商列表
const translateApiList = [
  {label: '百度翻译', value: 'baidu'},
  {label: '腾讯翻译', value: 'tencent'},
  {label: '有道翻译', value: 'youdao'},
  {label: '阿里翻译', value: 'ali'},
  {label: '讯飞翻译', value: 'xunfei'}
];

const srcLanguageList = ref(languageList.baidu);  // 原文语言列表
const dstLanguageList = ref(languageList.baidu.filter(item => item.value !== 'auto'));  // 译文语言列表
const srcLanguageSelected = ref([srcLanguageList.value[0].value]);  // 选择的原文语言
const dstLanguageSelected = ref([dstLanguageList.value[0].value]);  // 选择的译文语言
const srcLanguageName = ref(srcLanguageList.value[0].label)  // 选择的原文语言名称
const dstLanguageName = ref(dstLanguageList.value[0].label);  // 选择的译文语言名称
const showSrcLanguageList = ref(false);  // 显示原文语言选择列表
const showDstLanguageList = ref(false);  // 显示域文语言选择列表
const btnDisabled = ref(false);  // 禁用按钮
const showTranslatePage = ref(true);  // 显示和隐藏翻译页面的内容，用于程序相机开启时隐藏页面内容
let isSpeaking = false;   // 记录当前是否正在发音


// 获取 OCR 内容
const translateOcrResult = inject('translateOcrResult');
// 如果有 OCR 内容就把内容填写到翻译输入框，然后删除内容
if (translateOcrResult.translateOcrResult.value !== '') {
  srcText.value = translateOcrResult.translateOcrResult.value;
  translateOcrResult.changeTranslateOcrResult('');
}

// 把翻译提供商的名称加入到标题栏
const titleBarApiName = inject('titleBarApiName');
titleBarApiName.setApiName(
  ` - ${translateApiList.find(item => item.value === translateApiSelected.value[0]).label}`
);

// 获取选项数据
const options = inject('options');

// 初始化翻译
const translation = new Translation(options.options.value);

// 程序相机的方法和状态
const cameraRef = ref(null);

// 初始化语音
const tts = new TTS({
  ttsEngine: options.options.value.translation_tts_engine,
  mimoApiKey: options.options.value.mimo_api_key
});
// 设置语速和音量
tts.speed = options.options.value.translation_voice_speed;
tts.volume = options.options.value.translation_voice_volume;

// 组件挂载完成
onMounted(() => {
  getLastTimeTranslationApi();
});

// 组件即将被销毁
onBeforeUnmount(async () => {
  // 如果相机还没有关闭就关闭相机
  if (cameraRef.value.cameraActive) {
    cameraRef.value.stopCamera();
  }
});

/**
 * 读取和设置最近一次使用的 API 信息
 * @returns {boolean}
 */
function getLastTimeTranslationApi() {
  let api = localStorage.getItem('translation_api');
  if (api === null || api === undefined) return false;
  try {
    api = JSON.parse(api);
    // 根据选择的提供商重新设置语言列表
    srcLanguageList.value = languageList[api.apiName];
    dstLanguageList.value = languageList[api.apiName].filter(item => item.value !== 'auto');
    // 设置 API
    translateApiSelected.value = [api.apiName];
    // 设置选中的语言
    srcLanguageSelected.value = [api.from];
    dstLanguageSelected.value = [api.to];
    // 设置选中的语言名称
    srcLanguageName.value = srcLanguageList.value.find(item => item.value === api.from).label;
    dstLanguageName.value = dstLanguageList.value.find(item => item.value === api.to).label;
    // 把提供商加入到标题栏
    titleBarApiName.setApiName(
      ` - ${translateApiList.find(item => item.value === api.apiName).label}`
    );
  }catch (error) {
    return false;
  }
}

/**
 * 保存最近一次使用的 API 信息
 */
function setLastTimeTranslationApi() {
  const api = {
    apiName: translateApiSelected.value[0],
    from: srcLanguageSelected.value[0],
    to: dstLanguageSelected.value[0]
  };
  localStorage.setItem('translation_api', JSON.stringify(api));
}

/**
 * 程序相机拍照完成
 * @param base64Img 接收 base64 照片
 */
async function photographyComplete(base64Img) {
  // 调用 OCR 识别提取文本
  await extractText(base64Img);
}

/**
 * 打开系统相机或程序相机
 * @returns {Promise<void>}
 */
async function startCamera() {
  clear();
  if (options.options.value.camera_mode === '程序内置相机') {
    await cameraRef.value.startCamera();
    showTranslatePage.value = false;
  }else {
    await takePicture();
  }
}

/**
 * 打开相机拍摄识别
 * @returns {Promise<void>}
 */
async function takePicture() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: 'base64',
      source: 'CAMERA',
      saveToGallery: false,
      height: 1600
    });
    // 调用 OCR 识别提取文本
    await extractText(image.base64String);
  }catch (error) {
    if (error.message !== 'User cancelled photos app') {
      await Dialog.alert({
        title: '出错了',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
  }
}

/**
 * 提交 OCR 识别
 * @param base64Img base64图片
 * @returns {Promise<boolean>}  出错返回 false
 */
async function extractText(base64Img) {
  btnDisabled.value = true;
  const ocr = new Ocr(options.options.value);
  const result = await ocr.submit(base64Img, options.options.value.default_ocr_api);
  btnDisabled.value = false;
  if (result.result !== 'success' && result.msg !== undefined) {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }

  if (typeof result.list !== 'object' || result.list.length < 1) {
    await Dialog.alert({
      title: '未检测到文字',
      message: '您提交的图片中没有检测到文字！',
      buttonTitle: '关闭'
    });
    return false;
  }

  // 把 OCR 识别到的文字填写到翻译原文输入框
  srcText.value = result.list.join('\n');
  // 提交翻译
  await submit();
}

/**
 * 拷贝翻译内容
 * @param textType 要拷贝的内容区域，dst 的译文，src 是原文
 * @returns {Promise<void>}
 */
async function copyText(textType = 'src') {
  let text = srcText.value;
  if (textType === 'dst') text = dstTextList.value.join('\n');
  try {
    await Clipboard.write({string: text});
    await Toast.show({text: '拷贝成功'});
  }catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}

/**
 * 朗读内容
 * @returns {boolean} 没有内容返回 false
 */
async function speak() {
  if (dstTextList.value.length < 1) return false;

  if (isSpeaking) {
    // 正在朗读就停止朗读
    await tts.stop();
    isSpeaking = false;
  }else {
    // 获取译文语言
    const dstLang = dstLanguageSelected.value[0];
    // 如果是中文就设置适合中文的发音角色
    const zhList = ['zh', 'cht', 'zh-TW', 'cn', 'zh-CHS', 'zh-CHT', 'zh-tw'];
    if (zhList.indexOf(dstLang) > -1) {
      tts.mimoTTSVoice = '冰糖';
    }
    // 如果是英文就设置适合英文的发音角色
    if (zhList === 'en') {
      tts.mimoTTSVoice = 'Mia';
    }

    // 去除一些无法朗读的特殊符号
    const text = cleanForTTS(dstTextList.value.join('\n'));
    // 开始朗读
    await tts.speak(text, () => {
      isSpeaking = true;
    }, () => {
      isSpeaking = false;
    }, async errorMessage => {
      await Toast.show({text: errorMessage});
      // 发生错误时重置状态
      isSpeaking = false;
      // 朗读粗错就使用屏幕阅读器朗读
      await ScreenReader.speak({value: text});
    });
  }
}

/**
 * 删除一些可能会影响语音合成的特殊符号
 * @param text 要处理的文本
 * @returns {*} 返回处理后的文本
 */
function cleanForTTS(text) {
  return text
    // 删除零宽字符
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // 删除项目符号区块
    .replace(/[\u25A0-\u25FF]+/g, '')
    // 删除各种 Symbol
    .replace(/\p{So}/gu, '')
    // 压缩空白
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 提交翻译
 * @returns {Promise<boolean>} 出错时返回 false
 */
async function submit() {
  if (srcText.value === '') return false;
  // 原文语言额译文语言相同
  if (srcLanguageSelected.value[0] === dstLanguageSelected.value[0]) {
    await Toast.show({text: '原文和译文不能使用相同的语言！'});
    return false;
  }
  // 获取 API 提供商
  const api = translateApiSelected.value[0];
  btnDisabled.value = true;
  // 提交翻译
  const result = await translation.submit(
    api,
    srcText.value,
    srcLanguageSelected.value[0],
    dstLanguageSelected.value[0]
  );
  // 保存本次使用的 API 和语言，下次打开程序默认使用本次的 API 和语言。
  setLastTimeTranslationApi();
  btnDisabled.value = false;
  // 失败
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  // 提取译文内容
  const dst = [];
  result.data.trans_result.forEach(val => {
    dst.push(val.dst);
  });
  dstTextList.value = dst;

  // 如果开启了翻译完成后自动朗读就朗读译文
  if (options.options.value.translation_auto_voice) {
    speak();
  }else {
    // 没有开启自动朗读就尝试使用屏幕阅读器朗读
    ScreenReader.speak({value: dst.join('\n')});
  }
}

/**
 * 交换语言
 * @returns {boolean} 包含自动检测返回 false
 */
async function exchangeLanguage() {
  // 如果包含自动检测语言就返回
  if (srcLanguageSelected.value[0] === 'auto') {
    await Toast.show({text: '译文语言不能使用自动检测语言！'});
    return false;
  }
  const languageSelect = {
    src: dstLanguageSelected.value[0],
    dst: srcLanguageSelected.value[0]
  };
  srcLanguageSelected.value = [languageSelect.src];
  dstLanguageSelected.value = [languageSelect.dst];
  // 重新设置语言名称
  srcLanguageName.value = srcLanguageList.value.find(item => item.value === languageSelect.src).label;
  dstLanguageName.value = dstLanguageList.value.find(item => item.value === languageSelect.dst).label
}

/**
 * 清除翻译
 */
function clear() {
  srcText.value = '';
  dstTextList.value = [];
}

/**
 * 翻译接口选择完成
 * @param api 翻译提供商名称
 */
function translateApiSelectComplete(api) {
  // 根据选择的提供商重新设置语言列表
  srcLanguageList.value = languageList[api[0]];
  dstLanguageList.value = languageList[api[0]].filter(item => item.value !== 'auto');
  // 设置默认选中的语言
  srcLanguageSelected.value = [srcLanguageList.value[0].value];
  dstLanguageSelected.value = [dstLanguageList.value[0].value];
  // 设置默认选中的语言名称
  srcLanguageName.value = srcLanguageList.value[0].label;
  dstLanguageName.value = dstLanguageList.value[0].label;
  showTranslateApi.value = false;
  // 显示提示
  const apiName = translateApiList.find(item => item.value === api[0]);
  Toast.show({text: `已切换为 ${apiName.label}`});
  // 把提供商加入到标题栏
  titleBarApiName.setApiName(
    ` - ${translateApiList.find(item => item.value === translateApiSelected.value[0]).label}`
  );
}

/**
 * 原文语言选择完成
 * @param value
 */
function srcLanguageSelectComplete(value) {
  srcLanguageName.value = srcLanguageList.value.find(item => item.value === value[0]).label;
  showSrcLanguageList.value = false;
}

/**
 * 译文语言选择完成
 * @param value
 */
function dstLanguageSelectComplete(value) {
  dstLanguageName.value = dstLanguageList.value.find(item => item.value === value[0]).label;
  showDstLanguageList.value = false;
}
</script>

<style scoped>
/*语言选择区域*/
.language-select-box {
  display: flex;
  gap: 16px;
  background: #FFFFFF;
  position: fixed;
  top: 48px;
  left: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}
.language-select-box .language-select-btn {
  flex: 1;
}

/*原文和译文区域*/
.text-box {
  margin-top: 120px;
  margin-bottom: 172px;
}
.text-box hr {
  background: #868686;
}

/*原文输入区域*/
#src-textarea {
  background: none;
}

/*译文显示区域*/
#dst-box {
  padding: 0 16px;
}
#dst-box p {
  font-size: 16px;
  margin: 0 0 16px 0;
}

/*翻译按钮区域*/
.translate-btn-box {
  position: fixed;
  bottom: 56px;
  left: 0;
  background: #FFFFFF;
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>