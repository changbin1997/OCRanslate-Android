<template>
  <div id="options-list">
    <!--百度 OCR -->
    <div>
      <div class="option-group-title">百度 OCR 接口</div>
      <t-cell-group bordered>
        <t-cell title="App ID" @click="showPrompt('百度 App ID', 'baidu_ocr_app_id')" :note="options.options.value.baidu_ocr_app_id"  hover />
        <t-cell title="API Key" @click="showPrompt('百度 API Key', 'baidu_ocr_api_key')" :note="options.options.value.baidu_ocr_api_key" hover />
        <t-cell title="Secret Key" @click="showPrompt('百度 Secret Key', 'baidu_ocr_secret_key')" :note="options.options.value.baidu_ocr_secret_key" hover />
      </t-cell-group>
    </div>
    <!--腾讯OCR-->
    <div>
      <div class="option-group-title">腾讯 OCR 接口</div>
      <t-cell-group bordered>
        <t-cell title="App ID" @click="showPrompt('腾讯 App ID', 'tencent_ocr_app_id')" :note="options.options.value.tencent_ocr_app_id"  hover />
        <t-cell title="Secret ID" @click="showPrompt('腾讯 Secret ID', 'tencent_ocr_secret_id')" :note="options.options.value.tencent_ocr_secret_id" hover />
        <t-cell title="Secret Key" @click="showPrompt('腾讯 Secret Key', 'tencent_ocr_secret_key')" :note="options.options.value.tencent_ocr_secret_key"  hover />
      </t-cell-group>
    </div>
    <!--有道智云 API 接口-->
    <div>
      <div class="option-group-title">有道智云 API 接口</div>
      <t-cell-group bordered>
        <t-cell title="App ID" @click="showPrompt('有道智云 App ID', 'youdao_ocr_app_id')" :note="options.options.value.youdao_ocr_app_id"  hover />
        <t-cell title="App 密钥" @click="showPrompt('有道智云 App 密钥', 'youdao_ocr_app_key')" :note="options.options.value.youdao_ocr_app_key" hover />
      </t-cell-group>
    </div>
    <!--阿里云 API 接口-->
    <div>
      <div class="option-group-title">阿里云 API 接口</div>
      <t-cell-group bordered>
        <t-cell title="AccessKey ID" @click="showPrompt('阿里云 AccessKey ID', 'aliyun_access_key_id')" :note="options.options.value.aliyun_access_key_id"  hover />
        <t-cell title="AccessKey Secret" @click="showPrompt('阿里云 AccessKey Secret', 'aliyun_access_key_secret')" :note="options.options.value.aliyun_access_key_secret" hover />
      </t-cell-group>
    </div>
    <!--百度翻译接口-->
    <div>
      <div class="option-group-title">百度翻译接口</div>
      <t-cell-group bordered>
        <t-cell title="App ID" @click="showPrompt('百度翻译 App ID', 'baidu_translation_app_id')" :note="options.options.value.baidu_translation_app_id"  hover />
        <t-cell title="API Key" @click="showPrompt('百度翻译 API Key', 'baidu_translation_api_key')" :note="options.options.value.baidu_translation_api_key" hover />
      </t-cell-group>
    </div>
    <!--讯飞 API 接口-->
    <div>
      <div class="option-group-title">讯飞 API 接口</div>
      <t-cell-group bordered>
        <t-cell title="App ID" @click="showPrompt('讯飞 App ID', 'xunfei_ocr_app_id')" :note="options.options.value.xunfei_ocr_app_id"  hover />
        <t-cell title="API Secret" @click="showPrompt('讯飞 API Secret', 'xunfei_ocr_api_secret')" :note="options.options.value.xunfei_ocr_api_secret" hover />
        <t-cell title="API Key" @click="showPrompt('讯飞 API Key', 'xunfei_ocr_api_key')" :note="options.options.value.xunfei_ocr_api_key" hover />
      </t-cell-group>
    </div>
    <!--拍照翻译 OCR API 选择-->
    <div>
      <div class="option-group-title">翻译</div>
      <t-cell-group bordered>
        <t-cell title="拍照翻译使用的 OCR 识别接口" @click="showDefaultOcrApiList = true" :note="defaultOcrApiSelected[0]"  hover />
      </t-cell-group>
    </div>
    <!--语音引擎和在线语音的 API 设置-->
    <div>
      <div class="option-group-title">语音引擎相关设置</div>
      <t-cell-group bordered>
        <t-cell title="OCR语音引擎" :note="ocrTtsEngineSelected[0]" @click="showOcrTtsEngineList = true"  hover />
        <t-cell title="翻译语音引擎" :note="translationTtsEngineSelected[0]" @click="showTranslationTtsEngineList = true"  hover />
        <t-cell title="MiMo API Key" @click="showPrompt('MiMo API Key', 'mimo_api_key')" :note="options.options.value.mimo_api_key"  hover />       
      </t-cell-group>
    </div>
    <!--OCR 语音-->
    <div>
      <div class="option-group-title">OCR 语音（离线语音）</div>
      <div class="option-item">
        <div class="option-item-title">OCR 语音语速</div>
        <t-slider v-model="options.options.value.ocr_voice_speed" max="10" min="1" theme="capsule" />
      </div>
      <div class="option-item">
        <div class="option-item-title">OCR 语音音量</div>
        <t-slider v-model="options.options.value.ocr_voice_volume" :min="0" max="10" theme="capsule" />
      </div>
    </div>
    <!--翻译语音-->
    <div>
      <div class="option-group-title">翻译语音（离线语音）</div>
      <div class="option-item">
        <div class="option-item-title">翻译语音语速</div>
        <t-slider v-model="options.options.value.translation_voice_speed" max="10" min="1" theme="capsule" />
      </div>
      <div class="option-item">
        <div class="option-item-title">翻译语音音量</div>
        <t-slider v-model="options.options.value.translation_voice_volume" :min="0" max="10" theme="capsule" />
      </div>
    </div>
    <!--自动执行-->
    <div>
      <div class="option-group-title">自动执行</div>
      <t-cell-group bordered>
        <t-cell title="OCR识别完成后自动朗读" hover>
          <template #note>
            <t-switch v-model="options.options.value.ocr_auto_voice" />
          </template>
        </t-cell>
        <t-cell title="翻译完成后自动朗读" hover>
          <template #note>
            <t-switch v-model="options.options.value.translation_auto_voice" />
          </template>
        </t-cell>
        <t-cell title="打开程序时启动相机" hover>
          <template #note>
            <t-switch v-model="options.options.value.auto_open_camera" />
          </template>
        </t-cell>
      </t-cell-group>
    </div>
    <!--相机和图片处理-->
    <div>
      <div class="option-group-title">相机与图片处理</div>
      <t-cell-group bordered>
        <t-cell title="OCR使用的相机" :note="cameraModeSelected[0]" @click="showCameraModeList = true"  hover />
        <t-cell title="拍摄完成后选择识别区域" hover>
          <template #note>
            <t-switch v-model="options.options.value.image_cropping" />
          </template>
        </t-cell>
      </t-cell-group>
    </div>
    <div class="save-btn-box">
      <t-button @click="updateOptions" size="medium" theme="primary" class="btn">保存设置</t-button>
      <t-button @click="exportOptions" size="medium" theme="primary" class="btn">导出设置</t-button>
      <t-button @click="fileInput.click()" size="medium" theme="primary" class="btn">导入设置</t-button>
    </div>
  </div>
  <!--相机模式选择-->
  <t-popup v-model="showCameraModeList" placement="bottom">
    <t-picker @cancel="showCameraModeList = false" title="OCR使用的相机" :columns="[cameraModeList]" v-model="cameraModeSelected" @confirm="showCameraModeList = false"></t-picker>
  </t-popup>
  <!--OCR语音引擎选择-->
  <t-popup v-model="showOcrTtsEngineList" placement="bottom">
    <t-picker @cancel="showOcrTtsEngineList = false" title="OCR语音引擎" :columns="[ttsEngineList]" v-model="ocrTtsEngineSelected" @confirm="showOcrTtsEngineList = false"></t-picker>
  </t-popup>
  <!--翻译语音引擎选择-->
  <t-popup v-model="showTranslationTtsEngineList" placement="bottom">
    <t-picker @cancel="showTranslationTtsEngineList = false" title="翻译语音引擎" :columns="[ttsEngineList]" v-model="translationTtsEngineSelected" @confirm="showTranslationTtsEngineList = false"></t-picker>
  </t-popup>
  <!--拍照翻译 OCR API 选择-->
  <t-popup v-model="showDefaultOcrApiList" placement="bottom">
    <t-picker @cancel="showDefaultOcrApiList = false" title="拍照翻译使用的 OCR 识别接口" :columns="[defaultOcrApiList]" v-model="defaultOcrApiSelected" @confirm="showDefaultOcrApiList = false"></t-picker>
  </t-popup>
  <!--导入文件的表单-->
  <input type="file" v-show="false" ref="fileInput" @change="inputOptions">
