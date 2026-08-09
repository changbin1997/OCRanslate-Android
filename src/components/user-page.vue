<template>
  <div id="user-page">
    <div>
      <t-cell-group bordered>
        <t-cell title="OCR 使用记录" @click="toPage('ocrHistoryPage')" hover />
        <t-cell title="翻译使用记录" @click="toPage('translationHistoryPage')" hover />
        <t-cell title="在线 TTS 语音使用记录" @click="toPage('ttsHistoryPage')" hover />
        <t-cell title="导出和导入记录" @click="toPage('exportAndImportDataPage')" hover />
        <t-cell title="设置" @click="toPage('optionsPage')"  hover />
        <t-cell title="关于" @click="toPage('aboutPage')"  hover />
      </t-cell-group>
    </div>
  </div>
</template>

<script setup>
document.title = '我的 - OCRanslate';

import {useRouter} from 'vue-router';

const router = useRouter();

/**
 * 跳转到指定页面
 * @param pageName
 */
function toPage(pageName) {
  router.push({name: pageName});
}
</script>

<style scoped>
#user-page {
  margin-top: 48px;
  margin-bottom: 56px;
  padding: 16px 0;
  width: 100%;
}
</style>
