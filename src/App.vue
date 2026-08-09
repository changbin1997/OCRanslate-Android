<template>
  <t-navbar :fixed="true" :title="titleBarName + apiName" left-arrow :leftArrow="showLeftArrow" @left-click="router.back()" />
  <router-view v-if="showPage"></router-view>
  <!--底部标签栏-->
  <t-tab-bar v-model="tabName" theme="tag" :fixed="true" :split="false" @change="changePage" v-show="!showLeftArrow">
    <t-tab-bar-item v-for="item in tabList" :key="item.value" :value="item.value">
      {{ item.label }}
      <template #icon>
        <t-icon :name="item.icon" size="large" />
      </template>
    </t-tab-bar-item>
  </t-tab-bar>
</template>

<script setup>
import {ref, watch, provide, onMounted} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import { Icon as TIcon } from 'tdesign-icons-vue-next';
import {StatusBar, Style} from '@capacitor/status-bar';
import data from './modules/Data.js';
import {Dialog} from '@capacitor/dialog';
import {Toast} from '@capacitor/toast';
import {App} from '@capacitor/app';

// 路由
const router = useRouter();
const route = useRoute();

const titleBarName = ref('OCRanslate');
const tabName = ref(route.name);  // 当前标签栏页面
// 底部标签栏的页面
const tabList = [
  { value: 'ocrPage', label: 'OCR', icon: 'home' },
  { value: 'translatePage', label: '翻译', icon: 'translate' },
  { value: 'historicalOverview', label: '统计', icon: 'tree-catalog' },
  { value: 'userPage', label: '我的', icon: 'user' },
]

// 路由页面名称和标题
const titleList = {
  ocrPage: 'OCR',
  translatePage: '翻译',
  optionsPage: '设置',
  historicalOverview: '统计',
  userPage: '我的',
  aboutPage: '关于',
  exportAndImportDataPage: '导出和导入记录',
  ocrHistoryPage: 'OCR 历史记录',
  translationHistoryPage: '翻译历史记录'
};

const showPage = ref(false);  // 显示页面组件
const translateOcrResult = ref('');  // 要翻译的 OCR 结果
const apiName = ref('');  // 要显示在标题栏的 API 名称
const options = ref(null);  // 选项数据
const autoOpenCamera = ref(false);
const showLeftArrow = ref(false);  // 显示标题栏的返回图标
let lastTimeBackButtonWasPressed = 0;  // 记录点击返回的时间，用于连续点击两次返回关闭程序

// Android 返回事件
App.addListener('backButton', async () => {
  if (showLeftArrow.value) {
    router.back();
  }else {
    // 连续点击两次才退出（两秒内）
    const currentTime = new Date().getTime();
    if (currentTime - lastTimeBackButtonWasPressed < 2000) {
      await App.exitApp();
    } else {
      await Toast.show({text: '再按一次退出应用'});
      lastTimeBackButtonWasPressed = currentTime;
    }
  }
});

watch(() => route.name, newName => {
  // 设置顶部标题栏和底部标签栏
  tabName.value = newName;
  const tabSelected = tabList.find(item => item.value === newName);
  titleBarName.value = titleList[newName];
  // 是否显示返回图标和底部标签栏
  if (['ocrPage', 'translatePage', 'historicalOverview', 'userPage'].indexOf(newName) !== -1) {
    showLeftArrow.value = false;
  }else {
    showLeftArrow.value = true;
  }
  // 如果不是 OCR 和翻译页就清除副标题
  if (newName !== 'ocrPage' && newName !== 'translatePage') {
    apiName.value = '';
  }
});


onMounted(async () => {
  await dataInit();
});


/**
 * 更改要显示在标题栏的 API 名称
 * @param name
 */
function setApiName(name) {
  apiName.value = name;
}


provide('translateOcrResult', {translateOcrResult, changeTranslateOcrResult});
// 标题栏，用于子组件更改标题
provide('titleBarApiName', {setApiName});
// 选项数据
provide('options', {options, updateOptions});
// 启动后自动打开相机
provide('autoOpenCamera', autoOpenCamera);

// 设置状态栏
statusBarStyle();


/**
 * 初始化数据库和获取选项数据
 * @returns {Promise<boolean>}
 */
async function dataInit() {
  // 初始化数据库
  const result = await data.init();
  if (result.result === 'error') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }

  // 获取选项数据
  const optionsData = await data.getOptions();
  if (optionsData.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: optionsData.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  options.value = optionsData.data;
  showPage.value = true;
}

/**
 * 保存设置
 * @returns {Promise<boolean>}
 */
async function updateOptions() {
  const result = await data.updateOptions(options.value);
  if (result.result !== 'success') {
    await Dialog.alert({
      title: '出错了',
      message: result.msg,
      buttonTitle: '关闭'
    });
    return false;
  }
  await Toast.show({text: `有 ${result.count} 个选项已成功保存`});
}

/**
 * 更改要翻译的 OCR 内容
 * @param text
 */
function changeTranslateOcrResult(text) {
  translateOcrResult.value = text;
}

/**
 * 调整状态栏颜色
 * @param {string} backgroundColor 背景颜色
 * @param {string} color 状态栏文字颜色 Light 或 Dark
 * @returns {Promise<void>}
 */
async function statusBarStyle(backgroundColor = '#FFFFFF', color = 'Light') {
  // 禁止状态栏覆盖程序页面
  await StatusBar.setOverlaysWebView({overlay: false});
  await StatusBar.setBackgroundColor({color: backgroundColor});
  // 状态栏文字颜色，Light 和 Dark
  await StatusBar.setStyle({style: Style[color]});
}

/**
 * 切换页面
 * @param pageName 页面名称
 */
function changePage(pageName) {
  router.push({name: pageName});
}
</script>

<style>
body {
  background: #F6F6F6;
  margin: 0;
}

/*让背景透明，避免背景遮住相机画面*/
.transparent-background {
  background: transparent !important;
}

/*禁止文本选中*/
* {
  /* 禁用文本选中 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  /* 禁用 iOS/Android WebKit 长按弹出默认呼出菜单 */
  -webkit-touch-callout: none;
  /* 移除移动端点击元素时的蓝色/灰色高亮遮罩（极具 Web 感） */
  -webkit-tap-highlight-color: transparent;
}
/* 允许输入框、文本域以及标记为可选中的区域正常选中文本 */
input,
textarea,
[contenteditable="true"],
.selectable {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}
</style>