</template>

<script setup>
document.title  = '选项 - OCRanslate';

import {inject, ref} from 'vue';
import {Dialog} from '@capacitor/dialog';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {Toast} from '@capacitor/toast';

// 获取选项数据
const options = inject('options');

// 相机选择列表
const showCameraModeList = ref(false);
const cameraModeList = [
  {label: '设备默认相机', value: '设备默认相机'},
  {label: '程序内置相机', value: '程序内置相机'}
];
const cameraModeSelected = ref([options.options.value.camera_mode]);

// 显示 OCR 语音引擎设置列表
const showOcrTtsEngineList = ref(false);
// 显示翻译语音引擎设置列表
const showTranslationTtsEngineList = ref(false);
// 语音引擎选择列表
const ttsEngineList = [
  {label: '离线语音', value: '离线语音'},
  {label: 'MiMo-V2.5-TTS', value: 'MiMo-V2.5-TTS'}
];
// 选择的 OCR 语音引擎
const ocrTtsEngineSelected = ref([options.options.value.ocr_tts_engine]);
// 选择的翻译语音引擎
const translationTtsEngineSelected = ref([options.options.value.translation_tts_engine]);

// 拍照翻译的 OCR 接口选择列表
const showDefaultOcrApiList = ref(false);
const defaultOcrApiList = [
  {label: '百度云通用文字识别（标准版）', value: '百度云通用文字识别（标准版）'},
  {label: '百度云通用文字识别（高精度版）', value: '百度云通用文字识别（高精度版）'},
  {label: '腾讯云通用印刷体识别', value: '腾讯云通用印刷体识别'},
  {label: '腾讯云通用印刷体识别（高精度版）', value: '腾讯云通用印刷体识别（高精度版）'},
  {label: '腾讯云通用手写体识别', value: '腾讯云通用手写体识别'},
  {label: '腾讯云广告文字识别', value: '腾讯云广告文字识别'},
  {label: '腾讯云通用印刷体识别（精简版）', value: '腾讯云通用印刷体识别（精简版）'},
  {label: '腾讯云通用印刷体识别（高速版）', value: '腾讯云通用印刷体识别（高速版）'},
  {label: '科大讯飞通用文字识别', value: '科大讯飞通用文字识别'},
  {label: '有道智云通用文字识别', value: '有道智云通用文字识别'},
  {label: '阿里云通用文字识别', value: '阿里云通用文字识别'},
  {label: '阿里云全文识别高精版', value: '阿里云全文识别高精版'}
];
const defaultOcrApiSelected = ref([options.options.value.default_ocr_api]);

