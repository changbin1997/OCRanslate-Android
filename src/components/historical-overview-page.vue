<template>
  <div id="historical-overview-page">
    <t-empty :icon="icon.InfoCircleFilledIcon" description="没有数据" v-if="ocrCount.length < 1 && thisMonthOcrCount.length < 1 && translationWordCount.length < 1 && thisMonthTranslationWordCount.length < 1" />

    <!--本月 OCR 使用量-->
    <div class="data-list" v-if="thisMonthOcrCount.length">
      <div class="group-title">本月 OCR 文字识别使用统计</div>
      <div>
        <div :class="`${item.provider}-card card`" v-for="item in thisMonthOcrCount">
          <h3>本月{{item.api_name}}</h3>
          <h1>{{item.count}}</h1>
        </div>
      </div>
    </div>

    <!--OCR总使用量-->
    <div class="data-list" v-if="ocrCount.length">
      <div class="group-title">OCR 文字识别总使用量</div>
      <div>
        <div :class="`${item.provider}-card card`" v-for="item in ocrCount">
          <h3>{{item.api_name}}</h3>
          <h1>{{item.count}}</h1>
        </div>
      </div>
    </div>

    <!--本月翻译字数统计-->
    <div class="data-list" v-if="thisMonthTranslationWordCount.length">
      <div class="group-title">本月翻译字数统计</div>
      <div>
        <div :class="`${item.provider}-card card`" v-for="item in thisMonthTranslationWordCount">
          <h3>本月{{item.api_name}}</h3>
          <h1>{{item.word_count}}</h1>
        </div>
      </div>
    </div>

    <!--翻译字数统计-->
    <div class="data-list" v-if="translationWordCount.length">
      <div class="group-title">翻译总字数统计</div>
      <div>
        <div :class="`${item.provider}-card card`" v-for="item in translationWordCount">
          <h3>{{item.api_name}}</h3>
          <h1>{{item.word_count}}</h1>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
document.title = '历史总览 - OCRanslate';

import {ref, h} from 'vue';
import data from './../modules/Data.js';
import {Dialog} from '@capacitor/dialog';
import DateTime from './../modules/DateTime.js';

// 引入图标
import { InfoCircleFilledIcon } from 'tdesign-icons-vue-next';
// 注册图标
const icon = {
  InfoCircleFilledIcon: h(InfoCircleFilledIcon)
}

const thisMonthOcrCount = ref([]);
const ocrCount = ref([]);
const thisMonthTranslationWordCount = ref([]);
const translationWordCount = ref([]);

getThisMonthOcrCount();
getOcrCount();
getThisMonthTranslationWordCount();
getTranslationWordCount();

/**
 * 获取本月翻译字数统计
 * @returns {Promise<void>}
 */
async function getThisMonthTranslationWordCount() {
  const result = await data.getThisMonthTranslationWordCount(DateTime.getFirstDayOfMonthTimestamp());
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
  }
  thisMonthTranslationWordCount.value = result.data;
}

/**
 * 获取翻译字数统计
 * @returns {Promise<void>}
 */
async function getTranslationWordCount() {
  const result = await data.getTranslationWordCount();
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
  }
  translationWordCount.value = result.data;
}

/**
 * 获取本月 OCR 使用量
 * @returns {Promise<void>}
 */
async function getThisMonthOcrCount() {
  const result = await data.getThisMonthOcrCount(DateTime.getFirstDayOfMonthTimestamp());
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
  }
  thisMonthOcrCount.value = result.data;
}

/**
 * 获取 OCR 总使用量
 * @returns {Promise<void>}
 */
async function getOcrCount() {
  const result = await data.getOcrCount();
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
  }
  ocrCount.value = result.data;
}

</script>

<style>
#historical-overview-page {
  margin: 48px 0 72px 0;
}

/*分组标题*/
.group-title {
  font-size: 16px;
  padding: 16px;
}

/*卡片*/
.card {
  margin: 0 16px 16px 16px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(26, 26, 26, 0.1);
  padding: 16px;
}
.card h3 {
  margin: 0 0 16px 0;
  color: #FFFFFF;
  font-size: 18px;
}
.card h1 {
  color: #FFFFFF;
  margin: 0 0 16px 0;
  font-size: 26px;
}
.baidu-card {
  background: linear-gradient(to right, #005FF7, #00CB5F, #F74D2D);
}
.tencent-card {
  background: linear-gradient(to right, #006EFF, #00A2FF);
}
.ali-card {
  background: #FF6A00;
}
.youdao-card {
  background: #F40119;
}
.xunfei-card {
  background: #0D3552;
}
</style>