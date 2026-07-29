<template>
  <div id="about-page">
    <t-typography-title>关于本软件</t-typography-title>
    <t-typography-paragraph>
      <t-typography-text>这只是我为了个人需求写的一个我自用的软件，OCR 功能需要调用在线的 OCR API 服务，翻译功能也需要调用在线 API。</t-typography-text>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-typography-text>下面是目前支持的 API：</t-typography-text>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <ul>
        <li>百度通用文字识别 - 通用文字识别（标准版）</li>
        <li>百度通用文字识别 - 通用文字识别（高精度版）</li>
        <li>腾讯通用文字识别 - 通用印刷体识别（标准版）</li>
        <li>腾讯通用文字识别 - 通用印刷体识别（高精度版）</li>
        <li>腾讯通用文字识别 - 广告文字识别</li>
        <li>腾讯通用文字识别 - 手写体识别</li>
        <li>腾讯文字识别API2022 - 通用印刷体识别（精简版）</li>
        <li>腾讯文字识别API2022 - 通用印刷体识别（高速版）</li>
        <li>有道智云 - 通用文字识别</li>
        <li>百度翻译 - 通用文本翻译</li>
        <li>腾讯机器翻译 - 文本翻译</li>
        <li>讯飞机器翻译 - 机器翻译</li>
        <li>有道翻译 - 文字翻译</li>
        <li>阿里机器翻译 - 通用翻译</li>
      </ul>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-typography-text>上面是目前支持调用的 API 服务，如果后续找到还可以的提供免费额度的 API 服务，我也会加进去。</t-typography-text>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-typography-text>本软件由 changbin1997 开发，使用 MIT License 开源。</t-typography-text>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-link theme="primary" @click="openUrl('https://github.com/changbin1997')">开发者 Github</t-link>
      <t-link theme="primary" @click="openUrl('https://www.misterma.com/')">开发者博客</t-link>
    </t-typography-paragraph>
    <t-typography-title>API 申请地址</t-typography-title>
    <t-typography-paragraph>
      <t-link theme="primary" @click="openUrl('https://ai.baidu.com/tech/ocr')">百度 OCR</t-link>
      <t-link theme="primary" @click="openUrl('https://cloud.tencent.com/product/ocr-catalog')">腾讯 OCR</t-link>
      <t-link theme="primary" @click="openUrl('https://ai.youdao.com/product-ocr-print.s')">有道智云 OCR</t-link>
      <t-link theme="primary" @click="openUrl('https://ai.aliyun.com/ocr')">阿里云 OCR</t-link>
      <t-link theme="primary" @click="openUrl('https://fanyi-api.baidu.com/')">百度翻译</t-link>
      <t-link theme="primary" @click="openUrl('https://cloud.tencent.com/product/tmt')">腾讯机器翻译</t-link>
      <t-link theme="primary" @click="openUrl('https://www.xfyun.cn/services/xftrans')">讯飞翻译</t-link>
      <t-link theme="primary" @click="openUrl('https://ai.youdao.com/product-fanyi-text.s')">有道翻译</t-link>
      <t-link theme="primary" @click="openUrl('https://www.aliyun.com/product/ai/alimt')">阿里机器翻译</t-link>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-typography-text>下面是在线 API 的免费额度说明：</t-typography-text>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <ul>
        <li>百度通用文字识别：每月 1000 次免费</li>
        <li>腾讯通用文字识别：每月 1000 次免费</li>
        <li>阿里云通用文字识别：每月 200 次免费</li>
        <li>讯飞通用文字识别：注册后免费 10 万次</li>
        <li>百度翻译 - 通用文本翻译：每月 50000 - 1000000 字免费</li>
        <li>腾讯机器翻译 - 文本翻译：每月 500 万字免费</li>
        <li>讯飞机器翻译 - 机器翻译：注册后免费 200 万字符，有效期一年</li>
        <li>阿里机器翻译 - 通用翻译：每月 200 万字免费</li>
      </ul>
    </t-typography-paragraph>
    <t-typography-paragraph>
      <t-typography-text>以上信息写于我开发功能的时候，API 额度可能随时会更改，一切以官网为准。</t-typography-text>
    </t-typography-paragraph>
  </div>
</template>

<script setup>
document.title = '关于 - OCRanslate';

import {Dialog} from '@capacitor/dialog';
import {AppLauncher} from '@capacitor/app-launcher';

/**
 * 通过浏览器打开 URL
 * @param {string} url URL地址
 * @returns {Promise<void>}
 */
async function openUrl(url) {
  try {
    const value = await AppLauncher.canOpenUrl({url: url});
    if (value) {
      await AppLauncher.openUrl({url: url});
    }else {
      await Dialog.alert({
        title: '出错了',
        message: '无法打开链接！',
        buttonTitle: '关闭'
      });
    }
  }catch (error) {
    await Dialog.alert({
      title: '出错了',
      message: error.message,
      buttonTitle: '关闭'
    });
  }
}
</script>

<style scoped>
#about-page {
  margin-top: 48px;
  padding: 16px;
}
</style>