const fileInput = ref(null);  // 文件表单，用来导入配置

/**
 * 导出设置配置
 * @returns {Promise<void>}
 */
async function exportOptions() {
  try {
    // 把选项转换为 JSON string
    const json = JSON.stringify(options.options.value, null, 2);
    // 将字符串写入应用的 Cache 目录
    const writeResult = await Filesystem.writeFile({
      path: 'OCRanslate-cfg.json',
      data: json,
      directory: Directory.Cache,
      encoding: 'utf8'
    });
    // 调起 Android 原生的分享/保存面板
    await Share.share({
      title: '导出文件',
      text: '请选择文件保存位置',
      url: writeResult.uri,
      dialogTitle: '保存 JSON 文件'
    });
    await Toast.show({text: '已成功导出设置配置'});
  }catch (error) {
    if (error.message !== 'Share canceled') {
      await Dialog.alert({
        title: '出错了',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
  }
}

/**
 * 读取设置配置
 * @returns {Promise<boolean>} 失败返回 false
 */
async function inputOptions() {
  if (fileInput.value.value === '') return false;
  // 不是 JSON
  if (!/\.json$/.test(fileInput.value.files[0].name)) {
    await Dialog.alert({
      title: '不支持的配置文件',
      message: `您选择的 ${fileInput.value.files[0].name} 不是支持的配置文件，请选择 JSON 文件！`,
      buttonTitle: '知道了'
    });
    return false;
  }

  // 读取文件
  const reader = new FileReader();
  reader.readAsText(fileInput.value.files[0]);
  // 读取完成
  reader.addEventListener('load', async ev => {
    try {
      const optionsJson = JSON.parse(ev.target.result);
      // 填入设置
      const keys = Object.keys(optionsJson);
      keys.forEach(key => {
        options.options.value[key] = optionsJson[key];
      });
      // 一些选项需要单独填入
      defaultOcrApiSelected.value[0] = optionsJson.default_ocr_api;
      cameraModeSelected.value[0] = optionsJson.camera_mode;

      const result = await Dialog.confirm({
        title: '配置导入完成',
        message: '您的配置已成功导入，是否要保存设置？',
        okButtonTitle: '保存设置',
        cancelButtonTitle: '暂不保存'
      });
      if (result.value) await updateOptions();
    }catch (error) {
      await Dialog.alert({
        title: '读取文件出错',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
  });
  // 读取失败
  reader.addEventListener('error', async () => {
    await Dialog.alert({
      title: '读取文件出错',
      message: reader.error.name,
      buttonTitle: '关闭'
    });
  });
}

/**
 * 保存设置
 * @returns {Promise<void>}
 */
async function updateOptions() {
  // 把一些分开绑定的列表选项添加到主选项
  options.options.value.default_ocr_api = defaultOcrApiSelected.value[0];
  options.options.value.camera_mode = cameraModeSelected.value[0];
  options.options.value.ocr_tts_engine = ocrTtsEngineSelected.value[0];
  options.options.value.translation_tts_engine = translationTtsEngineSelected.value[0];
  // 保存设置
  await options.updateOptions();
}

/**
 * 显示输入框，用于修改设置
 * @param title 标题
 * @param optionName 选项名
 * @returns {Promise<boolean>}
 */
async function showPrompt(title, optionName) {
  const result = await Dialog.prompt({
    title: title,
    message: `请输入 ${title}`,
    inputText: options.options.value[optionName],
    okButtonTitle: '确定',
    cancelButtonTitle: '取消'
  });
  if (result.cancelled) return false;
  options.options.value[optionName] = result.value;
}
</script>

<style scoped>
#options-list {
  margin-top: 48px;
  margin-bottom: 16px;
  padding: 16px 0;
  width: 100%;
}

/*选项组标题*/
.option-group-title {
  padding: 16px;
  color: #666666;
}
/*一部分选项列表项*/
.option-item {
  background: #FFFFFF;
  padding: 16px 0;
  border-bottom: 1px solid #E7E7E7;
}
.option-item .option-item-title {
  color: #191919;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 16px;
  padding: 0 16px;
}

/*保存按钮区域*/
.save-btn-box {
  padding: 16px;
  display: flex;
  gap: 16px;
}
.save-btn-box .btn {
  flex: 1;
  width: 0;
}
</style>