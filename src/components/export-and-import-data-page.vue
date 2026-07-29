<template>
  <div id="export-and-import-data-page">
    <t-button @click="exportOcrHistory" class="btn" size="large" theme="primary" block>导出 OCR 记录</t-button>
    <t-button @click="ocrFileInput.click()" class="btn" size="large" theme="primary" block>导入 OCR 记录</t-button>
    <t-button @click="exporttranslationHistory" class="btn" size="large" theme="primary" block>导出翻译记录</t-button>
    <t-button @click="translationFileInput.click()" class="btn" size="large" theme="primary" block>导入翻译记录</t-button>
    <!--导入OCR记录的文件表单-->
    <input type="file" id="ocr-input" v-show="false" ref="ocrFileInput" @change="importOcrHistory">
    <!--导入翻译记录的文件表单-->
    <input type="file" id="translation-input" v-show="false" ref="translationFileInput" @change="importTranslationHistory">
  </div>
</template>

<script setup>
document.title = '导出和导入记录 - OCRanslate';

import data from './../modules/Data.js';
import {Dialog} from '@capacitor/dialog';
import {Toast} from '@capacitor/toast';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {ref} from 'vue';

const ocrFileInput = ref(null);
const translationFileInput = ref(null);


/**
 * 导入翻译记录
 * @returns {Promise<boolean>}
 */
async function importTranslationHistory() {
  if (translationFileInput.value.value === '') return false;
  // 不是 JSON
  if (!/\.json$/.test(translationFileInput.value.files[0].name)) {
    await Dialog.alert({
      title: '不支持的配置文件',
      message: `您选择的 ${translationFileInput.value.files[0].name} 不是支持的配置文件，请选择 JSON 文件！`,
      buttonTitle: '知道了'
    });
    return false;
  }
  // 读取文件
  const reader = new FileReader();
  reader.readAsText(translationFileInput.value.files[0]);
  // 读取完成
  reader.addEventListener('load', async ev => {
    try {
      const jsonData = JSON.parse(ev.target.result);
      const result = await data.importTranslationHistory(jsonData);
      if (result.result !== 'success') {
        await Dialog.alert({
          title: '导入数据出错',
          message: result.msg,
          buttonTitle: '关闭'
        });
        return false;
      }
      await Toast.show({text: `已成功导入 ${result.count} 条记录`});
    }catch (error) {
      await Dialog.alert({
        title: '读取文件出错',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
  });
}

/**
 * 导入 OCR 记录
 * @returns {Promise<boolean>}
 */
async function importOcrHistory() {
  if (ocrFileInput.value.value === '') return false;
  // 不是 JSON
  if (!/\.json$/.test(ocrFileInput.value.files[0].name)) {
    await Dialog.alert({
      title: '不支持的配置文件',
      message: `您选择的 ${ocrFileInput.value.files[0].name} 不是支持的配置文件，请选择 JSON 文件！`,
      buttonTitle: '知道了'
    });
    return false;
  }
  // 读取文件
  const reader = new FileReader();
  reader.readAsText(ocrFileInput.value.files[0]);
  // 读取完成
  reader.addEventListener('load', async ev => {
    try {
      const jsonData = JSON.parse(ev.target.result);
      const result = await data.importOcrHistory(jsonData);
      if (result.result !== 'success') {
        await Dialog.alert({
          title: '导入数据出错',
          message: result.msg,
          buttonTitle: '关闭'
        });
        return false;
      }
      await Toast.show({text: `已成功导入 ${result.count} 条记录`});
    }catch (error) {
      await Dialog.alert({
        title: '读取文件出错',
        message: error.message,
        buttonTitle: '关闭'
      });
    }
  });
}

/**
 * 导出翻译记录
 * @returns {Promise<boolean>}
 */
async function exporttranslationHistory() {
  // 获取翻译记录
  const result = await data.exporttranslationHistory();
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  // 没有数据
  if (result.data.length < 1) {
    await Toast.show({text: '没有可导出的数据！'});
    return false;
  }

  try {
    const jsonStr = JSON.stringify(result.data, null, 2);
    // 将字符串写入应用的 Cache 目录
    const writeResult = await Filesystem.writeFile({
      path: 'OCRanslate-translation-history.json',
      data: jsonStr,
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
    await Toast.show({text: '已成功导出翻译记录'});
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
 * 导出 OCR 记录
 * @returns {Promise<boolean>}
 */
async function exportOcrHistory() {
  // 获取 OCR 数据
  const result = await data.exportOcrHistory();
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  // 没有数据
  if (result.data.length < 1) {
    await Toast.show({text: '没有可导出的数据！'});
    return false;
  }

  try {
    const jsonStr = JSON.stringify(result.data, null, 2);
    // 将字符串写入应用的 Cache 目录
    const writeResult = await Filesystem.writeFile({
      path: 'OCRanslate-ocr-history.json',
      data: jsonStr,
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
    await Toast.show({text: '已成功导出 OCR 记录'});
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
</script>

<style scoped>
#export-and-import-data-page {
  padding: 16px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  box-sizing: border-box;
}
#export-and-import-data-page .btn {
  margin-bottom: 16px;
}
</style>