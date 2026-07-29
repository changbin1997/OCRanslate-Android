<template>
  <div id="ocr-page" v-show="showOcrPage">
    <!--识别结果区域-->
    <div class="ocr-result">
      <p v-for="item in resultList">{{ item }}</p>
    </div>
    <!--工具栏-->
    <div class="toolbar" role="toolbar" v-show="resultList.length">
      <t-button @click="copyText" aria-label="拷贝" size="small" theme="light" :icon="icon.CopyIcon"></t-button>
      <t-button @click="speak" aria-label="朗读" size="small" theme="light" :icon="icon.VoiceWaveIcon"></t-button>
      <t-button @click="toTranslatePage" aria-label="翻译" size="small" theme="light" :icon="icon.TranslateIcon"></t-button>
      <t-button @click="resultList = []" aria-label="清除" size="small" theme="light" :icon="icon.CloseIcon"></t-button>
    </div>
    <!--拍照和相册选择区域-->
    <div class="camera-and-gallery">
      <t-button :disabled="btnDisabled" @click="showApiList = true" aria-label="识别接口" size="large" theme="light" :icon="icon.AppIcon"></t-button>
      <t-button :disabled="btnDisabled" @click="startCamera" size="large" theme="primary" :icon="icon.CameraIcon">相机</t-button>
      <t-button :disabled="btnDisabled" @click="pickImageAndGetBase64" size="large" aria-label="相册" theme="light" :icon="icon.ImageCarouselIcon"></t-button>
    </div>
    <!--OCR API 选择-->
    <t-popup v-model="showApiList" placement="bottom">
      <t-picker @cancel="showApiList = false" title="识别接口" @confirm="apiSelectComplete" :columns="[apiList]" v-model="apiSelected"></t-picker>
    </t-popup>
  </div>
  <!--程序相机组件-->
  <camera ref="cameraRef" @cameraStopped="cameraStopped" @takePhoto="photographyComplete" />
  <!--裁剪图片组件-->
  <imageCropping @complete="imageCroppingComplete" @cancel="cancelImageCropping" ref="imageCroppingRef" v-if="showImageCropping" />
</template>

<script setup>
document.title = 'OCR文字识别 - OCRanslate';

import {h, ref, inject, onBeforeUnmount, onMounted} from 'vue';
// 引入图标
import {
  CameraIcon,
  ImageCarouselIcon,
  AppIcon,
  VoiceWaveIcon,
  CopyIcon,
  TranslateIcon,
  CloseIcon
} from 'tdesign-icons-vue-next';
// 注册图标
const icon = {
  CameraIcon: h(CameraIcon),
  ImageCarouselIcon: h(ImageCarouselIcon),
  AppIcon: h(AppIcon),
  VoiceWaveIcon: h(VoiceWaveIcon),
  CopyIcon: h(CopyIcon),
  TranslateIcon: h(TranslateIcon),
  CloseIcon: h(CloseIcon)
}

import Ocr from './../modules/Ocr.js';
import {Toast} from '@capacitor/toast';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {Clipboard} from '@capacitor/clipboard';
import {useRouter} from 'vue-router';
import {Dialog} from '@capacitor/dialog';
import camera from './camera.vue';
import imageCropping from './image-cropping.vue';
import { ScreenReader } from '@capacitor/screen-reader';
import TTS from './../modules/TTS.js';

const router = useRouter();

const showApiList = ref(false);  // 显示 API 选择列表
const apiSelected = ref(['百度云通用文字识别（高精度版）']);
const apiList = [
  {label: '百度云通用文字识别（标准版）', value: '百度云通用文字识别（标准版）'},
  {label: '百度云通用文字识别（高精度版）', value: '百度云通用文字识别（高精度版）'},
  {label: '腾讯云通用印刷体识别', value: '腾讯云通用印刷体识别'},
  {label: '腾讯云通用印刷体识别（高精度版）', value: '腾讯云通用印刷体识别（高精度版）'},
  {label: '腾讯云通用手写体识别', value: '腾讯云通用手写体识别'},
  {label: '腾讯云广告文字识别', value: '腾讯云广告文字识别'},
  {label: '腾讯云通用印刷体识别（精简版）', value: '腾讯云通用印刷体识别（精简版）'},
  {label: '腾讯云通用印刷体识别（高速版）', value: '腾讯云通用印刷体识别（高速版）'},
  {label: '有道智云通用文字识别', value: '有道智云通用文字识别'},
  {label: '阿里云通用文字识别', value: '阿里云通用文字识别'},
  {label: '阿里云全文识别高精版', value: '阿里云全文识别高精版'}
];
const resultList = ref([]);  // 识别结果
const btnDisabled = ref(false);  // 禁用按钮
const showOcrPage = ref(true);  // 显示 OCR 页面内容，用于启用程序相机的时候隐藏内容
const showImageCropping = ref(false);  // 显示图片裁剪组件

