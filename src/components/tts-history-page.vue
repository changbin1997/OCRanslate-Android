<template>
  <div id="tts-history-page">
    <div class="title-and-count">共包含 {{count}} 条数据</div>
    <div class="table-box">
      <t-table :columns="thead" :data="dataList"></t-table>
    </div>
    <t-button :disabled="btnDisabled" class="btn" @click="getTtsHistory" size="medium" variant="outline" theme="primary" block>加载更多</t-button>
  </div>
</template>

<script setup>
document.title = 'TTS 语音使用记录 - OCRanslate';

import {ref, onMounted} from 'vue';
import data from './../modules/Data.js';
import {Dialog} from '@capacitor/dialog';
import DateTime from './../modules/DateTime.js';
import {Toast} from '@capacitor/toast';

// 数据表的表头
const thead = [
  {colKey: 'api_name', title: 'API名称'},
  {colKey: 'provider', title: '提供商'},
  {colKey: 'word_count', title: '字数'},
  {colKey: 'created', title: '时间'}
];

const dataList = ref([]);  // 数据表
const count = ref(0);  // 数量
let start = 0;  // 起始位置
const btnDisabled = ref(false);

onMounted(async () => {
  await getTtsHistory();
});

/**
 * 获取 TTS 记录
 * @returns {Promise<boolean>}
 */
async function getTtsHistory() {
  if (start > 0 && start >= count.value) {
    await Toast.show({text: '没有更多数据了！'});
    return false;
  }

  btnDisabled.value = true;

  // 获取总数量
  const countResult = await data.getTtsHistoryCount();
  if (countResult.result !== 'success') {
    btnDisabled.value = false;
    await Dialog.alert({
      title: '出错了',
      message: countResult.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  count.value = countResult.count;
  // 如果没有数据就不再获取
  if (count.value < 1) return false;
  // 继续获取记录
  const result = await data.getTtsHistory(start, 20);
  if (result.result !== 'success') {
    btnDisabled.value = false;
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }

  // 日期格式化
  for (let i = 0;i < result.data.length;i ++) {
    result.data[i].created = DateTime.dateFormat('Y年m月d日 H:i:s', result.data[i].created);
  }
  dataList.value.push(...result.data);

  // 起始位置 +20
  start += 20;
  // 根据情况禁用或恢复按钮
  btnDisabled.value = start >= count.value;
}
</script>

<style scoped>
#tts-history-page {
  margin-top: 48px;
  padding: 16px;
}

/*标题和数量区域*/
#tts-history-page .title-and-count {
  padding: 16px 0;
  color: #666666;
}

/*表格区域*/
.table-box {
  margin-bottom: 16px;
}
</style>