// 获取存储 OCR 识别结果的变量，用于把 OCR 内容发送到翻译页
const translateOcrResult = inject('translateOcrResult');
// 获取存储副标题的变量，让 API 名称显示在副标题
const titleBarApiName = inject('titleBarApiName');
// 获取选项数据
const options = inject('options');
// 获取自动启动相机的状态
const autoOpenCamera = inject('autoOpenCamera');

// 程序相机组件的方法和状态
const cameraRef = ref(null);

// 把 API 名称加入到标题栏
titleBarApiName.setApiName(` - ${apiSelected.value[0]}`);
const ocr = new Ocr(options.options.value);
let isSpeaking = false;   // 记录当前是否正在发音

const imageCroppingRef = ref(null);

// 创建TTS语音对象
const tts = new TTS({
  ttsEngine: options.options.value.ocr_tts_engine,
  mimoApiKey: options.options.value.mimo_api_key
});
tts.speed = options.options.value.ocr_voice_speed;
tts.volume = options.options.value.ocr_voice_volume;

// 组件挂载完毕
onMounted(async () => {
  // 获取最近一次使用的 API
  getLastTimeApiName();
  // 如果设置了打开程序自动启动相机
  if (options.options.value.auto_open_camera && !autoOpenCamera.value) {
    await startCamera();
    autoOpenCamera.value = true;
  }
});

// 组件即将被销毁
onBeforeUnmount(async () => {
  // 如果相机还没有关闭就关闭相机
  if (cameraRef.value.cameraActive) {
    await cameraRef.value.stopCamera();
  }
});

/**
 * 获取最近一次使用的 API
 * @returns {boolean}
 */
function getLastTimeApiName() {
  const name= localStorage.getItem('ocr_api_name');
  if (name === null || name === undefined) return false;
  apiSelected.value = [name];
  titleBarApiName.setApiName(` - ${apiSelected.value[0]}`);
}

/**
 * 保存最近一次使用的 API
 * @param name
 */
function setLastTimeApiName(name) {
  localStorage.setItem('ocr_api_name', name);
}

/**
 * 取消图片裁剪
 */
function cancelImageCropping() {
  showImageCropping.value = false;
  showOcrPage.value = true;
}

/**
 * 图片裁剪完成
 * @param base64Img
 */
function imageCroppingComplete(base64Img) {
  submit(base64Img);
  showImageCropping.value = false;
  showOcrPage.value = true;
}

/**
 * 程序相机关闭
 */
function cameraStopped() {
  if (!showImageCropping.value) showOcrPage.value = true;
}
/**
 * 程序相机拍照完成
 * @param base64Img 接收 base64 照片
 */
function photographyComplete(base64Img) {
  // 如果开启了图片裁剪
  if (options.options.value.image_cropping && showImageCropping.value) {
    base64Img = 'data:image/jpeg;base64,' + base64Img;
    imageCroppingRef.value.loadImg(base64Img);
  }else {
    submit(base64Img);
  }
}

/**
 * 打开系统相机或程序相机
 * @returns {Promise<void>}
 */
async function startCamera() {
  // 清空 OCR 结果
  resultList.value = [];
  if (options.options.value.camera_mode === '程序内置相机') {
    await cameraRef.value.startCamera();
    showOcrPage.value = false;
    // 如果开启了图片裁剪就加载图片裁剪组件
    if (options.options.value.image_cropping) {
      showImageCropping.value = true;
    }
  }else {
    await takePicture();
  }
}

/**
 * 从相册读取 base64 图片
 * @returns {Promise<void>}
 */
async function pickImageAndGetBase64() {
  try {
    // 配置
    const cameraOptions = {
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    };
    // 如果开启了图片裁剪就提前加载图片裁剪组件
    if (options.options.value.image_cropping) {
      showImageCropping.value = true;
      cameraOptions.resultType = CameraResultType.DataUrl;
    }
    // 打开相册读取照片
    const image = await Camera.getPhoto(cameraOptions);
    if (options.options.value.image_cropping) {
      imageCroppingRef.value.loadImg(image.dataUrl);
      showOcrPage.value = false;
    }else {
      await submit(image.base64String);
    }
  } catch (error) {
    if (error.message !== 'User cancelled photos app') {
      await Dialog.alert({
        title: '出错了',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
    if (showImageCropping.value) showImageCropping.value = false;
  }
}

/**
 * 跳转到翻译页翻译 OCR 内容
 * @returns {boolean}
 */
function toTranslatePage() {
  if (resultList.value.length < 1) return false;
  // 把 OCR 内容暂存到 App，用于翻译
  translateOcrResult.changeTranslateOcrResult(resultList.value.join('\n'));
  router.push({name: 'translatePage'});
}

/**
 * 朗读内容
 * @returns {boolean} 没有内容返回 false
 */
async function speak() {
  if (resultList.value.length < 1) return false;

  if (isSpeaking) {
    // 如果正在朗读就停止朗读
    tts.stop();
    isSpeaking = false;
  }else {
    // 去除一些特殊符号
    const text = cleanForTTS(resultList.value.join('\n'));
    // 开始朗读
    await tts.speak(text, () => {
      isSpeaking = true;
    }, () => {
      isSpeaking = false;
    }, async errorMessage => {
      await Toast.show({text: errorMessage});
      // 发生错误时重置状态
      isSpeaking = false;
      // 朗读出错就调用读屏朗读
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
 * 拷贝识别文本
 * @returns {Promise<boolean>} 没有内容返回 false
 */
async function copyText() {
  if (resultList.value.length < 1) return false;
  const text = resultList.value.join('\n');
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
 * 打开相机拍摄识别
 * @returns {Promise<void>}
 */
async function takePicture() {
  try {
    // 相机配置
    const cameraOptions = {
      quality: 90,
      allowEditing: false,
      resultType: 'base64',
      source: 'CAMERA',
      saveToGallery: false,
      height: 1600
    }
    // 如果开启了裁剪图片就提前加载裁剪图片组件
    if (options.options.value.image_cropping) {
      showImageCropping.value = true;
      cameraOptions.resultType = CameraResultType.DataUrl;
    }
    // 拍照
    const image = await Camera.getPhoto(cameraOptions);
    if (options.options.value.image_cropping) {
      imageCroppingRef.value.loadImg(image.dataUrl);
      showOcrPage.value = false;
    }else {
      await submit(image.base64String);
    }
  }catch (error) {
    if (error.message !== 'User cancelled photos app') {
      await Dialog.alert({
        title: '出错了',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
    if (showImageCropping.value) showImageCropping.value = false;
  }
}

/**
 * 提交 OCR 识别
 * @param base64Img base64图片
 * @returns {Promise<boolean>}  出错返回 false
 */
async function submit(base64Img) {
  // 保存当前使用的 API，下次默认使用本次使用的 API 接口
  setLastTimeApiName(apiSelected.value[0]);
  btnDisabled.value = true;
  // 调用识别
  const result = await ocr.submit(base64Img, apiSelected.value[0]);
  btnDisabled.value = false;
  // 出错
  if (result.result !== 'success' && result.msg !== undefined) {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  // 没有文字
  if (typeof result.list !== 'object' || result.list.length < 1) {
    await Dialog.alert({
      title: '未检测到文字',
      message: '您提交的图片中没有检测到文字！',
      buttonTitle: '关闭'
    });
    return false;
  }

  resultList.value = result.list;

  // 如果开启了 OCR 识别完成后朗读就朗读识别文字
  if (options.options.value.ocr_auto_voice) {
    speak();
  }else {
    // 如果没有开启自动朗读就尝试让屏幕阅读器朗读
    await ScreenReader.speak({
      value: resultList.value.join('\n')
    });
  }
}

/**
 * API 选择完成
 * @param value 选择的 API
 * @returns {Promise<void>}
 */
async function apiSelectComplete(value) {
  showApiList.value = false;
  await Toast.show({text: `已切换为 ${value[0]}`});
  titleBarApiName.setApiName(` - ${apiSelected.value[0]}`);
}
</script>

<style scoped>
/*拍照和相册*/
.camera-and-gallery {
  width: 100%;
  height: 100px;
  position: fixed;
  bottom: 56px;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #FFFFFF;
}

/*识别结果*/
.ocr-result {
  margin-top: 48px;
  padding: 16px;
  margin-bottom: 216px;
}
.ocr-result p {
  margin: 0 0 16px 0;
  font-size: 16px;
}

/*工具栏*/
.toolbar {
  width: 100%;
  height: 56px;
  position: fixed;
  bottom: 156px;
  left: 0;
  background: #FFFFFF;
  border-bottom: 1px solid #E7E7E7;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>